import { Link } from '@tanstack/react-router'
import { ChevronDown, Heart, LogOut, UserRound, Wallet } from 'lucide-react'
import { LoginIcon } from '@/shared/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useSession } from '../session'
import { useSignOut } from '../use-sign-out'

export function AccountMenu() {
  const { user, isPending } = useSession()
  const { signOut, isPending: signingOut } = useSignOut()

  if (isPending) return <span className="ml-2 h-8 w-24 rounded-[4px] bg-surface" aria-hidden="true" />

  if (!user) {
    return (
      <Link
        to="."
        search={(prev) => ({ ...prev, auth: 'login' as const })}
        resetScroll={false}
        className="ml-2 inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-primary px-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <LoginIcon className="size-4" />
        Entrar
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ml-2 flex h-8 items-center gap-2 rounded-[4px] border border-primary px-2 text-sm transition-colors hover:bg-primary/10">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" width={20} height={20} className="size-5 rounded-full" />
        ) : (
          <UserRound className="size-4 text-primary" aria-hidden="true" />
        )}
        <span className="max-w-32 truncate">{user.displayName}</span>
        <ChevronDown className="size-3.5 text-primary" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-surface-strong bg-surface">
        <DropdownMenuLabel className="space-y-0.5">
          <span className="block truncate text-sm">{user.displayName}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserRound aria-hidden="true" />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/wallets">
            <Wallet aria-hidden="true" />
            Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/favorites">
            <Heart aria-hidden="true" />
            Favoritos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signingOut} onSelect={signOut}>
          <LogOut aria-hidden="true" />
          {signingOut ? 'Saindo…' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
