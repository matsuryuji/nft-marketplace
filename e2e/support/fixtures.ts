import { test as base, expect, type Page } from '@playwright/test'

export const users = {
  collector: { email: 'colecionador@kurio.test', password: 'Kurio@2026', displayName: 'Colecionador Kurio' },
  creator: { email: 'criadora@kurio.test', password: 'Kurio@2026', displayName: 'Criadora Kurio' },
} as const

type User = (typeof users)[keyof typeof users]

type MockControls = {
  scenario: string
  setScenario: (id: string) => void
  reset: () => void
  expireSession: () => void
  realtime: {
    connections: { id: string; userId: string | null }[]
    updateEdition: (nftId: string, editionId: string, patch: { price?: string; available?: number }) => unknown
    replayLast: () => string | null
    emitStale: (nftId: string) => string
    disconnectAll: () => void
    setAvailable: (next: boolean) => void
  }
}

declare global {
  interface Window {
    __mocks?: MockControls
  }
}

export class App {
  readonly page: Page
  readonly isMobile: boolean

  constructor(page: Page, isMobile: boolean) {
    this.page = page
    this.isMobile = isMobile
  }

  async goto(path: string, options?: { scenario?: string }) {
    const url = options?.scenario ? `${path}${path.includes('?') ? '&' : '?'}mock-scenario=${options.scenario}` : path
    await this.page.goto(url)
    await this.ready()
  }

  async ready() {
    await this.page.waitForFunction(() => Boolean(window.__mocks))
  }

  async setScenario(id: string) {
    await this.page.evaluate((scenario) => window.__mocks!.setScenario(scenario), id)
  }

  async api<T = unknown>(method: string, path: string, body?: unknown, headers?: Record<string, string>) {
    return this.page.evaluate(
      async ({ method, path, body, headers }) => {
        const response = await fetch(`/api${path}`, {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
        const text = await response.text()
        return { status: response.status, body: (text ? JSON.parse(text) : null) as unknown }
      },
      { method, path, body, headers },
    ) as Promise<{ status: number; body: T }>
  }

  async login(user: User = users.collector) {
    if (!(await this.page.evaluate(() => Boolean(window.__mocks)))) await this.goto('/')
    const response = await this.api('POST', '/session', { email: user.email, password: user.password })
    expect(response.status).toBe(200)
  }

  async addToCart(nftId: string, editionKey: string, quantity = 1) {
    const response = await this.api('POST', '/cart/items', { nftId, editionId: `${nftId}-${editionKey}`, quantity })
    expect(response.status).toBe(201)
  }

  async realtime<T>(fn: (controls: MockControls['realtime']) => T) {
    await this.page.waitForFunction(() => (window.__mocks?.realtime.connections.length ?? 0) > 0)
    return this.page.evaluate(`(${fn.toString()})(window.__mocks.realtime)`) as Promise<T>
  }

  async orderCount() {
    return this.page.evaluate(() => {
      const key = Object.keys(localStorage).find((item) => item.startsWith('nft-mock-db:'))
      return key ? (JSON.parse(localStorage.getItem(key) ?? '{}').orders?.length ?? 0) : 0
    })
  }

  async confirmPurchase() {
    await this.page.getByRole('button', { name: 'Confirmar compra' }).click()
  }

  catalogCard(name: string) {
    return this.page.locator('#catalog article').filter({ hasText: name })
  }

  toast(text: string | RegExp) {
    return this.page.locator('[data-sonner-toast]').filter({ hasText: text })
  }
}

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use, testInfo) => {
    await use(new App(page, testInfo.project.name === 'mobile'))
  },
})

export { expect }
