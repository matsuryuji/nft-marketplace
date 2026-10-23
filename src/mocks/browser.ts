import { setupWorker } from 'msw/browser'
import { db } from './db'
import { handlers } from './handlers'
import { scenarioIds, scenarios, scenarioStore, type ScenarioId } from './scenarios'

export const worker = setupWorker(...handlers)

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
  },
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
