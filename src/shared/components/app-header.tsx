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

type Section = 'home' | 'market' | 'learn' | null

function currentSection(pathname: string, hash: string): Section {
  if (pathname.startsWith('/nfts/')) return 'market'
  if (pathname !== '/') return null
  if (hash === 'catalog') return 'market'
  if (hash === 'journal') return 'learn'
  return 'home'
}

const sectionProps = (active: boolean) => ({
  className: cn(navLinkClass, active && activeNavClass),
  'aria-current': active ? ('page' as const) : undefined,
  activeOptions: { exact: true, includeSearch: false, includeHash: true },
  activeProps: {},
})

export function AppHeader() {
  const section = useRouterState({ select: (state) => currentSection(state.location.pathname, state.location.hash) })

  return (
    <header className="sticky top-0 z-40 hidden bg-background/95 backdrop-blur md:block">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="flex h-14 items-center justify-between gap-6 border-b border-primary">
          <Link to="/" className="rounded-sm text-sm font-bold tracking-[0.2em]" aria-label="Kurio, página inicial">
            KURIO
          </Link>

          <nav aria-label="Principal">
            <ul className="flex items-center gap-8">
              <li>
                <Link to="/" {...sectionProps(section === 'home')}>
                  Início
                </Link>
              </li>
              <li>
                <Link to="/" hash="catalog" {...sectionProps(section === 'market')}>
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
                <Link to="/" hash="journal" {...sectionProps(section === 'learn')}>
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
      </div>
    </header>
  )
}
