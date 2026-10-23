import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type QuantityStepperProps = {
  value: number
  max: number
  onChange: (update: (current: number) => number) => void
  disabled?: boolean
  labelVisible?: boolean
  className?: string
}

const buttonClass =
  'flex items-center justify-center rounded-[10px] bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60'

export function QuantityStepper({ value, max, onChange, disabled, labelVisible, className }: QuantityStepperProps) {
  const id = useId()
  const clamp = (next: number) => Math.min(Math.max(1, Math.trunc(next) || 1), Math.max(1, max))
  const atLimit = !disabled && max > 0 && value >= max

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className={labelVisible ? 'text-xs text-foreground/80' : 'sr-only'}>
          {labelVisible ? 'Qtd.' : 'Quantidade'}
        </label>
        <button
          type="button"
          onClick={() => onChange((current) => clamp(current - 1))}
          disabled={disabled || value <= 1}
          aria-label="Diminuir quantidade"
          aria-controls={id}
          className={cn(buttonClass, labelVisible ? 'h-6 w-5 rounded-md' : 'h-9 w-7')}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            const next = clamp(Number(event.target.value))
            onChange(() => next)
          }}
          className="w-7 [appearance:textfield] bg-transparent text-center text-sm tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange((current) => clamp(current + 1))}
          disabled={disabled || value >= max}
          aria-label="Aumentar quantidade"
          aria-controls={id}
          className={cn(buttonClass, labelVisible ? 'h-6 w-5 rounded-md' : 'h-9 w-7')}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
      <p aria-live="polite" className="min-h-4 text-[10px] text-muted-foreground">
        {atLimit && `Limite de ${max} por pedido nesta edição.`}
      </p>
    </div>
  )
}
