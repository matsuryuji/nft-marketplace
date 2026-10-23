import { useId, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { toApiError } from '@/shared/api/errors'
import { applyCouponRequestSchema, type Cart } from '@/shared/contracts/cart'
import { cn } from '@/shared/lib/utils'
import { useCouponMutations } from '../queries'

export function CouponForm({ cart }: { cart: Cart }) {
  const id = useId()
  const [code, setCode] = useState('')
  const [clientError, setClientError] = useState<string>()
  const { apply, remove } = useCouponMutations()
  const apiError = apply.isError ? toApiError(apply.error) : null
  const error = clientError ?? apiError?.fields.code ?? apiError?.message
  const errorId = `${id}-error`

  if (cart.coupon) {
    return (
      <div className="space-y-1.5">
        <p className="sr-only text-xs font-bold md:not-sr-only md:mb-2">Código promocional</p>
        <div className="flex items-center justify-between gap-2 rounded-full border border-primary/50 bg-primary/10 py-1.5 pr-1.5 pl-4 text-xs md:rounded-[3px]">
          <span>
            <span className="font-bold text-highlight">{cart.coupon.code}</span>
            <span className="text-muted-foreground"> · {cart.coupon.description}</span>
          </span>
          <button
            type="button"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            aria-label={`Remover o cupom ${cart.coupon.code}`}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (apply.isPending) return
    const parsed = applyCouponRequestSchema.safeParse({ code })
    if (!parsed.success) {
      setClientError(parsed.error.issues[0]?.message)
      return
    }
    setClientError(undefined)
    apply.mutate(parsed.data.code, { onSuccess: () => setCode('') })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-1.5">
      <label htmlFor={id} className="sr-only text-xs font-bold md:not-sr-only md:mb-2 md:block">
        Código promocional
      </label>
      <div className="flex gap-2 rounded-full border border-[#3F2319] bg-background p-1 md:gap-0 md:rounded-[3px] md:p-0">
        <input
          id={id}
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase())
            setClientError(undefined)
            if (apply.isError) apply.reset()
          }}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-9 min-w-0 flex-1 bg-transparent px-3 text-xs uppercase outline-none placeholder:text-muted-foreground/70 placeholder:normal-case focus-visible:outline-none md:h-8"
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className={cn(
            'h-9 shrink-0 rounded-full border border-[#3F2319] bg-[#2F1D15] px-5 text-sm font-bold text-foreground transition-opacity hover:opacity-90 disabled:opacity-60',
            'md:h-8 md:rounded-none md:rounded-r-[3px] md:border-0 md:bg-primary md:px-4 md:text-xs md:text-primary-foreground',
          )}
        >
          {apply.isPending ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
