import { Link } from '@tanstack/react-router'
import { Heart, House, ScanSearch, UserRound } from 'lucide-react'
import { CartIcon } from '@/shared/icons'
import { SearchDialog } from './search-dialog'

const itemClass =
  'flex size-11 items-center justify-center rounded-full text-foreground/70 transition-colors hover:text-highlight'

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-surface-strong bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-center justify-items-center px-4">
        <li>
          <Link
            to="/"
            aria-label="Início"
            className={itemClass}
            activeOptions={{ exact: true, includeSearch: false }}
            activeProps={{ className: 'text-highlight!', 'aria-current': 'page' }}
          >
            <House className="size-5" aria-hidden="true" />
          </Link>
        </li>
        <li>
          <Link to="/favorites" aria-label="Favoritos" className={itemClass}>
            <Heart className="size-5" aria-hidden="true" />
          </Link>
        </li>
        <li className="-mt-8">
          <SearchDialog
            trigger={
              <button
                type="button"
                aria-label="Explorar coleções"
                className="flex size-14 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg"
              >
                <ScanSearch className="size-6" aria-hidden="true" />
              </button>
            }
          />
        </li>
        <li>
          <Link to="/cart" aria-label="Carrinho" className={itemClass}>
            <CartIcon className="size-5" />
          </Link>
        </li>
        <li>
          <Link to="/profile" aria-label="Perfil" className={itemClass}>
            <UserRound className="size-5" aria-hidden="true" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}
