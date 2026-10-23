import { useQuery } from '@tanstack/react-query'
import { NftCarousel } from '@/features/catalog/components/nft-carousel'
import { nftListQuery } from '@/features/catalog/queries'

const RECOMMENDATION_LIMIT = 10

export function CartRecommendations({ excludeIds }: { excludeIds: string[] }) {
  const query = useQuery(nftListQuery({ sort: 'popular', page: 1, pageSize: RECOMMENDATION_LIMIT + 5 }))
  if (query.isError) return null
  const items = (query.data?.items ?? []).filter((nft) => !excludeIds.includes(nft.id)).slice(0, RECOMMENDATION_LIMIT)
  return (
    <NftCarousel
      title="Colecionadores também viram"
      titleId="cart-recommendations-title"
      label="NFTs recomendados"
      items={items}
      isPending={query.isPending}
    />
  )
}
