import { expect, test } from './support/fixtures'

test.describe('Compra completa', () => {
  test('do catálogo ao recibo confirmado @responsive', async ({ app, page }) => {
    await app.login()
    await app.goto('/')
    await app.catalogCard('Emerald Ape #042').getByRole('link', { name: 'Emerald Ape #042' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await page.getByRole('button', { name: app.isMobile ? 'Comprar NFT' : 'Comprar', exact: true }).click()
    await expect(page).toHaveURL(/\/cart$/)

    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByRole('radio', { name: 'MetaMask' })).toBeChecked()
    await app.confirmPurchase()

    const dialog = page.getByRole('dialog', { name: 'Confirmando sua compra' })
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(/\/orders\/order-/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Transação confirmada na Ethereum.', { exact: false })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute('href', /sepolia\.etherscan\.io\/tx\/0x/)
    await expect(page.getByRole('main').getByRole('article').getByText('Emerald Ape #042', { exact: true })).toBeVisible()

    const cart = await app.api<{ itemCount: number }>('GET', '/cart')
    expect(cart.body.itemCount).toBe(0)
    expect(await app.orderCount()).toBe(1)
  })

  test('pedido pendente é recuperado após refresh com relógio controlado', async ({ app, page }) => {
    await page.clock.install()
    await app.login()
    await app.addToCart('nft-002', '1-50')
    await app.goto('/checkout')
    await app.confirmPurchase()
    await expect(page.getByRole('heading', { name: 'Confirmando sua compra na rede…' })).toBeVisible({ timeout: 15_000 })
    const orderUrl = page.url()

    await page.reload()
    await app.ready()
    await expect(page).toHaveURL(orderUrl)
    await expect(page.getByRole('heading', { name: 'Confirmando sua compra na rede…' })).toBeVisible()
    await page.clock.fastForward(5_000)
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    expect(await app.orderCount()).toBe(1)
  })
})
