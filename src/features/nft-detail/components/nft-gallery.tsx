import { useState } from 'react'
import { SearchIcon } from '@/shared/icons'
import type { NftImage } from '@/shared/contracts/nft'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'

export function NftGallery({ images, name }: { images: NftImage[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex] ?? images[0]

  return (
    <div className="flex gap-3 lg:gap-4">
      {images.length > 1 && (
        <ul className="hidden w-[5.5rem] shrink-0 flex-col gap-3 md:flex lg:w-24" aria-label="Imagens do NFT">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-pressed={index === activeIndex}
                aria-label={`Exibir imagem ${index + 1} de ${images.length}`}
                className={cn(
                  'block aspect-square w-full overflow-hidden rounded-lg border-2 transition-colors',
                  index === activeIndex ? 'border-primary' : 'border-transparent hover:border-primary/50',
                )}
              >
                <img
                  src={image.url}
                  alt=""
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative min-w-0 flex-1 md:rounded-[3px] md:bg-surface md:p-4">
        <img
          src={active.url}
          alt={active.alt}
          width={active.width}
          height={active.height}
          fetchPriority="high"
          className="aspect-square w-full rounded-2xl object-cover md:aspect-[4/4.15] md:rounded-xl"
        />
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="absolute top-2 right-2 hidden size-7 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors hover:text-highlight md:flex"
            >
              <SearchIcon className="size-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[min(90vw,40rem)] border-surface-strong bg-surface p-3 sm:max-w-[min(90vw,40rem)]">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <DialogDescription className="sr-only">Imagem ampliada do NFT</DialogDescription>
            <img
              src={active.url}
              alt={active.alt}
              width={active.width}
              height={active.height}
              className="w-full rounded-xl"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
