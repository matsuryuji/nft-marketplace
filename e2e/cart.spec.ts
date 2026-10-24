import { expect, test, users } from './support/fixtures'

test.describe('Carrinho', () => {
  test('adicionar pelo detalhe, quantidades, cupom e remoção @responsive', async ({ app, page }) => {
    await app.goto('/nfts/nft-001')
    await page.getByRole('button', { name: app.isMobile ? 'Comprar NFT' : 'Comprar', exact: true }).click()
    await expect(page).toHaveURL(/\/cart$/)

    await app.goto('/nfts/nft-002')
    await page.getByRole('button', { name: app.isMobile ? 'Comprar NFT' : 'Comprar', exact: true }).click()
    await expect(page).toHaveURL(/\/cart$/)

    const total = page.locator('dd[aria-live]').first()
    await expect(total).toHaveText('2.896 ETH')

    await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
    await expect(total).toHaveText('4.086 ETH')

    const coupon = page.getByRole('textbox', { name: 'Código promocional' })
    for (const [code, message] of [
      ['ERRADO', 'Código promocional inválido.'],
      ['BEMVINDO', 'Este código promocional expirou.'],
    ] as const) {
      await coupon.fill(code)
      await page.getByRole('button', { name: 'Aplicar' }).click()
      await expect(page.getByRole('alert').filter({ hasText: message })).toBeVisible()
    }
    await coupon.fill('KURIO10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('button', { name: 'Remover o cupom KURIO10' })).toBeVisible()
    await expect(total).toHaveText('3.679 ETH')

    await page.getByRole('button', { name: /^Remover Sage Nomad #009/ }).click()
    await expect(page.getByRole('link', { name: 'Sage Nomad #009' })).toHaveCount(0)
    await expect(total).toHaveText('2.158 ETH')
  })

  test('carrinho do visitante persiste após refresh e é mantido no login', async ({ app, page }) => {
    await app.goto('/')
    await app.addToCart('nft-003', '1-50', 2)
    await app.goto('/cart')
    await expect(page.getByRole('link', { name: 'Neon Vessel #552' })).toBeVisible()
    await page.reload()
    await app.ready()
    await expect(page.getByRole('link', { name: 'Neon Vessel #552' })).toBeVisible()

    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/auth=login&redirect=%2Fcheckout/)
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox', { name: 'E-mail' }).fill(users.collector.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(users.collector.password)
    await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByRole('region', { name: 'Seus NFTs' }).getByText('Neon Vessel #552')).toBeVisible()
  })

  test('quantidade acima do disponível é recusada pela API', async ({ app, page }) => {
    await app.goto('/')
    const response = await app.api('POST', '/cart/items', { nftId: 'nft-001', editionId: 'nft-001-1-1', quantity: 2 })
    expect(response.status).toBe(409)
    await app.goto('/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })
})
