import { useQuery } from '@tanstack/react-query'
import { NftCarousel } from '@/features/catalog/components/nft-carousel'
import { relatedNftsQuery } from '../queries'

export function RelatedCarousel({ nftId }: { nftId: string }) {
  const query = useQuery(relatedNftsQuery(nftId))
  if (query.isError) return null
  return (
    <NftCarousel
      title="Mais desta coleção"
      titleId="related-title"
      label={query.data ? `NFTs da coleção ${query.data.collection}` : 'Carregando NFTs da coleção'}
      items={query.data?.items ?? []}
      isPending={query.isPending}
    />
  )
}
