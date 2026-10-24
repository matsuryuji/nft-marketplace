import { useEffect, useRef, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeft, Heart, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useAddToCart } from '@/features/cart/queries'
import { toApiError } from '@/shared/api/errors'
import { useMobileBarHeight } from '@/shared/hooks/use-mobile-bar-height'
import type { NftDetail, NftEdition } from '@/shared/contracts/nft'
import { CartIcon } from '@/shared/icons'
import { formatEth, toDecimal } from '@/shared/lib/eth'
import { formatRating } from '../rating'
import { EditionPicker } from './edition-picker'
import { NftDetailTabs, type DetailTab } from './nft-detail-tabs'
import { NftGallery } from './nft-gallery'
import { QuantityStepper } from './quantity-stepper'
import { RatingStars } from './rating-stars'
import { RelatedCarousel } from './related-carousel'
import { ShareLinks } from './share-links'

type NftDetailViewProps = {
  nft: NftDetail
  requestedEditionId?: string
  onEditionChange: (editionId: string) => void
}

const notifyPending = (action: string) =>
  toast.info(`${action} será habilitado na próxima etapa.`, { id: 'pending-action' })

function pickEdition(nft: NftDetail, requestedEditionId?: string) {
  const requested = nft.editions.find((edition) => edition.id === requestedEditionId)
  if (requested && requested.available > 0) return requested
  return nft.editions
    .filter((edition) => edition.available > 0)
    .reduce<NftEdition | undefined>(
      (cheapest, edition) => (!cheapest || toDecimal(edition.price).lessThan(cheapest.price) ? edition : cheapest),
      undefined,
    )
}

