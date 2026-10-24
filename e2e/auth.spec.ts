import { expect, test, users } from './support/fixtures'

test.describe('Conta e sessão', () => {
  test('cadastro com validação e conflito @responsive', async ({ app, page }) => {
    await app.goto('/?auth=register')
    const dialog = page.getByRole('dialog')
    const submit = dialog.locator('form').getByRole('button', { name: /Criar (conta|perfil)/ })

    await submit.click()
    await expect(dialog.getByText('Use pelo menos 3 caracteres')).toBeVisible()
    await expect(dialog.getByText('Informe seu e-mail')).toBeVisible()

    await dialog.getByRole('textbox', { name: 'Nome de usuário' }).fill('colecionador')
    await dialog.getByRole('textbox', { name: 'E-mail' }).fill(users.collector.email)
    await dialog.getByLabel('Senha', { exact: true }).fill('Teste1234')
    await dialog.getByLabel('Confirmar senha', { exact: true }).fill('Teste4321')
    await submit.click()
    await expect(dialog.getByText('As senhas não coincidem')).toBeVisible()

    await dialog.getByLabel('Confirmar senha', { exact: true }).fill('Teste1234')
    await submit.click()
    await expect(dialog.getByText('Este nome de usuário já está em uso')).toBeVisible()
    await expect(dialog.getByText('Este e-mail já está cadastrado')).toBeVisible()

    await dialog.getByRole('textbox', { name: 'Nome de usuário' }).fill('nova.pessoa')
    await dialog.getByRole('textbox', { name: 'E-mail' }).fill('nova.pessoa@kurio.test')
    await submit.click()
    await expect(dialog).toBeHidden()
    await expect(app.toast('Conta criada!')).toBeVisible()
  })

  test('login retorna ao fluxo anterior e a sessão sobrevive ao refresh @responsive', async ({ app, page }) => {
    await app.goto('/wallets')
    await expect(page).toHaveURL(/auth=login&redirect=%2Fwallets/)
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox', { name: 'E-mail' }).fill(users.collector.email)
    await dialog.getByLabel('Senha', { exact: true }).fill('senha-errada1')
    await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
    await expect(dialog.getByText('E-mail ou senha inválidos.')).toBeVisible()

    await dialog.getByLabel('Senha', { exact: true }).fill(users.collector.password)
    await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/wallets$/)
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
    await page.reload()
    await app.ready()
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  })

  test('expiração de sessão durante a navegação preserva o destino', async ({ app, page }) => {
    await app.login()
    await app.goto('/profile')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await page.evaluate(() => window.__mocks!.expireSession())
    await page.getByRole('navigation', { name: 'Meu perfil' }).getByRole('link', { name: 'Carteiras' }).click()
    await expect(page).toHaveURL(/auth=login&redirect=%2Fwallets/)
    await expect(app.toast('Sua sessão expirou')).toBeVisible()
  })

  test('logout e troca de usuário limpam dados privados', async ({ app, page }) => {
    await app.login(users.collector)
    await app.goto('/favorites')
    await expect(page.getByRole('heading', { name: 'Sage Nomad #009' })).toBeVisible()

    await page.getByRole('button', { name: users.collector.displayName }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

    await app.login(users.creator)
    await app.goto('/favorites')
    await expect(page.getByText('Você ainda não favoritou nenhum NFT')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sage Nomad #009' })).toHaveCount(0)
    const connections = await app.realtime((realtime) => realtime.connections.map((connection) => connection.userId))
    expect(connections).toEqual(['user-2'])
  })

  test('sessão expira pelo tempo com relógio controlado', async ({ app, page }) => {
    await page.clock.install()
    await app.login()
    await app.goto('/profile')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await page.clock.fastForward('31:00')
    await expect(page).toHaveURL(/auth=login&redirect=%2Fprofile/, { timeout: 10_000 })
  })
})
