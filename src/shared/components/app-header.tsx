import { Link, useRouterState } from '@tanstack/react-router'
import { AccountMenu } from '@/features/auth/components/account-menu'
import { CartLink } from '@/features/cart/components/cart-link'
import { SearchIcon } from '@/shared/icons'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { SearchDialog } from './search-dialog'

const navLinkClass =
  'relative py-4 text-sm text-foreground/80 transition-colors hover:text-highlight after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-transparent'

const activeNavClass = 'text-highlight! after:bg-highlight!'

export function AppHeader() {
  const onMarketplace = useRouterState({ select: (state) => state.location.pathname.startsWith('/nfts/') })

  return (
    <header className="sticky top-0 z-40 hidden border-b border-surface-strong bg-background/95 backdrop-blur md:block">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 px-6">
        <Link to="/" className="rounded-sm text-sm font-bold tracking-[0.2em]" aria-label="Kurio, página inicial">
          KURIO
        </Link>

        <nav aria-label="Principal">
          <ul className="flex items-center gap-8">
            <li>
              <Link
                to="/"
                activeOptions={{ exact: true, includeSearch: false, includeHash: false }}
                className={navLinkClass}
                activeProps={{ className: activeNavClass }}
              >
                Início
              </Link>
            </li>
            <li>
              <Link
                to="/"
                hash="catalogo"
                className={cn(navLinkClass, onMarketplace && activeNavClass)}
                aria-current={onMarketplace ? 'page' : undefined}
                activeOptions={{ exact: true, includeHash: true }}
              >
                Mercado
              </Link>
            </li>
            <li>
              <span
                className={cn(navLinkClass, 'cursor-not-allowed text-foreground/45 hover:text-foreground/45')}
                aria-disabled="true"
                title="Em breve"
              >
                Criadores <span className="sr-only">(em breve)</span>
              </span>
            </li>
            <li>
              <Link to="/" hash="diario" className={navLinkClass} activeOptions={{ exact: true, includeHash: true }}>
                Aprenda
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <SearchDialog
            trigger={
              <Button variant="ghost" size="icon" aria-label="Buscar NFTs">
                <SearchIcon className="size-[18px]" />
              </Button>
            }
          />
          <CartLink className="size-9 rounded-md transition-colors hover:bg-accent" />
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
