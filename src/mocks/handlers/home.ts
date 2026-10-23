import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import { newsletterRequestSchema, type HomeContent } from '@/shared/contracts/home'
import { db } from '../db'
import { articleFixtures, heroSlideFixtures, promotionFixtures, spotlightFixture } from '../fixtures/home'
import { errorResponse, simulateNetwork } from '../lib/http'
import { scenarioStore } from '../scenarios'
import { artworkImage, toNftSummary } from '../serializers'

export const homeHandlers = [
  http.get(`${env.apiUrl}/home`, async ({ request }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') {
      return errorResponse(500, 'INTERNAL_ERROR', 'Falha ao carregar a página inicial.')
    }

    const { state } = db
    const findNft = (id: string) => state.nfts.find((nft) => nft.id === id)
    const coverOf = (id: string) => {
      const nft = findNft(id)
      return nft ? artworkImage(nft.imageIndexes[0], `Arte do NFT ${nft.name}`) : null
    }
    const spotlightNft = findNft(spotlightFixture.nftId)
    const empty = scenarioStore.current === 'empty'

    const body: HomeContent = {
      heroSlides: heroSlideFixtures.flatMap((slide) => {
        const image = coverOf(slide.nftId)
        if (!image) return []
        return [
          {
            id: slide.id,
            eyebrow: slide.eyebrow,
            title: slide.title,
            description: slide.description,
            ctaLabel: slide.ctaLabel,
            nftId: slide.nftId,
            image,
            secondaryImage: slide.secondaryNftId ? coverOf(slide.secondaryNftId) : null,
          },
        ]
      }),
      spotlight:
        spotlightNft && !empty
          ? { label: spotlightFixture.label, nft: toNftSummary(spotlightNft, state) }
          : null,
      promotions: promotionFixtures.flatMap((promotion) => {
        const image = coverOf(promotion.nftId)
        if (!image) return []
        return [
          {
            id: promotion.id,
            title: promotion.title,
            description: promotion.description,
            ctaLabel: promotion.ctaLabel,
            image,
            catalogLink: promotion.catalogLink,
          },
        ]
      }),
      articles: articleFixtures.map((article) => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        image: artworkImage(article.imageIndex, ''),
        publishedAt: article.publishedAt,
        readingMinutes: article.readingMinutes,
      })),
    }

    return HttpResponse.json(body)
  }),

  http.post(`${env.apiUrl}/newsletter`, async ({ request }) => {
    const network = await simulateNetwork(request)
    if (network) return network
    if (scenarioStore.current === 'server-error') {
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Serviço de newsletter indisponível. Tente novamente.')
    }

    const parsed = newsletterRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Verifique os dados informados.', {
        email: 'Informe um e-mail válido',
      })
    }

    const email = parsed.data.email.trim().toLowerCase()
    const { state } = db
    if (state.newsletterSubscribers.some((subscriber) => subscriber.email === email)) {
      return errorResponse(409, 'CONFLICT', 'Este e-mail já está inscrito.', {
        email: 'Este e-mail já está inscrito',
      })
    }

    const subscriber = { email, subscribedAt: new Date().toISOString() }
    state.newsletterSubscribers.push(subscriber)
    db.persist()
    return HttpResponse.json(subscriber, { status: 201 })
  }),
]
