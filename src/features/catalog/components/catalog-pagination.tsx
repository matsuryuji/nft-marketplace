import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type CatalogPaginationProps = {
  page: number
  totalPages: number
}

const MAX_VISIBLE = 4

function visiblePages(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 1, totalPages - MAX_VISIBLE + 1))
  return Array.from({ length: Math.min(MAX_VISIBLE, totalPages) }, (_, index) => start + index)
}

const itemClass =
  'flex size-7 items-center justify-center rounded-[3px] border border-foreground/20 text-xs transition-colors hover:border-highlight hover:text-highlight'

export function CatalogPagination({ page, totalPages }: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  const arrow = (target: number, label: string, icon: React.ReactNode) => (
    <Link
      from="/"
      search={(prev) => ({ ...prev, page: target })}
      hash="catalogo"
      activeOptions={{ exact: true }}
      className={itemClass}
      aria-label={label}
    >
      {icon}
    </Link>
  )

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex items-center gap-1.5">
        {page > 1 && <li>{arrow(page - 1, 'Página anterior', <ChevronLeft className="size-3.5" />)}</li>}
        {visiblePages(page, totalPages).map((item) => (
          <li key={item}>
            <Link
              from="/"
              search={(prev) => ({ ...prev, page: item })}
              hash="catalogo"
              activeOptions={{ exact: true }}
              aria-label={`Página ${item}`}
              aria-current={item === page ? 'page' : undefined}
              className={cn(itemClass, item === page && 'border-primary bg-primary font-bold text-primary-foreground hover:text-primary-foreground')}
            >
              {item}
            </Link>
          </li>
        ))}
        {page < totalPages && <li>{arrow(page + 1, 'Próxima página', <ChevronRight className="size-3.5" />)}</li>}
      </ul>
    </nav>
  )
}
