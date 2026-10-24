import { expect, test } from './support/fixtures'

test.describe('Carregamento, falha e recuperação', () => {
  test('skeletons durante carregamento lento @responsive', async ({ app, page }) => {
    await app.goto('/', { scenario: 'slow' })
    await expect(page.getByRole('status', { name: 'Carregando NFTs' }).first()).toBeVisible()
    await expect(page.getByText('72 NFTs encontrados')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('status', { name: 'Carregando NFTs' })).toHaveCount(0)
  })

  test('erro HTTP 500 com recuperação após nova tentativa', async ({ app, page }) => {
    await app.goto('/', { scenario: 'server-error' })
    const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar o catálogo' })
    await expect(alert).toBeVisible({ timeout: 15_000 })
    await app.setScenario('default')
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('72 NFTs encontrados')).toBeVisible()
  })

  test('falha de conexão mostra feedback', async ({ app, page }) => {
    await app.goto('/nfts/nft-001', { scenario: 'offline' })
    await expect(page.getByText('Não foi possível conectar ao servidor.')).toBeVisible({ timeout: 15_000 })
  })

  test('respostas fora de ordem não sobrescrevem a busca atual', async ({ app, page }) => {
    await app.goto('/', { scenario: 'variable-latency' })
    await expect(page.getByText('72 NFTs encontrados')).toBeVisible({ timeout: 15_000 })
    const filters = page.getByRole('complementary', { name: 'Filtros' })
    await filters.getByRole('button', { name: /^Música/ }).click()
    await filters.getByRole('button', { name: /^Fotografia/ }).click()
    await filters.getByRole('button', { name: /^Música/ }).click()
    await expect(page).toHaveURL(/category=photography/)
    await expect(page.getByText('8 NFTs encontrados')).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2_500)
    await expect(page.getByText('8 NFTs encontrados')).toBeVisible()
  })
})
