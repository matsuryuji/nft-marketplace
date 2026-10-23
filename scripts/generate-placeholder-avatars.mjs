import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const AVATAR_COUNT = 8
const root = join(import.meta.dirname, '..', 'public')

function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hsl = (h, s, l) => `hsl(${Math.round(h)} ${s}% ${l}%)`

function avatar(index) {
  const rand = mulberry32(index * 7919 + 3)
  const hue = rand() * 360
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96"><rect width="96" height="96" fill="${hsl(hue, 65, 55)}"/><circle cx="48" cy="38" r="18" fill="${hsl(hue + 180, 50, 92)}"/><ellipse cx="48" cy="92" rx="34" ry="28" fill="${hsl(hue + 180, 50, 92)}"/></svg>\n`
}

mkdirSync(join(root, 'avatars'), { recursive: true })
for (let i = 1; i <= AVATAR_COUNT; i++) {
  writeFileSync(join(root, 'avatars', `creator-${i}.svg`), avatar(i))
}
console.log(`Generated ${AVATAR_COUNT} creator avatars in public/avatars`)
