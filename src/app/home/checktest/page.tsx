"use client";

import { useSession } from "next-auth/react";

export default function Example() {
  const { data: session } = useSession();

  console.log("Session Data:", session); // セッション情報をログ出力
  console.log("Access Token:", session?.accessToken); // アクセストークンをログ出力

  return <div>Check Console Logs for Session Info</div>;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
console.log("Base URL:", baseUrl);
