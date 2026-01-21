export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🎓 基本情報・応用情報技術者試験 学習アプリ</h1>
      <p>AWS Amplify Hosting のテストページです</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>📋 機能</h2>
        <ul>
          <li>過去問を4択形式で出題</li>
          <li>回答後に正誤判定と解説表示</li>
          <li>試験種別（FE/AP）と出題数を指定可能</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <p>✅ Amplify Hosting が正常に動作しています！</p>
        <p>デプロイ日時: {new Date().toLocaleString('ja-JP')}</p>
      </div>
    </main>
  )
}
