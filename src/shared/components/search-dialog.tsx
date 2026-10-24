import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { SearchIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'

export function SearchDialog({ trigger }: { trigger: ReactNode }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setTerm('')
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="top-24 translate-y-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Explorar coleções</DialogTitle>
          <DialogDescription>Busque por nome do NFT, coleção ou criador.</DialogDescription>
        </DialogHeader>
        <form
          role="search"
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const q = term.trim() || undefined
            setOpen(false)
            navigate({ to: '/', search: { q }, hash: 'catalog' })
          }}
        >
          <label htmlFor="global-search" className="sr-only">
            Buscar NFTs
          </label>
          <Input
            id="global-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Ex.: Emerald Ape"
            maxLength={80}
            autoComplete="off"
            className="h-11"
          />
          <Button type="submit" className="h-11">
            <SearchIcon className="size-4" />
            Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