export function NftDetailView({ nft, requestedEditionId, onEditionChange }: NftDetailViewProps) {
  const router = useRouter()
  const purchaseBarRef = useMobileBarHeight<HTMLDivElement>()
  const selected = pickEdition(nft, requestedEditionId)
  const requestedUnavailable = Boolean(requestedEditionId) && requestedEditionId !== selected?.id
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState<DetailTab>('details')
  const [liveMessage, setLiveMessage] = useState<string | null>(null)
  const lastVersion = useRef(nft.version)

  useEffect(() => {
    if (nft.version === lastVersion.current) return
    lastVersion.current = nft.version
    setLiveMessage(`Atualizado agora: a partir de ${formatEth(nft.floorPrice, 2)}, ${nft.available} disponíveis.`)
    const timeout = window.setTimeout(() => setLiveMessage(null), 6_000)
    return () => window.clearTimeout(timeout)
  }, [nft.version, nft.floorPrice, nft.available])

  const maxQuantity = selected ? Math.min(selected.available, selected.maxPerOrder) : 0
  const effectiveQuantity = Math.min(quantity, Math.max(maxQuantity, 1))
  const unitPrice = selected?.price ?? nft.floorPrice
  const total = toDecimal(unitPrice).times(effectiveQuantity).toFixed()
  const soldOut = !selected
  const addToCart = useAddToCart()
  const addSelected = (destination: 'cart' | 'stay') => {
    if (!selected || addToCart.isPending) return
    addToCart.mutate(
      { nftId: nft.id, editionId: selected.id, quantity: effectiveQuantity },
      {
        onSuccess: () => {
          if (destination === 'cart') {
            void router.navigate({ to: '/cart' })
            return
          }
          toast.success(`${nft.name} (${selected.label}) foi adicionado ao carrinho.`, {
            action: { label: 'Ver carrinho', onClick: () => void router.navigate({ to: '/cart' }) },
          })
        },
        onError: (error) =>
          toast.error('Não foi possível adicionar ao carrinho', { description: toApiError(error).message }),
      },
    )
  }
  const purchaseDisabled = soldOut || addToCart.isPending
  const updateQuantity = (update: (current: number) => number) =>
    setQuantity((current) => update(Math.min(current, Math.max(maxQuantity, 1))))

  const openReviews = () => {
    setTab('reviews')
    document.getElementById('nft-detail-tabs')?.scrollIntoView({ block: 'start' })
  }

  const goBack = () => {
    if (window.history.length > 1) router.history.back()
    else router.navigate({ to: '/' })
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 sm:px-6 md:pt-6 md:pb-16">
      <nav aria-label="Trilha de navegação" className="mb-3 hidden text-xs font-bold md:block">
        <ol className="flex items-center gap-1">
          <li>
            <Link to="/" className="hover:text-highlight">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash="catalogo" className="hover:text-highlight">
              Mercado
            </Link>
          </li>
        </ol>
      </nav>

      <article className="grid gap-5 rounded-[28px] bg-surface p-4 md:grid-cols-2 md:gap-8 md:rounded-none md:bg-transparent md:p-0 lg:gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between md:hidden">
            <button
              type="button"
              onClick={goBack}
              aria-label="Voltar"
              className="flex size-9 items-center justify-center rounded-full bg-background/40 text-foreground"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => notifyPending('Favoritar')}
              aria-label="Favoritar"
              className="flex size-9 items-center justify-center rounded-full bg-background/40 text-primary"
            >
              <Heart className="size-4" aria-hidden="true" />
            </button>
          </div>
          <NftGallery images={nft.images} name={nft.name} />
        </div>

        <div className="min-w-0 space-y-3 md:space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold md:text-[28px] md:leading-tight">{nft.name}</h1>
            <button
              type="button"
              onClick={openReviews}
              className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-0.5 text-[11px] md:hidden"
              aria-label={`Avaliação ${formatRating(nft.rating.average)} de 5, ${nft.rating.count} avaliações`}
            >
              <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
              {formatRating(nft.rating.average)}
              <span className="text-foreground/70">({nft.rating.count})</span>
            </button>
          </div>

          <div className="hidden flex-wrap items-center justify-between gap-2 border-b border-primary/40 pb-2 md:flex">
            <p className="text-xl font-bold text-highlight">
              <span className="sr-only">Preço: </span>
              {formatEth(unitPrice, 2)}
              {effectiveQuantity > 1 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Total {formatEth(total, 4)}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={openReviews}
              className="flex items-center gap-2 text-xs hover:text-highlight"
            >
              <RatingStars average={nft.rating.average} />
              <span className="sr-only">Avaliação {formatRating(nft.rating.average)} de 5,</span>
              {nft.rating.count} avaliações de colecionadores
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="hidden text-[13px] font-bold md:block">Sobre este NFT:</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{nft.description}</p>
          </div>

          <p aria-live="polite" className="min-h-0 text-xs text-highlight empty:hidden">
            {liveMessage}
          </p>

          {requestedUnavailable && (
            <p role="status" className="text-xs text-warning">
              A edição solicitada está indisponível.{selected ? ' Selecionamos a próxima edição disponível.' : ''}
            </p>
          )}

          <EditionPicker
            editions={nft.editions}
            value={selected?.id ?? ''}
            onChange={(editionId) => {
              setQuantity(1)
              onEditionChange(editionId)
            }}
          />

          <div className="hidden items-start justify-between gap-3 md:flex">
            <QuantityStepper value={effectiveQuantity} max={maxQuantity} onChange={updateQuantity} disabled={soldOut} />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={purchaseDisabled}
                onClick={() => addSelected('cart')}
                className="h-9 rounded-[4px] bg-primary px-8 text-xs font-bold text-primary-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {soldOut ? 'Esgotado' : addToCart.isPending ? 'Adicionando…' : 'Comprar'}
              </button>
              <button
                type="button"
                onClick={() => notifyPending('Favoritar')}
                className="flex h-9 items-center gap-1.5 rounded-[4px] border border-primary px-3 text-xs text-foreground transition-colors hover:bg-primary/10"
              >
                <Heart className="size-4 text-primary" aria-hidden="true" />
                Favoritar
              </button>
            </div>
          </div>

          <dl className="space-y-2 text-xs text-muted-foreground md:space-y-3">
            <div className="flex gap-1">
              <dt>ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Coleção:</dt>
              <dd>{nft.collection}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Atributos:</dt>
              <dd>{nft.attributes.join(', ')}</dd>
            </div>
          </dl>

          {soldOut && (
            <p role="status" className="text-xs font-bold">
              Todas as edições deste NFT estão esgotadas.
            </p>
          )}

          <div className="hidden md:block">
            <ShareLinks title={nft.name} />
          </div>
        </div>
      </article>

      <div className="mt-10 space-y-14 md:mt-16 md:space-y-20">
        <NftDetailTabs nft={nft} value={tab} onValueChange={setTab} />
        <RelatedCarousel nftId={nft.id} />
      </div>

      <div ref={purchaseBarRef} className="fixed inset-x-0 bottom-0 z-40 rounded-t-[28px] border-t border-surface-strong bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="flex items-start justify-between gap-3">
          <QuantityStepper
            value={effectiveQuantity}
            max={maxQuantity}
            onChange={updateQuantity}
            disabled={soldOut}
            labelVisible
          />
          <p className="text-lg font-bold text-highlight" aria-live="polite">
            <span className="sr-only">Total: </span>
            {formatEth(total, 4)}
          </p>
        </div>
        <div className="mt-1 flex gap-3">
          <button
            type="button"
            disabled={purchaseDisabled}
            onClick={() => addSelected('cart')}
            className="h-11 flex-1 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {soldOut ? 'Esgotado' : addToCart.isPending ? 'Adicionando…' : 'Comprar NFT'}
          </button>
          <button
            type="button"
            disabled={purchaseDisabled}
            onClick={() => addSelected('stay')}
            aria-label="Adicionar ao carrinho"
            className="flex size-11 items-center justify-center rounded-full bg-surface-strong text-primary disabled:opacity-50"
          >
            <CartIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
