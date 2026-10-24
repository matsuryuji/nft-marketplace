import { expect, test } from './support/fixtures'

test.describe('Catálogo', () => {
  test('busca, filtros combinados, ordenação, paginação e histórico @responsive', async ({ app, page }) => {
    await app.goto('/')
    const results = page.getByText(/NFTs? encontrados?$/)
    await expect(results).toHaveText('72 NFTs encontrados')

    if (app.isMobile) {
      await page.getByRole('searchbox', { name: 'Explorar coleções' }).fill('emerald')
    } else {
      await page.getByRole('button', { name: 'Buscar NFTs' }).click()
      await page.getByRole('dialog').getByRole('searchbox').fill('emerald')
      await page.getByRole('dialog').getByRole('button', { name: 'Buscar' }).click()
    }
    await expect(page).toHaveURL(/q=emerald/)
    await expect(results).toHaveText('6 NFTs encontrados')

    const filters = app.isMobile ? page.getByRole('dialog') : page.getByRole('complementary', { name: 'Filtros' })
    if (app.isMobile) await page.getByRole('button', { name: 'Filtros', exact: true }).first().click()
    await filters.getByRole('button', { name: /^Arte digital/ }).click()
    await expect(page).toHaveURL(/category=digital-art/)
    await filters.getByRole('button', { name: /^Ethereum/ }).click()
    await expect(page).toHaveURL(/network=ethereum/)
    if (app.isMobile) await page.keyboard.press('Escape')

    await page.goto('/?sort=price-asc')
    await app.ready()
    await expect(results).toHaveText('72 NFTs encontrados')
    const firstPrice = page.locator('#catalogo article').first()
    await expect(firstPrice).toContainText('0.02 ETH')

    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')

    await page.goBack()
    await expect(page).not.toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    await page.goForward()
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  })

  test('filtros reiniciam a paginação e sobrevivem ao refresh', async ({ app, page }) => {
    await app.goto('/?page=3')
    await expect(page.getByRole('link', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
    await page.getByRole('complementary', { name: 'Filtros' }).getByRole('button', { name: /^Música/ }).click()
    await expect(page).toHaveURL(/category=music/)
    await expect(page).not.toHaveURL(/page=3/)
    await page.getByRole('link', { name: 'Novos lançamentos' }).click()
    await expect(page).toHaveURL(/tab=new/)
    await page.reload()
    await app.ready()
    await expect(page.getByRole('complementary', { name: 'Filtros' }).getByRole('button', { name: /^Música/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('link', { name: 'Novos lançamentos' })).toHaveAttribute('aria-current', 'true')
  })

  test('resultado vazio oferece limpar filtros', async ({ app, page }) => {
    await app.goto('/?q=inexistente-xyz')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).last().click()
    await expect(page.getByText('72 NFTs encontrados')).toBeVisible()
  })

  test('cenário de catálogo vazio', async ({ app, page }) => {
    await app.goto('/', { scenario: 'empty' })
    await expect(page.getByText('Ainda não há itens nesta seção.')).toBeVisible()
  })
})
