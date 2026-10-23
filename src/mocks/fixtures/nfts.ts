import { nftCategories, nftNetworks, type NftCategory, type NftNetwork, type NftRarity } from '@/shared/contracts/nft'
import { createRandom } from '../lib/random'
import { ARTWORK, artworks, type ArtworkCharacter } from './artwork'

export type NftEditionRecord = {
  id: string
  label: string
  price: string
  supply: number
  available: number
  maxPerOrder: number
}

export type NftRecord = {
  id: string
  name: string
  tokenId: string
  description: string
  category: NftCategory
  network: NftNetwork
  rarity: NftRarity
  collection: string
  creatorId: string
  imageIndexes: number[]
  attributes: string[]
  editions: NftEditionRecord[]
  compareAtPrice: string | null
  contractAddress: string
  royaltiesPercent: number
  reviewCount: number
  reviewAverage: number
  likes: number
  createdAt: string
  version: number
}

export type CreatorRecord = { id: string; name: string; avatarUrl: string }

export const NFT_FIXTURE_COUNT = 72
export const FIXTURE_NOW = Date.UTC(2026, 9, 1)
export const NEW_RELEASE_WINDOW_DAYS = 14
export const TRENDING_MIN_LIKES = 600
export const SHOWCASE_COLLECTION = 'Kurio Apes'
export const EDITION_SERIES = 'Kurio Editions'

export const creatorFixtures: CreatorRecord[] = [
  'Nova Sato',
  'Kenji Moto',
  'Lia Prism',
  'Duda Ramos',
  'Oskar Hale',
  'Nina Solace',
  'Theo Quartz',
  'Maya Lune',
].map((name, index) => ({
  id: `creator-${index + 1}`,
  name,
  avatarUrl: `/avatars/creator-${index + 1}.svg`,
}))

const collectionsByCategory: Record<NftCategory, string> = {
  'digital-art': SHOWCASE_COLLECTION,
  photography: 'Still Frames',
  music: 'Jungle Beats',
  '3d-art': 'Polygon Primates',
  collectibles: 'Vault Relics',
  generative: 'Code Canopy',
  gaming: 'Arcade Tribe',
  subscriptions: 'Kurio Pass',
  utility: 'Access Keys',
}

const attributesByCharacter: Record<ArtworkCharacter, string[]> = {
  Ape: ['Óculos', 'Esmeralda', 'Raro'],
  Nomad: ['Chapéu bucket', 'Moletom', 'Sereno'],
  Vessel: ['Blazer', 'Gola alta', 'Brinco'],
  Beat: ['Fones', 'Jaqueta', 'Groove'],
}

const editionTiers = [
  { key: '1-1', label: '1/1', supply: 1, multiplier: 6, maxPerOrder: 1 },
  { key: '1-10', label: '1/10', supply: 10, multiplier: 2.5, maxPerOrder: 2 },
  { key: '1-50', label: '1/50', supply: 50, multiplier: 1, maxPerOrder: 5 },
  { key: 'open', label: 'Aberta', supply: 1000, multiplier: 1.25, maxPerOrder: 10 },
] as const

type ShowcaseItem = {
  name: string
  artwork: number
  price: number
  compareAt?: number
  rarity?: NftRarity
}

const designShowcase: ShowcaseItem[] = [
  { name: 'Emerald Ape #042', artwork: ARTWORK.ape, price: 1190 },
  { name: 'Sage Nomad #009', artwork: ARTWORK.nomad, price: 1690 },
  { name: 'Neon Vessel #552', artwork: ARTWORK.vessel, price: 1990, compareAt: 2290, rarity: 'rare' },
  { name: 'Cosmic Bloom #118', artwork: ARTWORK.nomad, price: 1290 },
  { name: 'Violet Nomad #314', artwork: ARTWORK.nomad, price: 1390 },
  { name: 'Ivory Baron #088', artwork: ARTWORK.vessel, price: 1790 },
  { name: 'Golden Beat #207', artwork: ARTWORK.beat, price: 990 },
  { name: 'Amber Beat #311', artwork: ARTWORK.beat, price: 690 },
  { name: 'Golden Signal #160', artwork: ARTWORK.beat, price: 390 },
]

const adjectives = ['Emerald', 'Sage', 'Neon', 'Cosmic', 'Violet', 'Ivory', 'Golden', 'Amber', 'Copper', 'Velvet', 'Lunar', 'Rustic']
export const networkNames: Record<NftNetwork, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }
const DAY = 86_400_000
const GALLERY_VIEWS = 4

