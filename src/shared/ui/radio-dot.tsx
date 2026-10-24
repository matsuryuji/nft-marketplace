import { cn } from '@/shared/lib/utils'

export function RadioDot({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        checked ? 'border-primary' : 'border-[#55321F]',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-transparent')} />
    </span>
  )
}
