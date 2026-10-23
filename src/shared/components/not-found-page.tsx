import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'

type NotFoundPageProps = {
  title?: string
  description?: string
}

export function NotFoundPage({
  title = 'Página não encontrada',
  description = 'O endereço acessado não existe ou foi removido.',
}: NotFoundPageProps) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <Button asChild>
        <Link to="/">Voltar ao catálogo</Link>
      </Button>
    </section>
  )
}
