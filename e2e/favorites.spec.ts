import { expect, test } from './support/fixtures'

test.describe('Favoritos', () => {
  test('visitante é convidado a entrar @responsive', async ({ app, page }) => {
    await app.goto('/')
    await app.catalogCard('Emerald Ape #042').getByRole('button', { name: 'Entre para favoritar Emerald Ape #042' }).click()
    await expect(page).toHaveURL(/auth=login/)
  })

  test('favoritar é otimista, persiste e falhas fazem rollback com recuperação @responsive', async ({ app, page }) => {
    await app.login()
    await app.goto('/')
    const apeButton = app.catalogCard('Emerald Ape #042').getByRole('button', { name: /lista de interesse/ })
    await expect(apeButton).toHaveAttribute('aria-pressed', 'false')
    await apeButton.click()
    await expect(apeButton).toHaveAttribute('aria-pressed', 'true')
    await expect(app.toast('Emerald Ape #042 entrou na sua lista de interesse.')).toBeVisible()

    await app.setScenario('favorites-error')
    const sageButton = app.catalogCard('Sage Nomad #009').getByRole('button', { name: /lista de interesse/ })
    await expect(sageButton).toHaveAttribute('aria-pressed', 'true')
    const optimisticRemoval = sageButton.evaluate(
      (button) =>
        new Promise<boolean>((resolve) => {
          new MutationObserver(() => {
            if (button.getAttribute('aria-pressed') === 'false') resolve(true)
          }).observe(button, { attributes: true, attributeFilter: ['aria-pressed'] })
        }),
    )
    await sageButton.click()
    expect(await optimisticRemoval).toBe(true)
    const errorToast = app.toast('Não foi possível remover dos favoritos.')
    await expect(errorToast).toBeVisible()
    await expect(sageButton).toHaveAttribute('aria-pressed', 'true')

    await app.setScenario('default')
    await errorToast.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(app.toast('Sage Nomad #009 saiu da sua lista de interesse.')).toBeVisible()
    await expect(sageButton).toHaveAttribute('aria-pressed', 'false')

    await app.goto('/favorites')
    await expect(page.getByText('2 NFTs favoritados')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sage Nomad #009' })).toHaveCount(0)
  })
})
