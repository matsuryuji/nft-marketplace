import Decimal from 'decimal.js'
import type { NftDetail, NftImage, NftSummary } from '@/shared/contracts/nft'
import type { MockDatabase } from './db'
import { artworks } from './fixtures/artwork'
import { EDITION_SERIES, networkNames, type NftRecord } from './fixtures/nfts'
import { ratingSummary } from './fixtures/reviews'

export function artworkImage(artIndex: number, alt: string): NftImage {
  const artwork = artworks[artIndex % artworks.length]
  return { url: artwork.path, alt, width: artwork.width, height: artwork.height }
}

function image(record: NftRecord, artIndex: number, position: number): NftImage {
  return artworkImage(
    artIndex,
    position === 0 ? `Arte do NFT ${record.name}` : `${record.name}, vista ${position + 1}`,
  )
}

export function floorPrice(record: NftRecord) {
  const candidates = record.editions.filter((edition) => edition.available > 0)
  const pool = candidates.length > 0 ? candidates : record.editions
  return Decimal.min(...pool.map((edition) => new Decimal(edition.price))).toFixed()
}

export function totalAvailable(record: NftRecord) {
  return record.editions.reduce((sum, edition) => sum + edition.available, 0)
}

export function toNftSummary(record: NftRecord, state: MockDatabase): NftSummary {
  const creator = state.creators.find((item) => item.id === record.creatorId)!
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    network: record.network,
    rarity: record.rarity,
    collection: record.collection,
    creator,
    image: image(record, record.imageIndexes[0], 0),
    floorPrice: floorPrice(record),
    compareAtPrice: record.compareAtPrice,
    available: totalAvailable(record),
    likes: record.likes,
    createdAt: record.createdAt,
    version: record.version,
  }
}

function defaultEdition(record: NftRecord) {
  const floor = new Decimal(floorPrice(record))
  return record.editions.find((edition) => floor.equals(edition.price)) ?? record.editions[0]
}

export function toNftDetail(record: NftRecord, state: MockDatabase): NftDetail {
  const summary = toNftSummary(record, state)
  const network = networkNames[record.network]
  return {
    ...summary,
    description: record.description,
    story: [
      `${record.name} é uma obra digital ${defaultEdition(record).label} finalizada à mão da coleção ${EDITION_SERIES}. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${summary.creator.name} recebe ${record.royaltiesPercent}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    tokenId: record.tokenId,
    attributes: record.attributes,
    rating: ratingSummary(record),
    images: record.imageIndexes.map((artIndex, position) => image(record, artIndex, position)),
    editions: record.editions,
    provenance: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
    contractAddress: record.contractAddress,
    tokenStandard: 'ERC-721',
    royaltiesPercent: record.royaltiesPercent,
  }
}
