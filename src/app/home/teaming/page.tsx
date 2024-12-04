// teaming/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import styles from "./teaming.module.css";
import Modal from "react-modal"; // react-modal をインポート

// レーダーチャートの動的インポート
const RadarChart = dynamic(() => import("../../components/RadarChart"), { ssr: false });

export default function Teaming() {
  const { data: session } = useSession(); // NextAuthのセッションを取得
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [roles, setRoles] = useState<{
    PdM: any | null,
    Biz: any | null,
    Tech: any | null,
    Design: any | null,
  }>({
    PdM: null,
    Biz: null,
    Tech: null,
    Design: null,
  });
  const [chartData, setChartData] = useState({ biz: 0, design: 0, tech: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    name: "",
    specialties: [] as string[],
    orientations: [] as string[],
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<string[]>([]);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // クライアントサイドでのみアプリ要素を設定
  useEffect(() => {
    const appElement = document.querySelector('#__next');
    if (appElement) {
      Modal.setAppElement('#__next'); // Next.js のルート要素を指定
    } else {
      console.warn("Modal.setAppElement: '#__next' が見つかりません。代わりに 'body' を使用します。");
      Modal.setAppElement('body'); // 代替として 'body' を使用
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      if (!session || !session.accessToken) {
        console.error("セッションがありません");
        return;
      }

      const response = await axios.get(`${baseUrl}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      setCurrentUser(response.data);
    } catch (err: any) {
      console.error("Failed to fetch current user:", err.response?.data || err.message || err);
    }
  };

  const fetchTeamInfo = async () => {
    try {
      const teamId = 1; // 仮のチームID、必要に応じて動的に設定
      const response = await axios.get(`${baseUrl}/api/team/${teamId}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      const teamMembers = response.data;
      const newRoles: any = { PdM: null, Biz: null, Tech: null, Design: null };

      teamMembers.forEach((member: any) => {
        if (newRoles[member.role]) {
          // 既にメンバーが存在する場合、配列として保持
          if (Array.isArray(newRoles[member.role])) {
            newRoles[member.role].push(member);
          } else {
            newRoles[member.role] = [newRoles[member.role], member];
          }
        } else {
          newRoles[member.role] = member;
        }
      });

      setRoles(newRoles);

      // レーダーチャートのデータを集計
      const aggregated = teamMembers.reduce((acc: any, member: any) => {
        acc.biz += member.biz || 0;
        acc.design += member.design || 0;
        acc.tech += member.tech || 0;
        return acc;
      }, { biz: 0, design: 0, tech: 0 });

      setChartData(aggregated);
    } catch (err: any) {
      console.error("Failed to fetch team info:", err.response?.data || err.message || err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [session]);

  useEffect(() => {
    if (currentUser) {
      fetchTeamInfo();
    }
  }, [currentUser]);

  const handleAddMemberClick = (role: string) => {
    // ログインユーザーが既に他の役割に登録されているか確認
    const isUserInAnyRole = Object.values(roles).some(roleData => {
      if (Array.isArray(roleData)) {
        return roleData.some(member => member.user_id === currentUser.user_id);
      }
      return roleData?.user_id === currentUser.user_id;
    });

    if (isUserInAnyRole) {
      if (confirm("既に他の役割に登録されています。メンバーを追加しますか？")) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.post(`${baseUrl}/api/user/search`, searchFilters, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      setSearchResults(response.data.data);

      // "おすすめ" ユーザーのラベル付け
      const teamId = 1; // 仮のチームID
      const teamInfoResponse = await axios.get(`${baseUrl}/api/team/${teamId}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      const teamInfo = teamInfoResponse.data;

      // 未登録の役割と一致する志向性を持つユーザーをおすすめとする
      const unfilledRoles = ["PdM", "Biz", "Tech", "Design"].filter(role => !roles[role]);
      const recommended = response.data.data.filter((user: any) => {
        return unfilledRoles.some(role => user.orientations.includes(role));
      }).map((user: any) => user.user_id);

      setRecommendedUsers(recommended);
    } catch (err: any) {
      console.error("Failed to search users:", err.response?.data || err.message || err);
    }
  };

  const handleSelectUser = async (role: string, user: any) => {
    try {
      const teamId = 1; // 仮のチームID
      await axios.post(`${baseUrl}/api/team/add_member`, {
        team_id: teamId,
        role: role,
        user_id: user.user_id
      }, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      alert("メンバーを追加しました");
      setIsModalOpen(false);
      fetchTeamInfo();
    } catch (err: any) {
      console.error("Failed to add team member:", err.response?.data || err.message || err);
      alert("メンバーの追加に失敗しました");
    }
  };

  const handleRemoveMember = async (role: string, user: any) => {
    if (confirm("メンバーから外しますか？")) {
      try {
        const teamId = 1; // 仮のチームID
        await axios.delete(`${baseUrl}/api/team/remove_member`, {
          data: {
            team_id: teamId,
            role: role
          },
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        alert("メンバーを削除しました");
        fetchTeamInfo();
      } catch (err: any) {
        console.error("Failed to remove team member:", err.response?.data || err.message || err);
        alert("メンバーの削除に失敗しました");
      }
    }
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h2>チーム</h2>
        <ul>
          <li className={styles.active}>チーム構成</li>
          <li>メンバー募集</li>
          <li>メンバー検索</li>
          <li>プロフィール</li>
          <li>メッセージ</li>
        </ul>
      </aside>

      <main className={styles.main}>
        <div className={styles.roles}>
          {["PdM", "Biz", "Tech", "Design"].map((role) => (
            <div key={role} className={styles.roleCard}>
              <div className={styles.roleHeader} style={{ backgroundColor: getRoleColor(role) }}>
                {role}
                <button onClick={() => handleAddMemberClick(role)} className={styles.addButton}>
                  +
                </button>
              </div>
              {roles[role] && (
                <div className={styles.roleDetails}>
                  {Array.isArray(roles[role]) ? (
                    roles[role].map((member: any) => (
                      <div key={member.user_id} className={styles.member}>
                        <img
                          src={member.avatar_url || "/default-avatar.png"}
                          alt={member.name}
                          className={styles.avatar}
                        />
                        <p>{member.name}</p>
                        <button onClick={() => handleRemoveMember(role, member)}>メンバーを外す</button>
                      </div>
                    ))
                  ) : (
                    <div className={styles.member}>
                      <img
                        src={roles[role]?.avatar_url || "/default-avatar.png"}
                        alt={roles[role]?.name}
                        className={styles.avatar}
                      />
                      <p>{roles[role]?.name}</p>
                      <button onClick={() => handleRemoveMember(role, roles[role])}>メンバーを外す</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.chartContainer}>
          <RadarChart skills={chartData} />
        </div>
      </main>

      {/* メンバー検索モーダル */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="メンバー検索"
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        <h2>メンバーを追加</h2>
        <div className={styles.searchFilters}>
          <input
            type="text"
            placeholder="名前で検索"
            value={searchFilters.name}
            onChange={(e) => setSearchFilters({ ...searchFilters, name: e.target.value })}
          />
          {/* 得意分野と志向性の選択肢は動的に生成することを推奨 */}
          <select
            multiple
            value={searchFilters.specialties}
            onChange={(e) => {
              const options = e.target.options;
              const selected: string[] = [];
              for (let i = 0; i < options.length; i++) {
                if (options[i].selected) {
                  selected.push(options[i].value);
                }
              }
              setSearchFilters({ ...searchFilters, specialties: selected });
            }}
          >
            <option value="Tech">Tech</option>
            <option value="Design">Design</option>
            <option value="Biz">Biz</option>
          </select>
          <select
            multiple
            value={searchFilters.orientations}
            onChange={(e) => {
              const options = e.target.options;
              const selected: string[] = [];
              for (let i = 0; i < options.length; i++) {
                if (options[i].selected) {
                  selected.push(options[i].value);
                }
              }
              setSearchFilters({ ...searchFilters, orientations: selected });
            }}
          >
            <option value="Tech">Tech</option>
            <option value="Design">Design</option>
            <option value="Biz">Biz</option>
            <option value="PdM">PdM</option>
          </select>
          <button onClick={handleSearch}>検索</button>
        </div>
        <div className={styles.searchResults}>
          {searchResults.map((user) => (
            <div key={user.user_id} className={styles.searchResult}>
              <img src={user.avatar_url || "/default-avatar.png"} alt={user.name} className={styles.avatar} />
              <div>
                <p><strong>{user.name}</strong></p>
                <p>得意分野: {user.specialties.join(", ")}</p>
                <p>志向性: {user.orientations.join(", ")}</p>
                <p>コアタイム: {user.core_time}</p>
              </div>
              {recommendedUsers.includes(user.user_id) && <span className={styles.recommended}>おすすめ</span>}
              <button onClick={() => handleSelectUser("Biz", user)}>追加</button> {/* 役割は選択可能にする必要あり */}
            </div>
          ))}
        </div>
        <button onClick={() => setIsModalOpen(false)}>閉じる</button>
      </Modal>
    </div>
  );
}

// 役割ごとの色を取得する関数
const getRoleColor = (role: string): string => {
  switch (role) {
    case "PdM":
      return "#FFCCCC";
    case "Biz":
      return "#FFCCFF";
    case "Tech":
      return "#CCCCFF";
    case "Design":
      return "#CCFFCC";
    default:
      return "#FFFFFF";
  }
};