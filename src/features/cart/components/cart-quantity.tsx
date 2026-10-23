import { Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type CartQuantityProps = {
  name: string
  value: number
  max: number
  onChange: (quantity: number) => void
  variant: 'square' | 'round'
  disabled?: boolean
}

const variants = {
  square: {
    button: 'h-6 w-5 rounded-md bg-primary text-primary-foreground hover:opacity-90',
    icon: 'size-3.5',
    value: 'w-5 text-xs',
  },
  round: {
    button: 'size-6 rounded-full border border-[#3F2319] bg-[#2F1D15] text-foreground hover:border-primary',
    icon: 'size-3',
    value: 'w-5 text-sm',
  },
}

export function CartQuantity({ name, value, max, onChange, variant, disabled }: CartQuantityProps) {
  const styles = variants[variant]
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={`Quantidade de ${name}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label={`Diminuir quantidade de ${name}`}
        className={cn('flex items-center justify-center transition disabled:opacity-40', styles.button)}
      >
        <Minus className={styles.icon} aria-hidden="true" />
      </button>
      <output aria-live="polite" className={cn('text-center tabular-nums', styles.value)}>
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`Aumentar quantidade de ${name}`}
        className={cn('flex items-center justify-center transition disabled:opacity-40', styles.button)}
      >
        <Plus className={styles.icon} aria-hidden="true" />
      </button>
    </div>
  )
}
