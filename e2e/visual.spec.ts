import type { Page } from '@playwright/test'
import { expect, test } from './support/fixtures'

const FIXED_NOW = new Date('2026-10-01T15:00:00-03:00')

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    const images = [...document.images]
    images.forEach((image) => {
      image.loading = 'eager'
    })
    await document.fonts.ready
    await Promise.all(
      images.map((image) =>
        image.complete
          ? Promise.resolve()
          : Promise.race([
              new Promise((resolve) => {
                image.addEventListener('load', resolve, { once: true })
                image.addEventListener('error', resolve, { once: true })
              }),
              new Promise((resolve) => setTimeout(resolve, 5_000)),
            ]),
      ),
    )
  })
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
}

const masks = (page: Page) => [page.locator('[data-sonner-toaster]'), page.getByText('Reconectando ao tempo real…')]

test.describe('Regressão visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(FIXED_NOW)
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('início @responsive', async ({ app, page }) => {
    await app.goto('/')
    await settle(page)
    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true, mask: masks(page) })
  })

  test('detalhe do NFT @responsive', async ({ app, page }) => {
    await app.goto('/nfts/nft-001')
    await settle(page)
    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true, mask: masks(page) })
  })

  test('carrinho @responsive', async ({ app, page }) => {
    await app.goto('/')
    await app.addToCart('nft-001', '1-50', 2)
    await app.addToCart('nft-005', '1-10', 2)
    await app.addToCart('nft-006', '1-50', 3)
    await app.goto('/cart')
    await settle(page)
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true, mask: masks(page) })
  })

  test('pagamento @responsive', async ({ app, page }) => {
    await app.login()
    await app.addToCart('nft-001', '1-50', 2)
    await app.addToCart('nft-005', '1-10', 2)
    await app.goto('/checkout')
    await expect(page.getByRole('radio', { name: 'MetaMask' })).toBeChecked()
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true, mask: masks(page) })
  })
})
