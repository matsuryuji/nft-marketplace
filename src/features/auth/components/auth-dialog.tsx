import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'
import type { AuthMode } from '../auth-search'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { SocialLogin } from './social-login'

const rootRoute = getRouteApi('__root__')

const copy: Record<AuthMode, { title: string; mobileTitle: string; description: string }> = {
  login: {
    title: 'Entrar',
    mobileTitle: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  register: {
    title: 'Criar conta',
    mobileTitle: 'Criar perfil de colecionador',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
}

const contentClass = cn(
  'top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-0 bg-background p-0 shadow-none duration-300 sm:max-w-none',
  'max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=closed]:zoom-out-100 max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=open]:zoom-in-100',
  'md:top-1/2 md:left-1/2 md:h-auto md:max-h-[calc(100dvh-2rem)] md:max-w-[35rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:border md:border-surface-strong md:bg-surface md:shadow-2xl',
)

function ModeTabs({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  const tabs: AuthMode[] = ['login', 'register']
  return (
    <div className="hidden items-center justify-center md:flex" role="group" aria-label="Escolha entre entrar ou criar conta">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          aria-pressed={mode === tab}
          className={cn(
            'px-2.5 text-[22px] leading-7 transition-colors hover:text-highlight',
            index > 0 && 'border-l border-primary',
            mode === tab ? 'text-highlight' : 'text-foreground',
          )}
        >
          {copy[tab].title}
        </button>
      ))}
    </div>
  )
}

export function AuthDialog() {
  const router = useRouter()
  const { auth: mode, redirect } = rootRoute.useSearch()
  const navigate = useNavigate()

  const setMode = (next: AuthMode | undefined, options?: { keepRedirect?: boolean }) =>
    navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        auth: next,
        redirect: next || options?.keepRedirect ? prev.redirect : undefined,
      }),
      replace: true,
      resetScroll: false,
    })

  const handleSuccess = () => {
    if (redirect) {
      router.history.replace(redirect)
      return
    }
    void setMode(undefined)
    void router.invalidate()
  }

  const current = mode ?? 'login'
  const text = copy[current]

  return (
    <Dialog open={Boolean(mode)} onOpenChange={(open) => !open && setMode(undefined)}>
      <DialogContent
        showCloseButton={false}
        className={contentClass}
        aria-describedby="auth-dialog-description"
        onOpenAutoFocus={(event) => {
          if (!window.matchMedia('(min-width: 48rem)').matches) return
          event.preventDefault()
          ;(event.currentTarget as HTMLElement).querySelector<HTMLInputElement>('form input')?.focus()
        }}
      >
        <DialogClose className="absolute top-4 right-4 z-10 rounded-sm p-1 text-primary transition-colors hover:text-highlight md:top-5 md:right-5">
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Fechar</span>
        </DialogClose>

        <div className="mx-auto flex w-full max-w-[24rem] flex-col px-6 pt-16 pb-10 md:max-w-[26rem] md:px-6 md:pt-14 md:pb-0">
          <p className="mb-16 text-center text-2xl font-bold tracking-[0.12em] md:hidden" aria-hidden="true">
            KURIO
          </p>
          <ModeTabs mode={current} onChange={(next) => setMode(next, { keepRedirect: true })} />
          <DialogTitle className="mb-8 text-center text-base font-bold md:sr-only">{text.mobileTitle}</DialogTitle>
          <DialogDescription
            id="auth-dialog-description"
            className="sr-only text-center text-sm leading-relaxed text-foreground md:not-sr-only md:mt-12 md:mb-8 md:block"
          >
            {text.description}
          </DialogDescription>

          {current === 'login' ? (
            <LoginForm key="login" onSuccess={handleSuccess} />
          ) : (
            <RegisterForm key="register" onSuccess={handleSuccess} />
          )}
        </div>

        <div className="mx-auto mt-2 w-full max-w-[24rem] px-6 md:mt-9 md:max-w-none md:px-0">
          <div className="flex items-center gap-3" role="separator" aria-label="Ou continue com">
            <span className="h-px flex-1 bg-foreground/10" />
            <span className="text-sm" aria-hidden="true">
              Ou continue com
            </span>
            <span className="h-px flex-1 bg-foreground/10" />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col px-6 pt-4 pb-12 md:max-w-[26rem] md:flex-none md:pb-14">
          <SocialLogin />
          <p className="mt-auto pt-12 text-center text-sm text-muted-foreground md:hidden">
            {current === 'login' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
            <button
              type="button"
              onClick={() => setMode(current === 'login' ? 'register' : 'login', { keepRedirect: true })}
              className="rounded-sm text-muted-foreground underline-offset-4 hover:text-highlight hover:underline"
            >
              {current === 'login' ? 'Crie uma conta' : 'Entre'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
