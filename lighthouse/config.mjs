export const PORT = 4400
export const BASE_URL = `http://localhost:${PORT}`
export const RUNS = 3

export const pages = [
  { id: 'inicio', path: '/' },
  { id: 'detalhe', path: '/nfts/nft-001' },
]

export const categories = ['performance', 'accessibility', 'best-practices', 'seo']

export const targets = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 90,
}

export const profiles = {
  mobile: {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: categories,
      formFactor: 'mobile',
      locale: 'pt-BR',
    },
  },
  desktop: {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: categories,
      formFactor: 'desktop',
      locale: 'pt-BR',
      screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
      throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
    },
  },
}
