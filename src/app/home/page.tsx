import React from 'react';
import ClientComponent from './ClientComponent';

// サーバーサイドでメッセージを取得
const fetchInitialMessages = async () => {
  const response = await fetch('http://localhost:3000/api/get_messages', {
    cache: 'no-store', // キャッシュを無効化
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  const data = await response.json();
  return data.data;
};

const Home = async () => {
  const initialMessages = await fetchInitialMessages();

  return (
    <div>
      <ClientComponent initialMessages={initialMessages} />
    </div>
  );
};

export default Home;

