import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './support/fixtures'

test.describe('Acessibilidade', () => {
  test('pular para o conteúdo e navegação por teclado', async ({ app, page }) => {
    await app.goto('/')
    await expect(page.getByText('72 NFTs encontrados')).toBeVisible()
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main-content/)

    await page.getByRole('button', { name: 'Buscar NFTs' }).focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Explorar coleções' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('searchbox')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Buscar NFTs' })).toBeFocused()
  })

  test('foco preso no diálogo de login e erros associados aos campos @responsive', async ({ app, page }) => {
    await app.goto('/?auth=login')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    for (let index = 0; index < 15; index += 1) {
      await page.keyboard.press('Tab')
      await expect(dialog.locator(':focus')).toHaveCount(1)
    }
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).last().click()
    const email = dialog.getByRole('textbox', { name: 'E-mail' })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription('Informe seu e-mail')
    await expect(email).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/auth=login/)
  })

  for (const path of ['/', '/nfts/nft-001', '/cart']) {
    test(`sem violações WCAG A/AA detectáveis em ${path}`, async ({ app, page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await app.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([])
    })
  }
})
