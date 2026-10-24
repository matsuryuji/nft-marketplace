import { expect, test } from './support/fixtures'

const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('Perfil e carteiras', () => {
  test.beforeEach(async ({ app }) => {
    await app.login()
  })

  test('edição do perfil, avatar e senha com erros de validação @responsive', async ({ app, page }) => {
    await app.goto('/profile')
    const displayName = page.getByRole('textbox', { name: 'Nome de exibição' })
    await expect(displayName).toHaveValue('Colecionador Kurio')

    await displayName.fill('A')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Informe seu nome de exibição')).toBeVisible()

    await displayName.fill('Nova Colecionadora')
    await page.getByLabel('Senha atual', { exact: true }).fill('errada123')
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha1')
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha1')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Senha atual incorreta')).toBeVisible()

    await page.getByLabel('Senha atual', { exact: true }).fill('Kurio@2026')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(app.toast('Perfil e senha atualizados.')).toBeVisible()

    await page.locator('input[type=file]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_PIXEL })
    await expect(page.getByRole('img', { name: 'Avatar de Nova Colecionadora' })).toHaveAttribute('src', /^data:image\/webp/)

    await page.locator('input[type=file]').setInputFiles({ name: 'doc.txt', mimeType: 'text/plain', buffer: Buffer.from('x') })
    await expect(page.getByText('Envie uma imagem PNG, JPG ou WebP.')).toBeVisible()

    await page.reload()
    await app.ready()
    await expect(displayName).toHaveValue('Nova Colecionadora')
    const login = await app.api('POST', '/session', { email: 'colecionador@kurio.test', password: 'NovaSenha1' })
    expect(login.status).toBe(200)
  })

  test('carteiras principal e secundária com validação e conflito', async ({ app, page }) => {
    const remove = await app.api('PUT', '/wallets/secondary', null)
    expect(remove.status).toBe(422)
    await app.goto('/wallets')
    const secondary = page.getByRole('region', { name: 'Carteira secundária' })
    const address = secondary.getByRole('textbox', { name: 'Endereço da carteira' })
    await address.fill('0x123')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(secondary.getByText('Informe um endereço 0x com 40 caracteres hexadecimais')).toBeVisible()

    await address.fill('0xA91F3b7c2D4e5F60718293a4B5c6D7e8F901E82C')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(secondary.getByText('Este endereço já está cadastrado em outra carteira')).toBeVisible()

    await address.fill('0x2222222222222222222222222222222222222222')
    await secondary.getByRole('textbox', { name: 'Nome da carteira' }).fill('Cofre frio')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(app.toast('Carteira secundária salva.')).toBeVisible()
    await page.reload()
    await app.ready()
    await expect(secondary.getByRole('textbox', { name: 'Nome da carteira' })).toHaveValue('Cofre frio')
  })
})
