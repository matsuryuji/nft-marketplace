import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { controlClass, Field, SelectControl } from '@/shared/components/form-field'
import {
  walletNetworks,
  walletProviderLabels,
  walletProviders,
  type WalletNetwork,
} from '@/shared/contracts/wallet'
import { cn } from '@/shared/lib/utils'
import type { CheckoutFormOutput, CheckoutFormValues } from '../form'

const networkOptionLabels: Record<WalletNetwork, string> = { ethereum: 'Ethereum', polygon: 'Polygon' }

type CheckoutFieldsProps = {
  form: UseFormReturn<CheckoutFormValues, unknown, CheckoutFormOutput>
  layout: 'grid' | 'stack'
  otherWalletToggle?: ReactNode
}

export function CheckoutFields({ form, layout, otherWalletToggle }: CheckoutFieldsProps) {
  const { register, formState } = form
  const buyerErrors = formState.errors.buyer
  const walletErrors = formState.errors.wallet
  const grid = layout === 'grid'

  const displayName = (
    <Field key="displayName" label="Nome de exibição" required error={buyerErrors?.displayName}>
      {(props) => <input {...props} autoComplete="name" className={cn(controlClass, 'h-8')} {...register('buyer.displayName')} />}
    </Field>
  )
  const username = (
    <Field key="username" label="Nome de usuário" required error={buyerErrors?.username}>
      {(props) => <input {...props} autoComplete="username" autoCapitalize="none" className={cn(controlClass, 'h-8')} {...register('buyer.username')} />}
    </Field>
  )
  const network = (
    <Field key="network" label="Rede" required error={walletErrors?.network}>
      {(props) => (
        <SelectControl {...props} required className="invalid:text-muted-foreground/70" {...register('wallet.network')}>
          <option value="" disabled>
            Selecione uma rede
          </option>
          {walletNetworks.map((option) => (
            <option key={option} value={option}>
              {networkOptionLabels[option]}
            </option>
          ))}
        </SelectControl>
      )}
    </Field>
  )
  const label = (
    <Field key="label" label="Nome da carteira" required error={walletErrors?.label}>
      {(props) => <input {...props} className={cn(controlClass, 'h-8')} {...register('wallet.label')} />}
    </Field>
  )
  const address = (
    <Field key="address" label="Endereço da carteira" required error={walletErrors?.address}>
      {(props) => (
        <input
          {...props}
          placeholder="Endereço 0x da carteira"
          spellCheck={false}
          autoComplete="off"
          className={cn(controlClass, 'h-8 font-mono')}
          {...register('wallet.address')}
        />
      )}
    </Field>
  )
  const ens = (
    <Field key="ens" label="Nome ENS (opcional)" hideLabel={grid} error={walletErrors?.ensName}>
      {(props) => (
        <input
          {...props}
          placeholder="ENS ou carteira secundária (opcional)"
          autoComplete="off"
          className={cn(controlClass, 'h-8')}
          {...register('wallet.ensName')}
        />
      )}
    </Field>
  )
  const provider = (
    <Field key="provider" label="Tipo de carteira" required error={walletErrors?.provider}>
      {(props) => (
        <SelectControl {...props} required className="invalid:text-muted-foreground/70" {...register('wallet.provider')}>
          <option value="" disabled>
            Selecione uma carteira
          </option>
          {walletProviders.map((option) => (
            <option key={option} value={option}>
              {walletProviderLabels[option]}
            </option>
          ))}
        </SelectControl>
      )}
    </Field>
  )
  const referral = (
    <Field key="referral" label="Código de indicação (opcional)" error={buyerErrors?.referralCode}>
      {(props) => <input {...props} autoComplete="off" className={cn(controlClass, 'h-8 uppercase')} {...register('buyer.referralCode')} />}
    </Field>
  )
  const email = (
    <Field key="email" label="E-mail" required error={buyerErrors?.email}>
      {(props) => <input {...props} type="email" inputMode="email" autoComplete="email" className={cn(controlClass, 'h-8')} {...register('buyer.email')} />}
    </Field>
  )
  const note = (
    <Field key="note" label="Observação do colecionador (opcional)" error={buyerErrors?.note} className={grid ? 'col-span-2 max-w-[18rem]' : undefined}>
      {(props) => <textarea {...props} rows={6} className={cn(controlClass, 'resize-none py-2')} {...register('buyer.note')} />}
    </Field>
  )

  if (grid) {
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        {displayName}
        {username}
        {network}
        {label}
        {address}
        {ens}
        {provider}
        {referral}
        {email}
        <div />
        {otherWalletToggle && <div className="col-span-2">{otherWalletToggle}</div>}
        {note}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-bold">Carteira</legend>
        {label}
        {network}
        {address}
        {ens}
        {provider}
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-bold">Perfil do colecionador</legend>
        {displayName}
        {username}
        {email}
        {referral}
        {note}
      </fieldset>
    </div>
  )
}
