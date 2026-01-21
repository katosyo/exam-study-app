/**
 * サンプルデータ投入スクリプト
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { toDynamoDB } from '../src/domain/question'
import type { Question } from '../src/domain/question'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const tableName = process.env.QUESTIONS_TABLE_NAME || 'exam-study-app-Questions'

// サンプル問題データ
const sampleQuestions: Omit<Question, 'id'>[] = [
  // FE 問題
  {
    examType: 'FE',
    year: '2023',
    questionNumber: '001',
    text: 'データベースの正規化に関する次の記述のうち、適切なものはどれか。',
    choices: [
      '第1正規形は繰り返しグループを持たない',
      '第2正規形は部分関数従属を持つ',
      '第3正規形は推移的関数従属を持つ',
      'ボイスコッド正規形は候補キーを持たない',
    ],
    answerIndex: 0,
    explanation: '第1正規形は、繰り返しグループを排除し、各フィールドがアトミックな値を持つ状態を指します。',
    category: 'データベース',
  },
  {
    examType: 'FE',
    year: '2023',
    questionNumber: '002',
    text: 'OSのメモリ管理に関する次の記述のうち、適切なものはどれか。',
    choices: [
      '仮想メモリは物理メモリより小さい',
      'ページングは固定長のメモリ管理',
      'スワッピングはプロセス単位で行う',
      'セグメンテーションは連続領域が必須',
    ],
    answerIndex: 1,
    explanation: 'ページングは、メモリを固定長のページという単位に分割して管理する方式です。',
    category: 'オペレーティングシステム',
  },
  {
    examType: 'FE',
    year: '2023',
    questionNumber: '003',
    text: 'TCP/IPのトランスポート層に関する次の記述のうち、適切なものはどれか。',
    choices: [
      'TCPはコネクションレス型プロトコルである',
      'UDPは信頼性のある通信を保証する',
      'TCPはフロー制御機能を持つ',
      'UDPはTCPより処理が重い',
    ],
    answerIndex: 2,
    explanation: 'TCPはコネクション型プロトコルで、フロー制御やエラー制御などの信頼性のある通信を実現します。',
    category: 'ネットワーク',
  },
  {
    examType: 'FE',
    year: '2023',
    questionNumber: '004',
    text: 'オブジェクト指向プログラミングの特徴に関する次の記述のうち、適切なものはどれか。',
    choices: [
      'カプセル化はデータと処理を分離する',
      '継承は既存クラスの機能を再利用できる',
      'ポリモーフィズムは型の厳密性を高める',
      '抽象クラスは必ずインスタンス化できる',
    ],
    answerIndex: 1,
    explanation: '継承は、既存のクラスを元に新しいクラスを定義し、機能を再利用できるオブジェクト指向の特徴です。',
    category: 'プログラミング',
  },
  {
    examType: 'FE',
    year: '2023',
    questionNumber: '005',
    text: 'アルゴリズムの計算量に関する次の記述のうち、適切なものはどれか。',
    choices: [
      'バブルソートの平均計算量はO(n log n)である',
      'クイックソートの最悪計算量はO(n²)である',
      '線形探索の計算量はO(log n)である',
      '二分探索の計算量はO(n)である',
    ],
    answerIndex: 1,
    explanation: 'クイックソートは平均O(n log n)ですが、最悪の場合（既にソート済みなど）はO(n²)になります。',
    category: 'アルゴリズム',
  },
  // AP 問題
  {
    examType: 'AP',
    year: '2023',
    questionNumber: '001',
    text: 'ACID特性に関する次の記述のうち、適切なものはどれか。',
    choices: [
      'Atomicityは一貫性を保証する',
      'Consistencyは分離性を保証する',
      'Isolationは同時実行制御を保証する',
      'Durabilityは原子性を保証する',
    ],
    answerIndex: 2,
    explanation: 'Isolation（分離性）は、複数のトランザクションが同時に実行されても、互いに影響を与えないことを保証します。',
    category: 'データベース',
  },
  {
    examType: 'AP',
    year: '2023',
    questionNumber: '002',
    text: 'デザインパターンに関する次の記述のうち、適切なものはどれか。',
    choices: [
      'Singletonは複数のインスタンスを生成する',
      'Factoryはオブジェクト生成を抽象化する',
      'Observerは継承関係を表現する',
      'Strategyはオブジェクトの構造を定義する',
    ],
    answerIndex: 1,
    explanation: 'Factoryパターンは、オブジェクトの生成処理を抽象化し、具体的な生成方法を隠蔽するデザインパターンです。',
    category: 'ソフトウェア設計',
  },
  {
    examType: 'AP',
    year: '2023',
    questionNumber: '003',
    text: 'ネットワークセキュリティに関する次の記述のうち、適切なものはどれか。',
    choices: [
      'ファイアウォールは暗号化を行う',
      'VPNは仮想プライベートネットワークを構築する',
      'IDSは侵入を防止する',
      'IPSecはアプリケーション層のプロトコル',
    ],
    answerIndex: 1,
    explanation: 'VPN（Virtual Private Network）は、公衆ネットワーク上に仮想的なプライベートネットワークを構築する技術です。',
    category: 'ネットワーク',
  },
]

async function seedData() {
  console.log(`Seeding data to table: ${tableName}`)

  for (const q of sampleQuestions) {
    const question: Question = {
      ...q,
      id: `QUESTION#${q.year}#${q.questionNumber}`,
    }

    const item = toDynamoDB(question)

    try {
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      )
      console.log(`✓ ${question.id}`)
    } catch (error) {
      console.error(`✗ ${question.id}:`, error)
    }
  }

  console.log('Done!')
}

seedData()
