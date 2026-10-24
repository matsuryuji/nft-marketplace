import { expect, test } from './support/fixtures'

test.describe('Detalhe do NFT', () => {
  test('acesso direto, edição e limite de quantidade @responsive', async ({ app, page }) => {
    await app.goto('/nfts/nft-001')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByRole('radio', { name: /^1\/50/ })).toBeChecked()

    const quantity = app.isMobile ? page.locator('.fixed.bottom-0') : page.locator('main article')
    const increase = quantity.getByRole('button', { name: 'Aumentar quantidade' }).first()
    for (let click = 0; click < 8; click += 1) {
      if (await increase.isDisabled()) break
      await increase.click()
    }
    await expect(increase).toBeDisabled()
    await expect(quantity.getByText('Limite de 5 por pedido nesta edição.').first()).toBeVisible()

    await page.getByRole('radio', { name: /^1\/10\b/ }).check({ force: true })
    await expect(page).toHaveURL(/edition=nft-001-1-10/)
  })

  test('edição indisponível pedida pela URL cai na próxima disponível', async ({ app, page }) => {
    await app.goto('/nfts/nft-013?edition=nft-013-1-1')
    await expect(page.getByText('A edição solicitada está indisponível.')).toBeVisible()
    await expect(page.getByRole('radio', { name: /^1\/1 \(esgotada\)/ })).toBeDisabled()
    await expect(page.getByRole('radio', { name: /^1\/50/ })).toBeChecked()
  })

  test('NFT inexistente e rota inexistente mostram 404 @responsive', async ({ app, page }) => {
    await app.goto('/nfts/nao-existe')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await app.goto('/rota/que/nao/existe')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })

  test('abas e avaliações carregam sob demanda', async ({ app, page }) => {
    await app.goto('/nfts/nft-001')
    const reviewsTab = page.getByRole('tab', { name: 'Avaliações de colecionadores (19)' })
    await reviewsTab.click()
    await expect(page.getByText('4,8 de 5 · 19 avaliações')).toBeVisible()
    await expect(page.getByRole('tabpanel').getByRole('listitem')).toHaveCount(19)
  })
})
