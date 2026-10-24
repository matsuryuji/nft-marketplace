import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useSession } from '@/features/auth/session'
import type { NftSummary } from '@/shared/contracts/nft'
import { cn } from '@/shared/lib/utils'
import { useIsFavorite, useToggleFavorite } from '../queries'

type FavoriteButtonProps = {
  nft: NftSummary
  variant: 'card' | 'round' | 'outline'
  className?: string
}

const variants = {
  card: 'size-8 rounded-full bg-background/75 backdrop-blur hover:bg-background',
  round: 'size-9 rounded-full bg-background/40',
  outline: 'h-9 gap-1.5 rounded-[4px] border border-primary px-3 text-xs text-foreground hover:bg-primary/10',
}

export function FavoriteButton({ nft, variant, className }: FavoriteButtonProps) {
  const { user } = useSession()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => `${state.location.pathname}${state.location.searchStr}` })
  const isFavorite = useIsFavorite(nft.id)
  const toggle = useToggleFavorite()

  const onClick = () => {
    if (!user) {
      void navigate({ to: '.', search: (prev) => ({ ...prev, auth: 'login' as const, redirect: href }), resetScroll: false })
      return
    }
    toggle.mutate({ nft, favorite: !isFavorite })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={user ? isFavorite : undefined}
      aria-label={
        !user
          ? `Entre para favoritar ${nft.name}`
          : isFavorite
            ? `Remover ${nft.name} da lista de interesse`
            : `Adicionar ${nft.name} à lista de interesse`
      }
      className={cn('relative z-10 flex shrink-0 items-center justify-center text-primary transition-colors', variants[variant], className)}
    >
      <Heart className={cn('size-4', isFavorite && 'fill-primary')} aria-hidden="true" />
      {variant === 'outline' && <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>}
    </button>
  )
}
