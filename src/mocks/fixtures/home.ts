export type HeroSlideRecord = {
  id: string
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
  nftId: string
  secondaryNftId: string | null
}

export type PromotionRecord = {
  id: string
  title: string
  description: string
  ctaLabel: string
  nftId: string
  catalogLink: { tab?: 'all' | 'new' | 'trending'; category?: ('digital-art' | 'generative')[] }
}

export type ArticleRecord = {
  id: string
  title: string
  excerpt: string
  imageIndex: number
  publishedAt: string
  readingMinutes: number
}

export const heroSlideFixtures: HeroSlideRecord[] = [
  {
    id: 'hero-1',
    eyebrow: 'Bem-vindo à Kurio',
    title: 'Seja dono do futuro da arte digital',
    description:
      'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    ctaLabel: 'Explorar',
    nftId: 'nft-001',
    secondaryNftId: 'nft-002',
  },
  {
    id: 'hero-2',
    eyebrow: 'Coleção em alta',
    title: 'Edições raras direto dos criadores',
    description:
      'Edições limitadas com procedência verificada on-chain e royalties garantidos para quem cria.',
    ctaLabel: 'Ver coleção',
    nftId: 'nft-003',
    secondaryNftId: 'nft-009',
  },
  {
    id: 'hero-3',
    eyebrow: 'Novos lançamentos',
    title: 'Cunhagens frescas toda semana',
    description:
      'Acompanhe os drops mais recentes e garanta sua edição antes que esgote.',
    ctaLabel: 'Ver lançamentos',
    nftId: 'nft-007',
    secondaryNftId: 'nft-004',
  },
]

export const spotlightFixture = { label: 'Oferta limitada', nftId: 'nft-002' }

export const promotionFixtures: PromotionRecord[] = [
  {
    id: 'promo-genesis',
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    ctaLabel: 'Explorar',
    nftId: 'nft-001',
    catalogLink: { tab: 'new' },
  },
  {
    id: 'promo-curated',
    title: 'Arte digital selecionada e muito mais',
    description: 'Explore novos artistas, coleções verificadas e obras digitais que definem a próxima era.',
    ctaLabel: 'Explorar',
    nftId: 'nft-003',
    catalogLink: { category: ['digital-art', 'generative'] },
  },
]

export const articleFixtures: ArticleRecord[] = [
  {
    id: 'article-1',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, comprovar e verificar ativos digitais.',
    imageIndex: 2,
    publishedAt: '2026-09-12T12:00:00.000Z',
    readingMinutes: 6,
  },
  {
    id: 'article-2',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    imageIndex: 0,
    publishedAt: '2026-09-15T12:00:00.000Z',
    readingMinutes: 5,
  },
  {
    id: 'article-3',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    imageIndex: 1,
    publishedAt: '2026-09-18T12:00:00.000Z',
    readingMinutes: 4,
  },
  {
    id: 'article-4',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    imageIndex: 3,
    publishedAt: '2026-09-21T12:00:00.000Z',
    readingMinutes: 7,
  },
]
