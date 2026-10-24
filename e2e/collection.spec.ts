import { expect, test } from './support/fixtures'

test.describe('Minha coleção', () => {
  test('lista os NFTs de compras confirmadas e leva ao recibo @responsive', async ({ app, page }) => {
    await app.login()
    await app.goto('/collection')
    await expect(page.getByText('Você ainda não adquiriu nenhum NFT')).toBeVisible()

    await app.addToCart('nft-002', '1-50', 2)
    await app.goto('/checkout')
    await app.confirmPurchase()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 15_000 })
    const orderUrl = page.url()

    await app.goto('/collection')
    const card = page.getByRole('article').filter({ hasText: 'Sage Nomad #009' })
    await expect(card).toBeVisible()
    await expect(card.getByText('x 2')).toBeVisible()
    await expect(page.getByText('2 NFTs adquiridos')).toBeVisible()

    await card.getByRole('link', { name: 'Ver recibo da compra de Sage Nomad #009' }).click()
    await expect(page).toHaveURL(orderUrl)
  })

  test('compra recusada não entra na coleção', async ({ app, page }) => {
    await app.login()
    await app.addToCart('nft-002', '1-50')
    await app.goto('/checkout', { scenario: 'payment-refused' })
    await app.confirmPurchase()
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 15_000 })

    await app.goto('/collection')
    await expect(page.getByText('Você ainda não adquiriu nenhum NFT')).toBeVisible()
  })
})
