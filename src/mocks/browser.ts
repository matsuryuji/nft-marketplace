import { setupWorker } from 'msw/browser'
import { db } from './db'
import { CART_COOKIE } from './fixtures/coupons'
import { SESSION_COOKIE } from './fixtures/users'
import { expireAllSessions } from './lib/session'
import { handlers } from './handlers'
import { realtimeControls, realtimeHandler } from './realtime/hub'
import { scenarioIds, scenarios, scenarioStore, type ScenarioId } from './scenarios'

export const worker = setupWorker(...handlers, realtimeHandler)

const mockControls = {
  scenarios: scenarioIds.map((id) => ({ id, ...scenarios[id] })),
  get scenario() {
    return scenarioStore.current
  },
  setScenario(id: ScenarioId) {
    scenarioStore.set(id)
  },
  reset() {
    db.reset()
    scenarioStore.set('default')
    document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0`
    document.cookie = `${CART_COOKIE}=; Path=/; Max-Age=0`
  },
  expireSession() {
    expireAllSessions()
  },
  realtime: realtimeControls,
}

declare global {
  interface Window {
    __mocks?: typeof mockControls
  }
}

export async function startMockWorker() {
  window.__mocks = mockControls
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: import.meta.env.PROD,
  })
}
