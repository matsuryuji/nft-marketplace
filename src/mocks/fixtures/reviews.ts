import type { NftReview } from '@/shared/contracts/nft'
import { createRandom, hashString } from '../lib/random'
import { FIXTURE_NOW, type NftRecord } from './nfts'

const reviewers = [
  'Ana Ribeiro',
  'Bruno Takeda',
  'Carla Menezes',
  'Diego Faria',
  'Elisa Moura',
  'Felipe Rocha',
  'Gabi Nunes',
  'Heitor Lins',
  'Isa Prado',
  'João Vieira',
]

const commentsByRating: Record<number, string[]> = {
  5: [
    'Arte impecável e a procedência on-chain me deu total segurança na compra.',
    'Os detalhes em alta resolução são ainda melhores ao vivo. Recomendo!',
    'Comunidade incrível e acesso exclusivo valeram cada ETH.',
  ],
  4: [
    'Peça linda, só gostaria de mais atributos desbloqueáveis.',
    'Ótima edição, entrega da arte em alta resolução foi rápida.',
  ],
  3: ['Boa obra, mas esperava mais utilidade para colecionadores.'],
}

const DAY = 86_400_000

function ratingsFor(record: NftRecord) {
  const lowerCount = Math.round((5 - record.reviewAverage) * record.reviewCount)
  return Array.from({ length: record.reviewCount }, (_, index) => {
    if (index >= record.reviewCount - lowerCount) {
      return index % 5 === 0 && record.reviewAverage < 4.3 ? 3 : 4
    }
    return 5
  })
}

export function createReviews(record: NftRecord): NftReview[] {
  const random = createRandom(hashString(record.id))
  return ratingsFor(record).map((rating, index) => {
    const comments = commentsByRating[rating]
    return {
      id: `${record.id}-review-${index + 1}`,
      author: reviewers[(index + record.reviewCount) % reviewers.length],
      rating,
      comment: comments[random.int(0, comments.length - 1)],
      createdAt: new Date(FIXTURE_NOW - (index + 1) * 2 * DAY - random.int(0, DAY)).toISOString(),
    }
  })
}

export function ratingSummary(record: NftRecord) {
  const ratings = ratingsFor(record)
  const average = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0
  return { average: Math.round(average * 10) / 10, count: ratings.length }
}
