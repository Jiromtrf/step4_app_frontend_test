"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

// Suspense 内で使用するコンテンツを別コンポーネントとして定義
function ResultPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const scoreParam = searchParams.get("score");
    const totalParam = searchParams.get("total");

    const score = scoreParam ? parseInt(scoreParam, 10) : 0;
    const total = totalParam ? parseInt(totalParam, 10) : 0;
    const percentage = total > 0 ? (score / total) * 100 : 0;

    const handleReturnHome = () => {
        router.push("/home");
    };

    // パーセンテージに基づいてサウンドを再生
    useEffect(() => {
        let audioSrc = "";
        if (percentage >= 80) {
            audioSrc = "/success.mp3"; // 高得点用
        } else if (percentage >= 50) {
            audioSrc = "/improve.mp3"; // 中間点用
        } else {
            audioSrc = "/try_again.mp3"; // 低得点用
        }

        const audio = new Audio(audioSrc);
        audio.play();
    }, [percentage]);

    // パーセンテージに基づいてメッセージを表示
    const getMessage = () => {
        if (percentage >= 80) {
            return "素晴らしい！高得点おめでとうございます！🎉";
        } else if (percentage >= 50) {
            return "いい感じです！次回も頑張りましょう！💪";
        } else {
            return "もう一度チャレンジしてみましょう！✨";
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-orange-100 text-black">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-md text-center">
                <h1 className="text-2xl font-bold mb-4">テスト完了！🎉</h1>
                <p className="text-lg text-gray-700 mb-4">
                    正解数: {score} / {total}
                </p>
                <p className="text-lg text-gray-700 mb-4">
                    正解率: {percentage.toFixed(2)}%
                </p>
                <p className="text-gray-700 mb-6">
                    {getMessage()}
                </p>
                <button
                    onClick={handleReturnHome}
                    className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600"
                >
                    ホームに戻る
                </button>
            </div>
        </div>
    );
}

export const dynamic = "force-dynamic";

export default function ResultPage() {
    return (
        <Suspense fallback={<div>読み込み中...</div>}>
            <ResultPageContent />
        </Suspense>
    );
}
