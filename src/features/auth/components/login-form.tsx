import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { loginRequestSchema, type LoginRequest, type Session } from '@/shared/contracts/auth'
import { useLogin } from '../session'
import { AuthField } from './auth-field'
import { applyServerErrors } from './form-feedback'
import { PasswordField } from './password-field'
import { FormAlert, SubmitButton } from './submit-button'

export function LoginForm({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const mutation = useLogin()
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((values) => {
    if (mutation.isPending) return
    mutation.mutate(values, {
      onSuccess: (session) => {
        toast.success(`Bem-vindo de volta, ${session.user.displayName}!`)
        onSuccess(session)
      },
      onError: (error) => applyServerErrors(error, form.setError, ['email', 'password']),
    })
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <AuthField
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="contato@email.com"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <div className="space-y-2">
        <PasswordField
          label="Senha"
          autoComplete="current-password"
          placeholder="Senha"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              toast.info('A recuperação de senha não está disponível nesta demonstração.', { id: 'forgot-password' })
            }
            className="rounded-sm text-sm text-primary hover:underline"
          >
            Esqueceu a senha?
          </button>
        </div>
      </div>
      <FormAlert message={errors.root?.server?.message} />
      <div className="pt-2">
        <SubmitButton pending={mutation.isPending} pendingLabel="Entrando…">
          Entrar
        </SubmitButton>
      </div>
    </form>
  )
}
