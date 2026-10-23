import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { registerFormSchema, type RegisterForm as RegisterValues, type Session } from '@/shared/contracts/auth'
import { useRegister } from '../session'
import { AuthField } from './auth-field'
import { applyServerErrors } from './form-feedback'
import { PasswordField } from './password-field'
import { FormAlert, SubmitButton } from './submit-button'

export function RegisterForm({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const mutation = useRegister()
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  })
  const { errors } = form.formState

  const submit = form.handleSubmit(({ username, email, password }) => {
    if (mutation.isPending) return
    mutation.mutate({ username, email, password }, {
      onSuccess: (session) => {
        toast.success(`Conta criada! Bem-vindo à Kurio, ${session.user.displayName}.`)
        onSuccess(session)
      },
      onError: (error) => applyServerErrors(error, form.setError, ['username', 'email', 'password']),
    })
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <AuthField
        label="Nome de usuário"
        autoComplete="username"
        autoCapitalize="none"
        placeholder="Nome de usuário"
        error={errors.username?.message}
        {...form.register('username')}
      />
      <AuthField
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <PasswordField
        label="Senha"
        autoComplete="new-password"
        placeholder="Senha"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <PasswordField
        label="Confirmar senha"
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />
      <FormAlert message={errors.root?.server?.message} />
      <div className="pt-4">
        <SubmitButton pending={mutation.isPending} pendingLabel="Criando conta…">
          <span className="md:hidden">Criar perfil</span>
          <span className="hidden md:inline">Criar conta</span>
        </SubmitButton>
      </div>
    </form>
  )
}
