import { Link } from '@tanstack/react-router'
import { Construction } from 'lucide-react'
import { Button } from '@/shared/ui/button'

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <Construction className="size-10 text-highlight" aria-hidden="true" />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">Esta área ainda está em desenvolvimento e não executa nenhuma ação.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