const formatPrice = (milliEth: number) => (milliEth / 1000).toFixed(2)
const tokenNumberOf = (name: string) => Number(name.split('#')[1])

function rarityFor(editionCount: number, index: number): NftRarity {
  if (editionCount === 4 && index % 4 === 0) return 'legendary'
  if (editionCount >= 3) return 'rare'
  return 'common'
}

export function createNftFixtures(): NftRecord[] {
  const random = createRandom(20261023)
  const usedNumbers = new Set(designShowcase.map((item) => tokenNumberOf(item.name)))
  const hex = (length: number) =>
    Array.from({ length }, () => random.int(0, 15).toString(16)).join('')

  return Array.from({ length: NFT_FIXTURE_COUNT }, (_, index) => {
    const sequence = index + 1
    const id = `nft-${String(sequence).padStart(3, '0')}`
    const showcase = designShowcase[index]
    const category = nftCategories[index % nftCategories.length]
    const networkSlot = (index * 3 + Math.floor(index / nftCategories.length)) % 5
    const network = networkSlot < 3 ? nftNetworks[0] : networkSlot === 3 ? nftNetworks[1] : nftNetworks[2]

    let tokenNumber = showcase ? tokenNumberOf(showcase.name) : random.int(1, 999)
    while (!showcase && usedNumbers.has(tokenNumber)) tokenNumber = random.int(1, 999)
    usedNumbers.add(tokenNumber)

    const artwork = showcase?.artwork ?? (index * 3 + Math.floor(index / artworks.length)) % artworks.length
    const character = artworks[artwork].character
    const name =
      showcase?.name ?? `${adjectives[index % adjectives.length]} ${character} #${String(tokenNumber).padStart(3, '0')}`

    const baseMilliEth = showcase?.price ?? Math.round(20 + random.next() ** 2 * 4500)
    const soldOut = !showcase && sequence % 11 === 0
    const tiers = showcase ? editionTiers : editionTiers.filter((tier) => tier.key === '1-50' || random.next() > 0.45)

    const editions: NftEditionRecord[] = tiers.map((tier) => {
      const randomAvailable = tier.key === 'open' ? random.int(200, tier.supply) : random.int(0, tier.supply)
      const guaranteed = showcase !== undefined || tier.key === '1-50'
      const available = soldOut ? 0 : guaranteed ? Math.max(randomAvailable, 1) : randomAvailable
      return {
        id: `${id}-${tier.key}`,
        label: tier.label,
        price: formatPrice(baseMilliEth * tier.multiplier),
        supply: tier.supply,
        available: sequence === 13 && tier.key === '1-1' ? 0 : available,
        maxPerOrder: tier.maxPerOrder,
      }
    })

    const collection = showcase ? SHOWCASE_COLLECTION : collectionsByCategory[category]
    const reviewCount = index === 0 ? 19 : random.int(0, 40)
    const reviewAverage = index === 0 ? 4.8 : Math.round((3.6 + random.next() * 1.4) * 10) / 10

    return {
      id,
      name,
      tokenId: `#${String(tokenNumber).padStart(4, '0')}`,
      description: `Um colecionável digital finalizado à mão da coleção ${EDITION_SERIES}, verificado na ${networkNames[network]}, com arte desbloqueável e acesso para colecionadores.`,
      category,
      network,
      rarity: showcase ? (showcase.rarity ?? 'common') : rarityFor(editions.length, index),
      collection,
      creatorId: creatorFixtures[index % creatorFixtures.length].id,
      imageIndexes: Array.from({ length: GALLERY_VIEWS }, () => artwork),
      attributes: attributesByCharacter[character],
      editions,
      compareAtPrice: showcase
        ? showcase.compareAt
          ? formatPrice(showcase.compareAt)
          : null
        : sequence % 6 === 3
          ? formatPrice(baseMilliEth * 1.15)
          : null,
      contractAddress: index === 0 ? `0x7a42${hex(32)}19e8` : `0x${hex(40)}`,
      royaltiesPercent: 5,
      reviewCount,
      reviewAverage,
      likes: random.int(0, 999),
      createdAt: new Date(FIXTURE_NOW - index * 0.75 * DAY - random.int(0, DAY / 2)).toISOString(),
      version: 1,
    }
  })
}
