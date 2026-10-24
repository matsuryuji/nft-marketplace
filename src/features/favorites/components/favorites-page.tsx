import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { QueryErrorState } from '@/shared/components/query-error-state'
import { useFavorites } from '../queries'

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3'

export function FavoritesPage() {
  const query = useFavorites()
  const count = query.data?.items.length ?? 0

  return (
    <section aria-labelledby="favorites-title" className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <h1 id="favorites-title" className="text-[15px] font-bold">
          Lista de interesse
        </h1>
        {query.isSuccess && (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {count} {count === 1 ? 'NFT favoritado' : 'NFTs favoritados'}
          </p>
        )}
      </div>

      {query.isPending ? (
        <div className={gridClass} role="status" aria-label="Carregando favoritos">
          {Array.from({ length: 6 }, (_, index) => (
            <NftCardSkeleton key={index} />
          ))}
        </div>
      ) : query.isError ? (
        <QueryErrorState error={query.error} title="Não foi possível carregar seus favoritos" onRetry={() => query.refetch()} isRetrying={query.isFetching} />
      ) : count === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[3px] bg-surface px-6 py-12 text-center">
          <Heart className="size-8 text-primary" aria-hidden="true" />
          <p className="font-bold">Você ainda não favoritou nenhum NFT</p>
          <p className="text-xs text-muted-foreground">Toque no coração de um NFT para guardá-lo aqui.</p>
          <Link to="/" hash="catalog" className="mt-2 rounded-[4px] bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90">
            Explorar NFTs
          </Link>
        </div>
      ) : (
        <ul className={gridClass}>
          {query.data.items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
