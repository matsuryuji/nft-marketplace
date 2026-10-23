import type { ReactNode } from 'react'

export function SubmitButton({ pending, children, pendingLabel }: { pending: boolean; children: ReactNode; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="h-12 w-full rounded-[4px] bg-primary text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
    >
      {pending ? pendingLabel : children}
    </button>
  )
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-[4px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {message}
    </p>
  )
}
