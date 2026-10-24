import { chromium } from '@playwright/test'
const b = await chromium.launch()
for (const [name, vp] of [['desk',{width:1440,height:900}],['mob',{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp })
  await p.goto('http://localhost:5174/')
  await p.waitForFunction(() => Boolean(window.__mocks))
  await p.evaluate(() => fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'colecionador@kurio.test',password:'Kurio@2026'})}))
  for (const path of ['/profile','/wallets','/favorites']) {
    await p.goto('http://localhost:5174'+path); await p.waitForTimeout(1500)
    console.log(name, path, 'footer:', await p.locator('footer, [role=contentinfo]').count())
    if (path !== '/favorites') await p.screenshot({ path: '/private/tmp/claude-501/-Users-matsuryu-Documents/94b0981e-1081-4011-9e88-93651f1f4aa9/scratchpad/'+name+path.replace('/','-')+'.png', fullPage: true })
  }
}
await b.close()
