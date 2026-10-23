import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  trailing?: ReactNode
}

export const authInputClass =
  'h-11 w-full rounded-[4px] border border-foreground/10 bg-background/60 px-4 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground/80 focus:border-primary focus-visible:outline-none aria-invalid:border-destructive'

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, error, trailing, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(authInputClass, trailing ? 'pr-12' : undefined, className)}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
})
