export const scenarioIds = [
  'default',
  'slow',
  'variable-latency',
  'empty',
  'server-error',
  'offline',
  'timeout',
  'wallet-rejected',
  'payment-refused',
  'order-timeout',
  'checkout-price-change',
  'checkout-sold-out',
  'favorites-error',
] as const

export type ScenarioId = (typeof scenarioIds)[number]

export type ScenarioDefinition = {
  description: string
  latency: { min: number; max: number }
}

export const scenarios: Record<ScenarioId, ScenarioDefinition> = {
  default: { description: 'Dados completos e latência baixa', latency: { min: 120, max: 350 } },
  slow: { description: 'Todas as respostas levam ~2,5s', latency: { min: 2500, max: 2500 } },
  'variable-latency': {
    description: 'Latência entre 100ms e 2s determinada pela URL (respostas fora de ordem)',
    latency: { min: 100, max: 2000 },
  },
  empty: { description: 'Catálogo sem resultados', latency: { min: 120, max: 350 } },
  'server-error': { description: 'Catálogo responde HTTP 500', latency: { min: 120, max: 350 } },
  offline: { description: 'Falha de conexão em todas as requisições', latency: { min: 0, max: 0 } },
  timeout: { description: 'Requisições nunca respondem (timeout do cliente)', latency: { min: 0, max: 0 } },
  'wallet-rejected': { description: 'A carteira recusa a conexão no checkout', latency: { min: 120, max: 350 } },
  'payment-refused': { description: 'O pedido é criado e o pagamento é recusado', latency: { min: 120, max: 350 } },
  'order-timeout': {
    description: 'O pedido é criado, mas a primeira resposta excede o timeout (recuperação por idempotência)',
    latency: { min: 120, max: 350 },
  },
  'checkout-price-change': {
    description: 'O preço do primeiro item sobe 10% ao confirmar a compra',
    latency: { min: 120, max: 350 },
  },
  'checkout-sold-out': { description: 'A edição do primeiro item esgota ao confirmar a compra', latency: { min: 120, max: 350 } },
  'favorites-error': { description: 'Favoritar e desfavoritar respondem HTTP 503 após 1,2s (rollback otimista)', latency: { min: 1200, max: 1200 } },
}

const STORAGE_KEY = 'nft-mock-scenario'
const QUERY_PARAM = 'mock-scenario'

function isScenarioId(value: string | null): value is ScenarioId {
  return value !== null && (scenarioIds as readonly string[]).includes(value)
}

function consumeScenarioParam() {
  const url = new URL(window.location.href)
  const value = url.searchParams.get(QUERY_PARAM)
  if (value === null) return null
  url.searchParams.delete(QUERY_PARAM)
  window.history.replaceState(window.history.state, '', url)
  return value
}

function readInitialScenario(): ScenarioId {
  const fromUrl = consumeScenarioParam()
  if (isScenarioId(fromUrl)) {
    localStorage.setItem(STORAGE_KEY, fromUrl)
    return fromUrl
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  return isScenarioId(stored) ? stored : 'default'
}

let current: ScenarioId = readInitialScenario()

export const scenarioStore = {
  get current() {
    return current
  },
  get definition() {
    return scenarios[current]
  },
  set(id: ScenarioId) {
    current = id
    localStorage.setItem(STORAGE_KEY, id)
  },
}
