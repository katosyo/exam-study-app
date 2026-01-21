import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '基本情報・応用情報技術者試験 学習アプリ',
  description: '過去問を4択形式で学習できるWebアプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
