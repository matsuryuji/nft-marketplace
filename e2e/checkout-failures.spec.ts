import { expect, test } from './support/fixtures'

test.describe('Falhas no pagamento', () => {
  test.beforeEach(async ({ app }) => {
    await app.login()
    await app.addToCart('nft-002', '1-50')
  })

  test('pagamento recusado preserva o carrinho', async ({ app, page }) => {
    await app.goto('/checkout', { scenario: 'payment-refused' })
    await app.confirmPurchase()
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Não gerada')).toBeVisible()
    const cart = await app.api<{ itemCount: number }>('GET', '/cart')
    expect(cart.body.itemCount).toBe(1)
  })

  test('clique repetido cria um único pedido', async ({ app, page }) => {
    await app.goto('/checkout')
    const confirm = page.getByRole('button', { name: 'Confirmar compra' })
    await expect(confirm).toBeEnabled()
    await confirm.dblclick()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/orders\/order-/, { timeout: 15_000 })
    expect(await app.orderCount()).toBe(1)
  })

  test('timeout após criação recupera o mesmo pedido por idempotência', async ({ app, page }) => {
    test.setTimeout(60_000)
    await app.goto('/checkout', { scenario: 'order-timeout' })
    await app.confirmPurchase()
    await expect(page.getByText('Verificando se o pedido já foi criado', { exact: false })).toBeVisible({ timeout: 20_000 })
    await expect(page).toHaveURL(/\/orders\/order-/, { timeout: 20_000 })
    expect(await app.orderCount()).toBe(1)
  })

  test('carteira recusa a conexão e a nova tentativa conclui', async ({ app, page }) => {
    await app.goto('/checkout', { scenario: 'wallet-rejected' })
    await app.confirmPurchase()
    const dialog = page.getByRole('dialog', { name: 'Conexão recusada' })
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await app.setScenario('default')
    await dialog.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page).toHaveURL(/\/orders\/order-/, { timeout: 15_000 })
  })

  test('preço alterado ao confirmar exige nova confirmação', async ({ app, page }) => {
    await app.goto('/checkout', { scenario: 'checkout-price-change' })
    await app.confirmPurchase()
    const review = page.getByRole('dialog', { name: 'Valores atualizados' })
    await expect(review).toBeVisible({ timeout: 10_000 })
    await expect(review.getByText('Sage Nomad #009 (1/50): 1.69 ETH → 1.859 ETH')).toBeVisible()
    expect(await app.orderCount()).toBe(0)
    await review.getByRole('button', { name: 'Confirmar novo total' }).click()
    await expect(page).toHaveURL(/\/orders\/order-/, { timeout: 15_000 })
    expect(await app.orderCount()).toBe(1)
  })

  test('edição esgotada ao confirmar bloqueia a compra', async ({ app, page }) => {
    await app.goto('/checkout', { scenario: 'checkout-sold-out' })
    await app.confirmPurchase()
    await expect(page.getByRole('dialog', { name: 'Não foi possível concluir' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('link', { name: 'Revisar carrinho' })).toBeVisible()
    expect(await app.orderCount()).toBe(0)
  })
})
