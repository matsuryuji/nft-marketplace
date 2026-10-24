import { forwardRef, useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ChevronDown, Eye } from 'lucide-react'
import type { FieldError } from 'react-hook-form'
import { HideIcon } from '@/shared/icons'
import { cn } from '@/shared/lib/utils'

export const controlClass =
  'w-full rounded-[3px] border border-[#3F2319] bg-background px-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus-visible:outline-none aria-invalid:border-destructive'

export type FieldControlProps = {
  id: string
  'aria-invalid': boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}

type FieldProps = {
  label: string
  required?: boolean
  error?: FieldError
  className?: string
  hideLabel?: boolean
  children: (props: FieldControlProps) => ReactNode
}

export function Field({ label, required, error, className, hideLabel, children }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className={cn('block text-[13px]', hideLabel && 'md:invisible')}>
        {label}
        {required && (
          <span className="ml-0.5 text-[#e2583e]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
        'aria-required': required || undefined,
      })}
      {error?.message && (
        <p id={errorId} className="text-[11px] text-destructive">
          {error.message}
        </p>
      )}
    </div>
  )
}

export const SelectControl = forwardRef<HTMLSelectElement, ComponentProps<'select'>>(function SelectControl(
  { children, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} {...props} className={cn(controlClass, 'h-8 appearance-none pr-8', className)}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
})

export const PasswordControl = forwardRef<HTMLInputElement, Omit<ComponentProps<'input'>, 'type'> & { label: string }>(
  function PasswordControl({ label, className, ...props }, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <div className="relative">
        <input ref={ref} type={visible ? 'text' : 'password'} {...props} className={cn(controlClass, 'h-8 pr-10', className)} />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-1 flex w-8 items-center justify-center text-[#b39463] hover:text-foreground"
        >
          {visible ? <Eye className="size-4" aria-hidden="true" /> : <HideIcon className="h-3 w-[15px]" />}
        </button>
      </div>
    )
  },
)
