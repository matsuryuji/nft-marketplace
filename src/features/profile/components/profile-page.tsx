import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { toApiError } from '@/shared/api/errors'
import { controlClass, Field, PasswordControl, SelectControl } from '@/shared/components/form-field'
import { QueryErrorState } from '@/shared/components/query-error-state'
import { PASSWORD_MIN_LENGTH } from '@/shared/contracts/auth'
import { ENS_SUFFIXES, type Profile } from '@/shared/contracts/profile'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import { resizeAvatar, validateAvatarFile } from '../avatar'
import { useAvatarMutations, useChangePassword, useProfile, useUpdateProfile } from '../queries'

const profileFormSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Informe seu nome de exibição').max(48, 'Use no máximo 48 caracteres'),
    username: z
      .string()
      .trim()
      .min(3, 'Use pelo menos 3 caracteres')
      .max(20, 'Use no máximo 20 caracteres')
      .regex(/^[a-z0-9_.]+$/, 'Use apenas letras minúsculas, números, ponto ou _'),
    email: z.string().trim().min(1, 'Informe seu e-mail').email('Informe um e-mail válido'),
    ensLabel: z
      .string()
      .trim()
      .toLowerCase()
      .max(32, 'Use no máximo 32 caracteres')
      .regex(/^[a-z0-9-]*$/, 'Use apenas letras, números e hífen'),
    ensSuffix: z.enum(ENS_SUFFIXES),
    walletNickname: z.string().trim().min(2, 'Informe um apelido para a carteira').max(32, 'Use no máximo 32 caracteres'),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const wantsChange = Boolean(values.currentPassword || values.newPassword || values.confirmPassword)
    if (!wantsChange) return
    if (!values.currentPassword) context.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Informe sua senha atual' })
    if (values.newPassword.length < PASSWORD_MIN_LENGTH) {
      context.addIssue({ code: 'custom', path: ['newPassword'], message: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres` })
    } else if (!/[A-Za-z]/.test(values.newPassword) || !/\d/.test(values.newPassword)) {
      context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Inclua pelo menos uma letra e um número' })
    }
    if (values.confirmPassword !== values.newPassword) {
      context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas não coincidem' })
    }
  })

type ProfileFormValues = z.input<typeof profileFormSchema>

function splitEns(ensName: string | null): Pick<ProfileFormValues, 'ensLabel' | 'ensSuffix'> {
  const suffix = [...ENS_SUFFIXES].sort((a, b) => b.length - a.length).find((item) => ensName?.endsWith(item))
  if (!ensName || !suffix) return { ensLabel: ensName ?? '', ensSuffix: '.eth' }
  return { ensLabel: ensName.slice(0, -suffix.length), ensSuffix: suffix }
}

function toFormValues(profile: Profile): ProfileFormValues {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ...splitEns(profile.ensName),
    walletNickname: profile.walletNickname,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

function AvatarControl({ profile }: { profile: Profile }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, remove } = useAvatarMutations()
  const [error, setError] = useState<string | null>(null)
  const busy = upload.isPending || remove.isPending

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const problem = validateAvatarFile(file)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    try {
      const dataUrl = await resizeAvatar(file)
      await upload.mutateAsync(dataUrl)
      toast.success('Avatar atualizado.')
    } catch (uploadError) {
      setError(toApiError(uploadError).message)
    }
  }

  return (
    <div className="space-y-1.5">
      <p id="avatar-label" className="text-[13px]">
        Avatar
      </p>
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-[#2F1D15] text-primary">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={`Avatar de ${profile.displayName}`} width={36} height={36} className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-4" aria-hidden="true" />
          )}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void onFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-describedby={error ? 'avatar-error' : 'avatar-label'}
          className="h-8 rounded-[3px] bg-primary px-4 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {upload.isPending ? 'Enviando…' : 'Alterar'}
        </button>
        <button
          type="button"
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => toast.success('Avatar removido.'),
              onError: (removeError) => setError(toApiError(removeError).message),
            })
          }
          disabled={busy || !profile.avatarUrl}
          className="h-8 px-2 text-xs hover:text-highlight disabled:opacity-40"
        >
          Remover
        </button>
      </div>
      {error ? (
        <p id="avatar-error" role="alert" className="text-[11px] text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">PNG, JPG ou WebP de até 2 MB.</p>
      )}
    </div>
  )
}

function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toFormValues(profile),
    mode: 'onTouched',
  })
  const { register, formState } = form
  const { errors } = formState
  const saving = updateProfile.isPending || changePassword.isPending

  useEffect(() => {
    if (!form.formState.isDirty) form.reset(toFormValues(profile))
  }, [profile, form])

  const submit = form.handleSubmit(async (values) => {
    const profileDirty = ['displayName', 'username', 'email', 'ensLabel', 'ensSuffix', 'walletNickname'].some(
      (key) => formState.dirtyFields[key as keyof ProfileFormValues],
    )
    const wantsPasswordChange = Boolean(values.currentPassword)
    if (!profileDirty && !wantsPasswordChange) {
      toast.info('Nenhuma alteração para salvar.')
      return
    }

    try {
      if (wantsPasswordChange) {
        await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      }
      let latest = profile
      if (profileDirty) {
        latest = await updateProfile.mutateAsync({
          displayName: values.displayName,
          username: values.username,
          email: values.email,
          ensName: values.ensLabel ? `${values.ensLabel}${values.ensSuffix}` : null,
          walletNickname: values.walletNickname,
        })
      }
      form.reset(toFormValues(latest))
      toast.success(wantsPasswordChange && profileDirty ? 'Perfil e senha atualizados.' : wantsPasswordChange ? 'Senha alterada.' : 'Perfil atualizado.')
    } catch (error) {
      const apiError = toApiError(error)
      const mapping: Record<string, keyof ProfileFormValues> = {
        displayName: 'displayName',
        username: 'username',
        email: 'email',
        ensName: 'ensLabel',
        walletNickname: 'walletNickname',
        currentPassword: 'currentPassword',
        newPassword: 'newPassword',
      }
      const matched = Object.entries(apiError.fields).filter(([field]) => mapping[field])
      matched.forEach(([field, message], index) => form.setError(mapping[field], { message }, { shouldFocus: index === 0 }))
      if (matched.length === 0) toast.error('Não foi possível salvar', { description: apiError.message })
    }
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-8" aria-labelledby="profile-title">
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Field label="Nome de exibição" required error={errors.displayName}>
          {(props) => <input {...props} autoComplete="name" className={cn(controlClass, 'h-8')} {...register('displayName')} />}
        </Field>
        <Field label="Nome de usuário" required error={errors.username}>
          {(props) => (
            <input {...props} autoComplete="username" autoCapitalize="none" className={cn(controlClass, 'h-8')} {...register('username')} />
          )}
        </Field>
        <Field label="E-mail" required error={errors.email}>
          {(props) => <input {...props} type="email" autoComplete="email" className={cn(controlClass, 'h-8')} {...register('email')} />}
        </Field>
        <Field label="Nome ENS (opcional)" error={errors.ensLabel}>
          {(props) => (
            <div className="flex gap-1.5">
              <SelectControl aria-label="Sufixo ENS" className="w-[7.75rem] text-xs" {...register('ensSuffix')}>
                {ENS_SUFFIXES.map((suffix) => (
                  <option key={suffix} value={suffix}>
                    {suffix}
                  </option>
                ))}
              </SelectControl>
              <input {...props} placeholder="seunome" autoComplete="off" className={cn(controlClass, 'h-8 flex-1')} {...register('ensLabel')} />
            </div>
          )}
        </Field>
        <Field label="Apelido da carteira" required error={errors.walletNickname}>
          {(props) => <input {...props} className={cn(controlClass, 'h-8')} {...register('walletNickname')} />}
        </Field>
        <AvatarControl profile={profile} />
      </div>

      <fieldset className="space-y-4 sm:max-w-[calc(50%-0.5rem)]">
        <legend className="mb-3 text-sm font-bold">Alterar senha</legend>
        <Field label="Senha atual" error={errors.currentPassword}>
          {(props) => <PasswordControl {...props} label="Senha atual" autoComplete="current-password" {...register('currentPassword')} />}
        </Field>
        <Field label="Nova senha" error={errors.newPassword}>
          {(props) => <PasswordControl {...props} label="Nova senha" autoComplete="new-password" {...register('newPassword')} />}
        </Field>
        <Field label="Confirmar nova senha" error={errors.confirmPassword}>
          {(props) => (
            <PasswordControl {...props} label="Confirmar nova senha" autoComplete="new-password" {...register('confirmPassword')} />
          )}
        </Field>
      </fieldset>

      <button
        type="submit"
        disabled={saving}
        className="h-9 w-full rounded-[3px] bg-primary px-6 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {saving ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}

export function ProfilePage() {
  const query = useProfile()
  return (
    <section aria-labelledby="profile-title" className="space-y-5">
      <h1 id="profile-title" className="text-sm font-bold md:text-[15px]">
        Perfil do colecionador
      </h1>
      {query.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2" role="status" aria-label="Carregando perfil">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <QueryErrorState error={query.error} title="Não foi possível carregar o perfil" onRetry={() => query.refetch()} isRetrying={query.isFetching} />
      ) : (
        <ProfileForm profile={query.data} />
      )}
    </section>
  )
}
