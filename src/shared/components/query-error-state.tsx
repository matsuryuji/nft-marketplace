import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { toApiError } from '@/shared/api/errors'
import { cn } from '@/shared/lib/utils'

type QueryErrorStateProps = {
  error: unknown
  title?: string
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}

export function QueryErrorState({ error, title, onRetry, isRetrying, className }: QueryErrorStateProps) {
  const apiError = toApiError(error)
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-10 text-center',
        className,
      )}
    >
      <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-semibold">{title ?? 'Não foi possível carregar os dados'}</p>
        <p className="text-sm text-muted-foreground">{apiError.message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
          <RotateCw className={cn('size-4', isRetrying && 'animate-spin')} aria-hidden="true" />
          {isRetrying ? 'Tentando novamente…' : 'Tentar novamente'}
        </Button>
      )}
    </div>
  )
}
