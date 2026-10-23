import { Mail } from 'lucide-react'
import { LinkedinIcon, TwitterIcon } from '@/shared/icons'

export function ShareLinks({ title }: { title: string }) {
  const url = typeof window === 'undefined' ? '' : window.location.href.split('?')[0]
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(`${title} na Kurio`)
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <LinkedinIcon className="size-3" />,
      external: true,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: <Mail className="size-3.5" aria-hidden="true" />,
      external: false,
    },
    {
      label: 'Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <TwitterIcon className="size-3" />,
      external: true,
    },
  ]

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-bold">Compartilhar este NFT:</span>
      <ul className="flex items-center gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              aria-label={`Compartilhar por ${link.label}${link.external ? ' (abre em nova aba)' : ''}`}
              className="flex size-5 items-center justify-center rounded-sm text-foreground transition-colors hover:text-highlight"
            >
              {link.icon}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
