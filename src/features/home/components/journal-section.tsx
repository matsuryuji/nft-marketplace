import { ArrowRight } from 'lucide-react'
import type { Article } from '@/shared/contracts/home'
import { Skeleton } from '@/shared/ui/skeleton'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const gridClass = 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'

function SectionHeading() {
  return (
    <div className="space-y-2 text-center">
      <h2 id="diario-title" className="text-xl font-bold sm:text-2xl">
        Diário da Cunhagem
      </h2>
      <p className="text-xs text-muted-foreground">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>
    </div>
  )
}

export function JournalSection({ articles }: { articles: Article[] }) {
  return (
    <section id="diario" aria-labelledby="diario-title" className="scroll-mt-20 space-y-6">
      <SectionHeading />
      <ul className={gridClass}>
        {articles.map((article) => (
          <li key={article.id}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg bg-surface">
              <img
                src={article.image.url}
                alt=""
                width={article.image.width}
                height={article.image.height}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-[11px] text-muted-foreground">
                  <time dateTime={article.publishedAt}>{dateFormatter.format(new Date(article.publishedAt))}</time>
                  <span aria-hidden="true"> | </span>
                  <span className="sr-only">, </span>
                  Leitura de {article.readingMinutes} min
                </p>
                <h3 className="text-sm leading-snug font-bold">{article.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{article.excerpt}</p>
                <span
                  className="mt-auto inline-flex cursor-not-allowed items-center gap-1 pt-2 text-[11px] font-bold text-highlight/60 uppercase"
                  aria-disabled="true"
                  title="Conteúdo editorial em breve"
                >
                  Ler mais <span className="sr-only">(em breve)</span>
                  <ArrowRight className="size-3" aria-hidden="true" />
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function JournalSkeleton() {
  return (
    <section aria-labelledby="diario-title" className="space-y-6">
      <SectionHeading />
      <div className={gridClass} role="status" aria-label="Carregando artigos">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="overflow-hidden rounded-lg bg-surface">
            <Skeleton className="aspect-[4/3] rounded-lg" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
