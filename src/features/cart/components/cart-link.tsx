import { Link } from '@tanstack/react-router'
import { CartIcon } from '@/shared/icons'
import { cn } from '@/shared/lib/utils'
import { useCart } from '../queries'

export function CartLink({ className }: { className?: string }) {
  const { data } = useCart()
  const count = data?.itemCount ?? 0
  return (
    <Link
      to="/cart"
      aria-label={count > 0 ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho vazio'}
      className={cn('relative flex items-center justify-center', className)}
    >
      <CartIcon className="size-5" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] leading-none font-bold text-primary-foreground"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
