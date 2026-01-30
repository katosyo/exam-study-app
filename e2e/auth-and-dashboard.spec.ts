import { test, expect } from '@playwright/test'

test.describe('ログイン → ホーム → ダッシュボード', () => {
  test('ログインしてホームを表示し、問題を解くへ遷移できる', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /ログイン/ })).toBeVisible()

    await page.getByLabel(/メールアドレス/).fill('test@example.com')
    await page.getByLabel(/パスワード/).fill('password123')
    await page.getByRole('button', { name: /ログイン/ }).click()

    await expect(page).toHaveURL(/\/home/)
    await expect(page.getByText('IT試験学習アプリ')).toBeVisible()

    await page.getByRole('link', { name: /問題を解く/ }).click()
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/試験を選択|問題を読み込み中|FE|AP/)).toBeVisible()
  })
})
