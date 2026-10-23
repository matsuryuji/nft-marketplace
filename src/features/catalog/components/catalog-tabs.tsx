import { Link } from '@tanstack/react-router'
import { nftTabs } from '@/shared/contracts/nft'
import { cn } from '@/shared/lib/utils'
import { catalogRoute } from '../route-api'
import { tabLabels } from '../search'

export function CatalogTabs() {
  const tab = catalogRoute.useSearch({ select: (search) => search.tab })

  return (
    <nav aria-label="Seções do catálogo" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex min-w-max items-center gap-5">
        {nftTabs.map((option) => (
          <li key={option}>
            <Link
              from="/"
              search={(prev) => ({ ...prev, tab: option, page: 1 })}
              resetScroll={false}
              aria-current={tab === option ? 'true' : undefined}
              className={cn(
                'relative block py-2 text-sm whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5',
                tab === option
                  ? 'text-highlight after:bg-highlight'
                  : 'text-foreground hover:text-highlight after:bg-transparent',
              )}
            >
              {tabLabels[option]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
