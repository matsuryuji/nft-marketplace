import { toast } from 'sonner'
import { FacebookBrandIcon, GoogleIcon } from '@/shared/icons'

const providers = [
  { name: 'Google', Icon: GoogleIcon, iconClass: 'size-5' },
  { name: 'Facebook', Icon: FacebookBrandIcon, iconClass: 'h-5 w-2.5' },
]

export function SocialLogin() {
  return (
    <div className="space-y-3">
      {providers.map(({ name, Icon, iconClass }) => (
        <button
          key={name}
          type="button"
          onClick={() =>
            toast.info(`Login com ${name} não está disponível nesta demonstração. Use e-mail e senha.`, {
              id: 'social-login',
            })
          }
          className="flex h-11 w-full items-center justify-center gap-3 rounded-[4px] border border-foreground/10 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          <Icon className={iconClass} />
          Continuar com {name}
        </button>
      ))}
    </div>
  )
}
