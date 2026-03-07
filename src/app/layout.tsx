import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: '오목',
  description: '오프라인과 AI 모드를 지원하는 오목 게임',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
