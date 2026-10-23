import { useId } from 'react'
import type { NftEdition } from '@/shared/contracts/nft'
import { formatEth } from '@/shared/lib/eth'
import { cn } from '@/shared/lib/utils'

type EditionPickerProps = {
  editions: NftEdition[]
  value: string
  onChange: (editionId: string) => void
}

export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-bold">Edição:</legend>
      <div className="flex flex-wrap gap-1.5">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const selected = value === edition.id
          const id = `${name}-${edition.id}`
          return (
            <label
              key={edition.id}
              htmlFor={id}
              title={soldOut ? 'Esgotada' : `${formatEth(edition.price, 2)} · ${edition.available} disponíveis`}
              className={cn(
                'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] uppercase transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                selected
                  ? 'border-primary font-bold text-foreground'
                  : 'border-foreground/15 text-foreground/80 hover:border-primary/60',
                soldOut && 'cursor-not-allowed text-foreground/35 line-through hover:border-foreground/15',
              )}
            >
              <input
                type="radio"
                id={id}
                name={name}
                value={edition.id}
                checked={selected}
                disabled={soldOut}
                onChange={() => onChange(edition.id)}
                className="sr-only"
              />
              {edition.label}
              <span className="sr-only">
                {soldOut ? ' (esgotada)' : `, ${formatEth(edition.price, 2)}, ${edition.available} disponíveis`}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
