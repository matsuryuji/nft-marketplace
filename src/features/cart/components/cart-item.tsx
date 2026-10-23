import { Link } from '@tanstack/react-router'
import type { CartItem as CartItemData } from '@/shared/contracts/cart'
import { DeleteIcon } from '@/shared/icons'
import { formatEth } from '@/shared/lib/eth'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import { desktopGrid } from '../layout'
import { CartQuantity } from './cart-quantity'

type CartItemProps = {
  item: CartItemData
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

function ItemNotice({ item }: { item: CartItemData }) {
  const messages: { text: string; tone: 'warning' | 'error' }[] = []
  if (item.issues.includes('unavailable')) messages.push({ text: 'Edição esgotada. Remova este item para continuar.', tone: 'error' })
  if (item.issues.includes('insufficient_availability')) {
    messages.push({ text: `Apenas ${item.maxQuantity} disponível(is). Ajuste a quantidade.`, tone: 'error' })
  }
  if (item.issues.includes('price_changed') && item.previousUnitPrice) {
    messages.push({
      text: `Preço atualizado de ${formatEth(item.previousUnitPrice, 4)} para ${formatEth(item.unitPrice, 4)}.`,
      tone: 'warning',
    })
  }
  if (messages.length === 0) return null
  return (
    <ul className="space-y-0.5">
      {messages.map((message) => (
        <li key={message.text} className={cn('text-[11px]', message.tone === 'error' ? 'text-destructive' : 'text-warning')}>
          {message.text}
        </li>
      ))}
    </ul>
  )
}

export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemProps) {
  const blocked = item.issues.includes('unavailable')
  const maxQuantity = Math.max(item.maxQuantity, 1)
  const removeButton = (className: string) => (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remover ${item.nft.name} (edição ${item.edition.label}) do carrinho`}
      className={cn('flex items-center justify-center rounded-md text-[#b39463] transition-colors hover:text-destructive', className)}
    >
      <DeleteIcon className="h-[15px] w-[13.5px]" />
    </button>
  )

  return (
    <li className="relative rounded-2xl bg-surface p-2 md:flex md:min-h-[70px] md:items-center md:rounded-[3px] md:px-0 md:py-2">
      <div className="flex gap-3 md:hidden">
        <img
          src={item.nft.image.url}
          alt=""
          width={item.nft.image.width}
          height={item.nft.image.height}
          className="size-24 shrink-0 rounded-xl object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              to="/nfts/$nftId"
              params={{ nftId: item.nft.id }}
              search={{ edition: item.edition.id }}
              className="truncate text-sm font-bold hover:text-highlight"
            >
              {item.nft.name}
            </Link>
            {removeButton('-mt-1 -mr-1 size-8 shrink-0')}
          </div>
          <p className="text-xs text-foreground/80">Edição: {item.edition.label}</p>
          <ItemNotice item={item} />
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <p className="text-base font-bold text-highlight">
              <span className="sr-only">Total do item: </span>
              {formatEth(item.lineTotal, 4)}
            </p>
            <CartQuantity
              name={item.nft.name}
              value={item.quantity}
              max={maxQuantity}
              onChange={onQuantityChange}
              variant="round"
              disabled={blocked}
            />
          </div>
        </div>
      </div>

      <div className={cn('hidden md:w-full', desktopGrid)}>
        <div className="flex min-w-0 items-center gap-3 pl-2.5">
          <img
            src={item.nft.image.url}
            alt=""
            width={item.nft.image.width}
            height={item.nft.image.height}
            className="size-[52px] shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <Link
              to="/nfts/$nftId"
              params={{ nftId: item.nft.id }}
              search={{ edition: item.edition.id }}
              className="block truncate text-sm font-bold hover:text-highlight"
            >
              {item.nft.name}
            </Link>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              Edição {item.edition.label} · ID do token: {item.nft.tokenId}
            </p>
            <ItemNotice item={item} />
          </div>
        </div>
        <p className="text-xs font-bold text-highlight">
          <span className="sr-only">Preço unitário: </span>
          {formatEth(item.unitPrice, 4)}
        </p>
        <CartQuantity
          name={item.nft.name}
          value={item.quantity}
          max={maxQuantity}
          onChange={onQuantityChange}
          variant="square"
          disabled={blocked}
        />
        <p className="text-xs font-bold text-highlight">
          <span className="sr-only">Total do item: </span>
          {formatEth(item.lineTotal, 4)}
        </p>
        {removeButton('size-8')}
      </div>
    </li>
  )
}

export function CartItemSkeleton() {
  return (
    <li className="rounded-2xl bg-surface p-2 md:flex md:min-h-[70px] md:items-center md:rounded-[3px] md:py-2">
      <div className="flex gap-3 md:hidden">
        <Skeleton className="size-24 rounded-xl" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="mt-6 h-5 w-1/2" />
        </div>
      </div>
      <div className={cn('hidden md:w-full', desktopGrid)}>
        <div className="flex items-center gap-3 pl-2.5">
          <Skeleton className="size-[52px] rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="size-5" />
      </div>
    </li>
  )
}
