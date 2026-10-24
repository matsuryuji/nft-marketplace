import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import { BadgePercent, Download, Gem, Heart, LogOut, MapPin, ShoppingCart, TriangleAlert, UserRound } from 'lucide-react'
import { useSignOut } from '@/features/auth/use-sign-out'
import { cn } from '@/shared/lib/utils'

type NavItem =
  | { label: string; Icon: ComponentType<{ className?: string }>; to: '/profile' | '/wallets' | '/collection' | '/favorites' }
  | { label: string; Icon: ComponentType<{ className?: string }>; to?: undefined }

const items: NavItem[] = [
  { label: 'Dados do perfil', Icon: UserRound, to: '/profile' },
  { label: 'Carteiras', Icon: MapPin, to: '/wallets' },
  { label: 'Minha coleção', Icon: Gem, to: '/collection' },
  { label: 'Atividade', Icon: ShoppingCart },
  { label: 'Lista de interesse', Icon: Heart, to: '/favorites' },
  { label: 'Ofertas', Icon: BadgePercent },
  { label: 'Arquivos baixados', Icon: Download },
  { label: 'Suporte', Icon: TriangleAlert },
]

const itemClass =
  'relative flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border border-[#3F2319] px-3.5 py-2 text-xs transition-colors md:rounded-none md:border-0 md:px-4 md:py-2.5'

export function AccountNav() {
  const { signOut, isPending } = useSignOut()

  return (
    <nav aria-label="Meu perfil" className="md:rounded-[3px] md:bg-surface md:py-3">
      <h2 className="mb-3 text-base font-bold md:mb-2 md:px-3">Meu perfil</h2>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-col md:gap-0 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
        {items.map(({ label, Icon, to }) => (
          <li key={label}>
            {to ? (
              <Link
                to={to}
                className={cn(itemClass, 'text-muted-foreground hover:text-highlight')}
                activeProps={{
                  className:
                    'border-primary! bg-primary/10 text-highlight! md:bg-transparent md:before:absolute md:before:inset-y-1 md:before:left-0 md:before:w-1 md:before:bg-primary',
                  'aria-current': 'page',
                }}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            ) : (
              <span className={cn(itemClass, 'cursor-not-allowed text-muted-foreground/50')} aria-disabled="true" title="Em breve">
                <Icon className="size-4" aria-hidden="true" />
                {label}
                <span className="sr-only">(em breve)</span>
              </span>
            )}
          </li>
        ))}
        <li className="md:mt-1 md:border-t md:border-foreground/15 md:pt-1">
          <button
            type="button"
            onClick={signOut}
            disabled={isPending}
            className={cn(itemClass, 'w-full font-bold text-highlight hover:opacity-80 disabled:opacity-50')}
          >
            <LogOut className="size-4" aria-hidden="true" />
            {isPending ? 'Saindo…' : 'Sair'}
          </button>
        </li>
      </ul>
    </nav>
  )
}
