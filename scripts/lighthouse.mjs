import { spawn } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { chromium } from '@playwright/test'
import { BASE_URL, categories, pages, PORT, profiles, RUNS, targets } from '../lighthouse/config.mjs'

const root = join(import.meta.dirname, '..')
const reportsDir = join(root, 'lighthouse', 'reports')
const runsDir = join(reportsDir, 'runs')
const metricIds = {
  LCP: 'largest-contentful-paint',
  CLS: 'cumulative-layout-shift',
  TBT: 'total-blocking-time',
  FCP: 'first-contentful-paint',
  SI: 'speed-index',
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function waitForServer(url, timeoutMs = 60_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  throw new Error(`Servidor não respondeu em ${url}`)
}

function startPreview() {
  return spawn(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: root,
    stdio: 'ignore',
  })
}

async function runWithRetry(task, attempts = 2) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      if (attempt >= attempts) throw error
      process.stdout.write(`  nova tentativa após erro: ${error.message}\n`)
    }
  }
}

const packageVersion = (name) => JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')).version

async function main() {
  rmSync(reportsDir, { recursive: true, force: true })
  mkdirSync(runsDir, { recursive: true })

  const preview = startPreview()
  const chromePath = process.env.CHROME_PATH ?? chromium.executablePath()
  const chromeFlags = ['--headless=new', '--no-first-run', '--disable-extensions']
  let chromeVersion = 'desconhecida'
  try {
    await waitForServer(BASE_URL)

    const results = []
    for (const page of pages) {
      for (const [profileId, config] of Object.entries(profiles)) {
        const runs = []
        for (let run = 1; run <= RUNS; run += 1) {
          const result = await runWithRetry(async () => {
            const chrome = await chromeLauncher.launch({ chromePath, chromeFlags })
            try {
              chromeVersion = (await (await fetch(`http://127.0.0.1:${chrome.port}/json/version`)).json()).Browser
              return await lighthouse(`${BASE_URL}${page.path}`, { port: chrome.port, output: ['html', 'json'], logLevel: 'error' }, config)
            } finally {
              chrome.kill()
            }
          })
          const [html, json] = result.report
          const base = join(runsDir, `${page.id}-${profileId}-run${run}`)
          writeFileSync(`${base}.report.html`, html)
          writeFileSync(`${base}.report.json`, json)
          const lhr = result.lhr
          runs.push({
            run,
            base,
            scores: Object.fromEntries(categories.map((id) => [id, Math.round((lhr.categories[id].score ?? 0) * 100)])),
            metrics: Object.fromEntries(Object.entries(metricIds).map(([key, id]) => [key, lhr.audits[id].numericValue])),
          })
          process.stdout.write(`✓ ${page.id} ${profileId} run ${run}: ${categories.map((id) => `${id}=${runs.at(-1).scores[id]}`).join(' ')}\n`)
        }
        const medianPerformance = median(runs.map((item) => item.scores.performance))
        const medianRun = runs.find((item) => item.scores.performance === medianPerformance)
        for (const extension of ['html', 'json']) {
          copyFileSync(`${medianRun.base}.report.${extension}`, join(reportsDir, `${page.id}-${profileId}.report.${extension}`))
        }
        results.push({
          page: page.id,
          url: page.path,
          profile: profileId,
          median: {
            scores: Object.fromEntries(categories.map((id) => [id, median(runs.map((item) => item.scores[id]))])),
            metrics: Object.fromEntries(Object.keys(metricIds).map((key) => [key, median(runs.map((item) => item.metrics[key]))])),
          },
          medianRun: medianRun.run,
          runs: runs.map(({ base, ...item }) => item),
        })
      }
    }

    const environment = {
      date: new Date().toISOString(),
      lighthouse: packageVersion('lighthouse'),
      chromeLauncher: packageVersion('chrome-launcher'),
      chrome: chromeVersion,
      node: process.version,
      os: `${os.type()} ${os.release()} (${os.arch()})`,
      cpu: os.cpus()[0]?.model,
      memoryGb: Math.round(os.totalmem() / 1024 ** 3),
      build: 'vite build + vite preview, VITE_ENABLE_MOCKS=true, cenário default do MSW',
      runsPerPageAndProfile: RUNS,
      throttling: {
        mobile: 'padrão do Lighthouse (Moto G Power simulado, 4x CPU, Slow 4G simulado)',
        desktop: 'preset desktop do Lighthouse (40ms RTT, 10 Mbps, sem lentidão de CPU)',
      },
    }

    writeFileSync(join(root, 'lighthouse', 'summary.json'), `${JSON.stringify({ environment, targets, results }, null, 2)}\n`)
    writeFileSync(join(root, 'lighthouse', 'summary.md'), renderMarkdown(environment, results))
    process.stdout.write('\nResumo salvo em lighthouse/summary.md\n')
  } finally {
    preview.kill()
  }
}

function renderMarkdown(environment, results) {
  const format = {
    LCP: (value) => `${(value / 1000).toFixed(2)} s`,
    FCP: (value) => `${(value / 1000).toFixed(2)} s`,
    SI: (value) => `${(value / 1000).toFixed(2)} s`,
    TBT: (value) => `${Math.round(value)} ms`,
    CLS: (value) => value.toFixed(3),
  }
  const mark = (id, score) => (score >= targets[id] ? `${score}` : `**${score}** ⚠️`)
  const lines = [
    '# Auditoria Lighthouse',
    '',
    `Gerado por \`pnpm lighthouse\` em ${environment.date}. Mediana de ${environment.runsPerPageAndProfile} execuções por página e perfil.`,
    '',
    '| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...results.map(({ page, profile, median: m }) =>
      `| ${page} | ${profile} | ${mark('performance', m.scores.performance)} | ${mark('accessibility', m.scores.accessibility)} | ${mark('best-practices', m.scores['best-practices'])} | ${mark('seo', m.scores.seo)} | ${format.LCP(m.metrics.LCP)} | ${format.CLS(m.metrics.CLS)} | ${format.TBT(m.metrics.TBT)} | ${format.FCP(m.metrics.FCP)} |`,
    ),
    '',
    '## Ambiente',
    '',
    ...Object.entries(environment).map(([key, value]) => `- **${key}**: ${typeof value === 'object' ? JSON.stringify(value) : value}`),
    '',
    'Relatórios HTML/JSON da execução mediana de cada página e perfil em `lighthouse/reports/` (todas as execuções em `lighthouse/reports/runs/`, fora do git). Categorias abaixo da meta (⚠️) estão justificadas em `ARCHITECTURE.md`, seção Lighthouse.',
    '',
  ]
  return lines.join('\n')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
