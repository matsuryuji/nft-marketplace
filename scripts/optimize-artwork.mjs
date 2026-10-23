import { mkdirSync, readdirSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

const root = join(import.meta.dirname, '..')
const sourceDir = join(root, 'design-assets', 'nfts')
const outputDir = join(root, 'public', 'assets', 'nfts')

mkdirSync(outputDir, { recursive: true })

for (const file of readdirSync(sourceDir).filter((name) => extname(name) === '.png')) {
  const name = basename(file, '.png')
  const output = join(outputDir, `${name}.webp`)
  const info = await sharp(join(sourceDir, file)).webp({ quality: 82, alphaQuality: 90 }).toFile(output)
  console.log(`${name}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(1)}kB`)
}
