import { useId, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toApiError } from '@/shared/api/errors'
import { newsletterRequestSchema } from '@/shared/contracts/home'
import { cn } from '@/shared/lib/utils'
import { subscribeNewsletter } from './api'

export function NewsletterForm() {
  const id = useId()
  const [email, setEmail] = useState('')
  const [clientError, setClientError] = useState<string>()
  const mutation = useMutation({ mutationFn: subscribeNewsletter })

  const apiError = mutation.isError ? toApiError(mutation.error) : null
  const error = clientError ?? apiError?.fields.email ?? apiError?.message
  const errorId = `${id}-error`
  const statusId = `${id}-status`

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (mutation.isPending) return
    const parsed = newsletterRequestSchema.safeParse({ email: email.trim() })
    if (!parsed.success) {
      setClientError(parsed.error.issues[0]?.message)
      return
    }
    setClientError(undefined)
    mutation.mutate(parsed.data, { onSuccess: () => setEmail('') })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <label htmlFor={id} className="block text-[15px] leading-4 font-bold">
        Antecipe-se ao próximo lançamento
      </label>
      <div className="flex h-8">
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="digite seu e-mail..."
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setClientError(undefined)
            if (mutation.isError || mutation.isSuccess) mutation.reset()
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={cn(error && errorId, statusId) || undefined}
          className="h-full min-w-0 flex-1 rounded-l-[3px] bg-surface-strong px-2.5 text-xs caret-highlight outline-none placeholder:text-muted-foreground/80 focus:outline-none focus-visible:outline-none aria-invalid:ring-1 aria-invalid:ring-destructive"
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-full rounded-r-[3px] bg-primary px-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {mutation.isPending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <p id={statusId} aria-live="polite" className="max-w-64 text-[11px] leading-relaxed text-muted-foreground">
        {mutation.isSuccess
          ? `Inscrição confirmada para ${mutation.data.email}.`
          : 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
      </p>
    </form>
  )
}
