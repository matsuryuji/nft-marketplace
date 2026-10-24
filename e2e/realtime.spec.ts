import { expect, test } from './support/fixtures'

test.describe('Tempo real (Socket.IO)', () => {
  test('preço alterado via socket atualiza carrinho e bloqueia checkout com cotação antiga @responsive', async ({ app, page }) => {
    await app.login()
    await app.addToCart('nft-001', '1-50', 2)
    await app.goto('/cart')
    await expect(page.locator('dd[aria-live]').first()).toHaveText('2.396 ETH')

    await app.realtime((realtime) => realtime.updateEdition('nft-001', 'nft-001-1-50', { price: '1.50' }))
    await expect(page.getByText('Preço atualizado de 1.19 ETH para 1.50 ETH.').filter({ visible: true })).toBeVisible()
    await expect(page.locator('dd[aria-live]').first()).toHaveText('3.016 ETH')

    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    const confirm = page.getByRole('button', { name: 'Confirmar compra' })
    await expect(confirm).toBeEnabled()

    await app.realtime((realtime) => realtime.updateEdition('nft-001', 'nft-001-1-50', { price: '1.60' }))
    const alert = page.getByRole('alert').filter({ hasText: 'teve preço ou disponibilidade alterados' })
    await expect(alert).toBeVisible()
    await expect(confirm).toBeDisabled()

    await alert.getByRole('button', { name: 'Atualizar cotação' }).click()
    await expect(page.getByText('Cotação atualizada. Novo total: 3.216 ETH (antes 3.016 ETH).')).toBeVisible()
    await expect(confirm).toBeEnabled()
  })

  test('eventos duplicados ou antigos são ignorados', async ({ app, page }) => {
    await app.goto('/')
    const card = app.catalogCard('Emerald Ape #042')
    await expect(card).toContainText('1.19 ETH')
    await app.realtime((realtime) => realtime.updateEdition('nft-001', 'nft-001-1-50', { price: '1.05' }))
    await expect(card).toContainText('1.05 ETH')
    await app.realtime((realtime) => {
      realtime.replayLast()
      realtime.emitStale('nft-001')
    })
    await page.waitForTimeout(500)
    await expect(card).toContainText('1.05 ETH')
    await expect(card).not.toContainText('999')
  })

  test('desconexão com pedido pendente, reconexão e retomada sem nova compra', async ({ app, page }) => {
    await app.login()
    await app.addToCart('nft-003', '1-50')
    await app.goto('/checkout')
    await app.confirmPurchase()
    await expect(page.getByRole('heading', { name: 'Confirmando sua compra na rede…' })).toBeVisible({ timeout: 15_000 })

    await app.realtime((realtime) => realtime.setAvailable(false))
    await expect(page.getByText('Reconectando ao tempo real…')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 15_000 })

    await page.evaluate(() => window.__mocks!.realtime.setAvailable(true))
    await expect(app.toast('Conexão em tempo real restabelecida.')).toBeVisible({ timeout: 10_000 })
    await page.reload()
    await app.ready()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    expect(await app.orderCount()).toBe(1)
  })
})
