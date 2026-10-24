import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { NewsletterForm } from '@/features/newsletter/newsletter-form'
import { categoryLabels } from '@/features/catalog/search'
import type { NftCategory } from '@/shared/contracts/nft'
import { cn } from '@/shared/lib/utils'
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon, YoutubeIcon } from '@/shared/icons'

const benefits = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const footerCategories: NftCategory[] = ['digital-art', 'photography', 'music', '3d-art', 'utility']

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com', Icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com', Icon: InstagramIcon },
  { label: 'Twitter', href: 'https://x.com', Icon: TwitterIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', Icon: LinkedinIcon },
  { label: 'YouTube', href: 'https://www.youtube.com', Icon: YoutubeIcon },
]

const wallets = ['MetaMask', 'WalletConnect', 'Coinbase']

const linkClass = 'text-[13px] text-foreground transition-colors hover:text-highlight'

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-bold">{title}</h2>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  )
}

function SoonItem({ children }: { children: ReactNode }) {
  return (
    <li>
      <span className="text-[13px] text-foreground" aria-disabled="true" title="Em breve">
        {children} <span className="sr-only">(em breve)</span>
      </span>
    </li>
  )
}

export function AppFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('mx-auto mb-20 w-full max-w-6xl px-4 pb-6 sm:px-6 md:mb-0', className)}>
      <div className="bg-surface">
        <div className="grid gap-8 px-6 py-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.3fr] lg:gap-0 lg:px-10">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={cn('max-sm:flex max-sm:flex-col max-sm:items-center max-sm:text-center', index > 0 ? 'lg:border-l-2 lg:border-primary lg:pl-3.5' : 'lg:pr-3.5')}
            >
              <span
                aria-hidden="true"
                className="flex size-15 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
              >
                {benefit.letter}
              </span>
              <h2 className="mt-3 text-sm font-bold">{benefit.title}</h2>
              <p className="mt-2 max-w-48 text-xs leading-relaxed text-muted-foreground">{benefit.text}</p>
            </div>
          ))}
          <div className="lg:border-l-2 lg:border-primary lg:pl-3.5">
            <NewsletterForm />
          </div>
        </div>

        <div className="grid gap-3 bg-surface-strong px-6 py-6 text-[13px] sm:grid-cols-2 sm:items-center lg:grid-cols-4 lg:py-8">
          <p className="font-bold tracking-[0.1em]">KURIO</p>
          <p className="max-w-52">Feito para colecionadores, criadores e cultura</p>
          <a href="mailto:contato@email.com" className="hover:text-highlight">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="hover:text-highlight">
            +55 11 4002 8922
          </a>
        </div>

        <div className="grid gap-8 px-6 pt-6 pb-8 sm:grid-cols-2 lg:grid-cols-4">
          <FooterColumn title="Meu perfil">
            <li>
              <Link to="/profile" className={linkClass}>
                Meu perfil
              </Link>
            </li>
            <li>
              <Link to="/favorites" className={linkClass}>
                Minha coleção
              </Link>
            </li>
            <SoonItem>Atividade</SoonItem>
            <li>
              <Link to="/wallets" className={linkClass}>
                Estúdio do criador
              </Link>
            </li>
            <li>
              <Link to="/favorites" className={linkClass}>
                Lista de interesse
              </Link>
            </li>
          </FooterColumn>
          <FooterColumn title="Central de ajuda">
            <SoonItem>Central de ajuda</SoonItem>
            <SoonItem>Como comprar NFTs</SoonItem>
            <SoonItem>Carteira e segurança</SoonItem>
            <SoonItem>Política do mercado</SoonItem>
            <SoonItem>Denunciar item</SoonItem>
          </FooterColumn>
          <FooterColumn title="Coleções">
            {footerCategories.map((category) => (
              <li key={category}>
                <Link to="/" search={{ category: [category] }} hash="catalogo" className={linkClass}>
                  {categoryLabels[category]}
                </Link>
              </li>
            ))}
          </FooterColumn>
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-base font-bold">Redes sociais</h2>
              <ul className="flex flex-wrap gap-1.5">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social.label} (abre em nova aba)`}
                      className="flex size-[27px] items-center justify-center rounded-[5px] border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <social.Icon className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h2 className="text-base font-bold">Carteiras compatíveis</h2>
              <ul className="inline-flex flex-wrap items-center gap-x-1.5 rounded-[3px] border border-primary/30 bg-surface-strong px-2 py-1 text-[9px] font-bold text-primary uppercase">
                {wallets.map((wallet, index) => (
                  <li key={wallet} className="flex items-center gap-x-1.5">
                    {index > 0 && <span aria-hidden="true">·</span>}
                    {wallet}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <p className="pt-4 text-center text-[13px]">© {new Date().getFullYear()} Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
