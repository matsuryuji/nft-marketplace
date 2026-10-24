# Arquitetura — Kurio NFT Marketplace

SPA em Vite + React 19 + TypeScript (strict). Toda a "API" roda no navegador via MSW (REST e Socket.IO), então o projeto funciona sem backend, inclusive no deploy estático.

## Visão geral

```
src/
  app/            bootstrap (QueryClient, router, providers, expiração de sessão)
  routes/         rotas de arquivo do TanStack Router
  features/       auth, catalog, home, nft-detail, cart, checkout, orders, wallets, profile, favorites, realtime
  shared/
    api/          cliente Axios, normalização de erros, gate de transporte
    contracts/    schemas Zod compartilhados entre cliente e mocks
    components/   componentes de produto (header, footer, form-field…)
    ui/           primitivas shadcn/radix
    icons/        SVGs do Figma como componentes
  mocks/          MSW: db em localStorage, fixtures, handlers, hub realtime, cenários
```

- **Roteamento**: rotas de arquivo com `autoCodeSplitting`. O estado de URL (filtros, busca, ordenação, página, modal de auth) é validado com Zod em `validateSearch`. Parâmetros padrão são removidos da URL (`stripSearchParams`) e arrays usam chaves repetidas (`?network=ethereum&network=polygon`). Áreas autenticadas ficam sob o layout `_auth` (e `_auth/_account` para perfil, carteiras e favoritos). Rotas inexistentes caem em uma página 404.
- **Layout por rota**: `staticData` de cada rota controla o chrome compartilhado:
  - `mobileNav`: barra inferior ou barra de compra;
  - `mobileFooter`: esconde o footer só no mobile, como no checkout;
  - `footer`: esconde o footer em todas as larguras, como em perfil e carteiras; nesse caso o `main` reserva o espaço da navegação inferior no mobile.
- **Dados**: TanStack Query para todo estado de servidor, sem estado global adicional. Formulários usam react-hook-form + `zodResolver`.
- **Valores monetários**: strings decimais (`"4.30"`) no contrato e `decimal.js` no cliente; nunca `number` para ETH.
- **Inicialização**:
  - `main.tsx` carrega o bundle do app e o módulo de cenários em paralelo e monta o app sem esperar o MSW;
  - o módulo de cenários lê `?mock-scenario` antes de o router montar, então o parâmetro nunca se perde;
  - o interceptor do Axios e o socket aguardam `whenTransportReady()` antes de qualquer requisição, então nenhuma chamada escapa para a rede real.

## Contratos REST

Todos ficam sob `VITE_API_URL` (padrão `/api`), em JSON, validados nas duas pontas pelos schemas de `src/shared/contracts`. Erros seguem um único envelope `{ error: { code, message, fields? } }`, convertido em `ApiError` com `status`, `code`, `fields` e `isTransient`.

| Recurso | Endpoints |
| --- | --- |
| Catálogo | `GET /nfts` (busca, filtros, ordenação, paginação, facetas) · `GET /nfts/:id` · `GET /nfts/:id/reviews` · `GET /nfts/:id/related` |
| Home | `GET /home` · `POST /newsletter` |
| Sessão | `GET /session` (200 com `null` para visitante) · `POST /session` (login) · `DELETE /session` · `POST /accounts` (cadastro) |
| Carrinho | `GET /cart` · `POST /cart/items` · `PATCH/DELETE /cart/items/:id` · `PUT/DELETE /cart/coupon` · `POST /cart/acknowledge-prices` |
| Checkout | `POST /checkout/quote` · `POST /orders` (`Idempotency-Key` obrigatório) · `GET /orders/:id` |
| Carteiras | `GET /wallets` · `PUT /wallets/:slot` (`primary`/`secondary`) · `GET/POST/DELETE /wallet-sessions/current` |
| Perfil | `GET/PATCH /profile` · `PUT /profile/password` · `PUT/DELETE /profile/avatar` |
| Favoritos | `GET /favorites` · `PUT/DELETE /favorites/:nftId` |

Códigos de erro representados:

| Código | Situação |
| --- | --- |
| `VALIDATION_ERROR` (422) | dados inválidos, com `fields` por campo |
| `UNAUTHENTICATED` / `SESSION_EXPIRED` (401) | sem sessão ou sessão expirada |
| `FORBIDDEN` (403) | recurso de outra conta |
| `NOT_FOUND` (404) | recurso inexistente |
| `CONFLICT` / `AVAILABILITY_CONFLICT` / `QUOTE_OUTDATED` / `IDEMPOTENCY_CONFLICT` (409) | conflitos de cadastro, disponibilidade, cotação ou chave de idempotência |
| `COUPON_INVALID` / `COUPON_EXPIRED` | cupom inexistente ou vencido |
| `WALLET_REJECTED` | carteira recusou a conexão ou não está conectada |
| `RATE_LIMITED` (429), `SERVICE_UNAVAILABLE` / `INTERNAL_ERROR` (5xx), `NETWORK_ERROR`, `TIMEOUT` | falhas transitórias (as duas últimas geradas no cliente pelo Axios) |

Recursos mutáveis (NFT, carrinho, pedido) carregam `version`, usada para descartar respostas e eventos antigos.

## Eventos em tempo real

O cliente usa Socket.IO em `VITE_SOCKET_URL`, interceptado por `@mswjs/socket.io-binding` (`src/mocks/realtime/hub.ts`). Todo evento usa o mesmo envelope:

```ts
{ eventId, type, resource: { type, id }, version, occurredAt, data }
```

| Evento | Quando | Efeito no cliente |
| --- | --- | --- |
| `nft.updated` | preço ou estoque de uma edição muda (pedido liquidado, cenários de checkout, `window.__mocks.realtime`) | patch nas listas, no detalhe, no spotlight da home, nos favoritos e no carrinho |
| `order.updated` | o pedido muda de status (liquidação cerca de 4 s após a criação) | atualiza o pedido; se o usuário está no checkout, navega para a confirmação |

- **Duplicados e eventos antigos**: o `RealtimeEventGuard` descarta `eventId` repetido e qualquer evento com `version` menor ou igual à última vista daquele recurso.
- **Isolamento por usuário**: `order.updated` só é enviado à conexão do dono do pedido. O socket é recriado quando o usuário muda, e os listeners são removidos ao desmontar ou trocar de sessão.

**Reconciliação REST × socket**: o REST é a fonte da verdade. Eventos apenas aplicam patches no cache quando a versão é maior que a do dado em cache. Ao reconectar após uma queda, o cliente invalida catálogo, home, carrinho e pedidos e refaz o fetch, cobrindo os eventos perdidos durante a desconexão. Um indicador mostra `conectando`/`reconectando`, e toasts avisam a perda e a retomada. No checkout, um `nft.updated` de um item do pedido ou uma reconexão marca a cotação como desatualizada e bloqueia a confirmação até a atualização.

## Sessão

- O mock emite o cookie `kurio_session` (SameSite=Lax, TTL de 30 min); o cliente nunca vê o token. As senhas ficam com hash nas fixtures e no banco simulado.
- `GET /session` é a fonte do usuário atual (`staleTime` 30 s, revalidado no foco). O visitante recebe `200 null`, sem erro no console.
- Qualquer `401` fora do fluxo de login dispara o handler de sessão expirada:
  - limpa os dados privados;
  - abre o modal de login com `redirect` para a página atual;
  - mostra um aviso.

  No checkout, o carrinho continua no servidor, e após o login o usuário volta ao pagamento.
- O guard de `_auth` usa `fetchQuery` com `staleTime: 0`, então uma sessão expirada nunca é aceita a partir de cache.
- Dados privados ficam sob a chave `['me', userId, …]`. Ao trocar de usuário ou sair, tudo em `['me']` e `['guest']` é removido, o que evita vazamento entre contas.

## Carrinho

- O visitante tem carrinho próprio, identificado pelo cookie `kurio_cart` (30 dias). No login ou cadastro, o servidor mescla esse carrinho ao do usuário, somando quantidades até o limite da edição, e limpa o cookie.
- Mutações são otimistas, com rollback. Uma resposta só substitui o cache se a `version` dela for maior ou igual à atual, para que respostas fora de ordem não sobrescrevam um estado mais novo.
- Uma mudança de preço depois que o item entrou no carrinho é sinalizada por item e exige confirmação (`acknowledge-prices`) antes do checkout. Cupons válidos: `KURIO10`, `GENESIS`; `BEMVINDO` está expirado.
- O NFT pode ir para o carrinho pelo botão "Comprar", que leva ao carrinho, ou pelo botão de carrinho, que adiciona sem sair da página:
  - no desktop, o botão de carrinho fica entre "Comprar" e "Favoritar";
  - no mobile, ele fica na barra fixa de compra.

## Checkout

- **Cotação**: é criada ao abrir o pagamento e descartada ao sair (`gcTime: 0`). Assim, voltar ao checkout depois de alterar o carrinho sempre cota todos os itens atuais. Enquanto a página está aberta, uma mudança de versão do carrinho também invalida a cotação.
- **Fluxo `usePlaceOrder`**:
  1. salva a carteira, se ela foi editada;
  2. conecta o provedor;
  3. revalida a cotação pelo `fingerprint`;
  4. envia `POST /orders` com `Idempotency-Key`.
- **Timeout**: a mesma chave é reenviada, e o servidor devolve o pedido já criado em vez de duplicar.
- **Mudanças na confirmação**: preço alterado, item novo ou esgotamento interrompe o fluxo e abre a revisão "Valores atualizados", que exige nova confirmação.
- **Falhas recuperáveis**: a recusa da carteira e a do pagamento mostram um erro que permite tentar de novo sem perder o formulário.
- **Pedido**: guarda um snapshot dos itens, do cupom e do resumo. O recibo não muda com alterações posteriores do catálogo. Depois da confirmação, só os itens e quantidades comprados saem do carrinho.

## Cache, retries e sincronização

| Dado | `staleTime` | Observação |
| --- | --- | --- |
| padrão | 30 s | `refetchOnWindowFocus`, `gcTime` 5 min |
| home, detalhe de NFT | 5 min | patches em tempo real mantêm preço e estoque atuais |
| carrinho | 10 s | guard de versão |
| favoritos, perfil, carteiras, reviews | 60 s | |
| cotação do checkout | ∞ enquanto a página está aberta | `gcTime: 0`, sem retry; revalidada ao confirmar e quando o carrinho muda |
| pedido | — | polling a cada 1,5 s enquanto pendente, além de `order.updated` |

- As queries repetem até 2 vezes, e só em erros transitórios (rede, timeout, 5xx, 429), com backoff exponencial de 500 ms até 4 s. Mutações não repetem automaticamente; no pedido, a idempotência faz esse papel.
- O timeout do Axios é de 10 s. As requisições recebem o `AbortSignal` do Query, então respostas obsoletas são canceladas. Listas usam `placeholderData: keepPreviousData` para paginar e filtrar sem piscar.
- Favoritos e carrinho usam atualização otimista, rollback e toast no erro, e invalidam o cache no fim.

## Mocks e cenários

O banco simulado fica em `localStorage` (`nft-mock-db:v13`) e persiste entre recargas. Os cenários mudam latência e falhas:

```
?mock-scenario=<id>         aplica e grava o cenário (o parâmetro sai da URL)
window.__mocks.setScenario(id)
window.__mocks.reset()      restaura o banco, volta ao cenário default e limpa os cookies
window.__mocks.expireSession()
window.__mocks.realtime     updateEdition, replayLast, emitStale, disconnectAll, setAvailable
```

Cenários disponíveis:
- `default`, `slow`, `variable-latency`, `empty`;
- `server-error`, `offline`, `timeout`;
- `wallet-rejected`, `payment-refused`, `order-timeout`;
- `checkout-price-change`, `checkout-sold-out`;
- `favorites-error`.

O README tem a tabela completa e o passo a passo de cada fluxo de falha.

Credenciais de teste: `colecionador@kurio.test` e `criadora@kurio.test`, senha `Kurio@2026`.

### Limitações do transporte simulado

- Os cookies são definidos via `document.cookie`, porque o MSW não emite `HttpOnly`. A política de sessão é reproduzida, mas não a proteção real contra XSS.
- O socket é simulado no mesmo contexto da aba. Não há broadcast entre abas, e o "servidor" para quando a aba fecha.
- O binding não envia ping, então o hub envia um a cada 20 s para o cliente não cair.
- `ws.link` precisa usar só a origem do socket, porque o MSW remove `/socket.io/` da URL.
- O `socket.io-client` é importado depois que o MSW inicia, porque o engine.io captura `WebSocket` ao ser avaliado.
- Na primeira visita há o custo de registrar o service worker e carregar o bundle de mocks, o que impacta o Lighthouse (ver abaixo).
- Cada navegador tem seu próprio banco; não há dados compartilhados entre visitantes.

## Decisões de UX e desvios do Figma

- **Login e cadastro**: são modais no desktop e folha de tela cheia no mobile, controlados por `?auth=login|register` na URL, sem rotas próprias. Isso preserva a página de fundo e permite links diretos.
- **Checkout desktop**: a seleção de carteira e rede segue o padrão "wallet connect" do mobile, por pedido.
- **Checkout mobile**:
  - não tem footer, e só o botão de confirmar fica fixo;
  - os campos da carteira abrem numa folha vertical, por "Trocar carteira" ou pelo menu ⋮;
  - ganhou a seção "Seus NFTs", com imagem, edição, quantidade e valor de cada item, que o frame não mostrava.
- **Carrinho mobile**:
  - resumo, cupom e total viram uma barra fixa inferior;
  - foi adicionado o botão de excluir, ausente no print mobile;
  - os alinhamentos foram corrigidos.
- **Perfil e carteiras**:
  - não tinham layout mobile e foram feitos em uma coluna, com navegação por abas;
  - não exibem o footer, por pedido.
- **Footer mobile**: os destaques (W, C, D) ficam centralizados abaixo de 640 px; no desktop seguem alinhados à esquerda.
- **Detalhe em tablet**: a linha de compra quebra para não gerar overflow horizontal em 768 px.
- **Ícones**: os SVGs do Figma viraram componentes; os ícones ainda não enviados usam lucide como substitutos temporários.
- **Assets**: as artes vieram em baixa resolução e foram trocadas pelas exportações @2x, convertidas para WebP (`pnpm assets:artwork`). Os avatares de criadores são SVGs gerados (`pnpm assets:avatars`).
- **Fonte**: Roboto Mono variável, auto-hospedada via `@fontsource-variable`.
- **Acessibilidade**:
  - link "Pular para o conteúdo" e foco visível em `#D28A4C`;
  - labels em todos os campos, com erros ligados por `aria-describedby`;
  - `aria-live` em toasts, atualizações em tempo real e estados de carregamento;
  - radios e checkboxes customizados com roles nativos;
  - estrutura `dl` válida no resumo;
  - skeletons com shimmer que respeitam `prefers-reduced-motion`;
  - contraste checado com axe;
  - o campo de e-mail do footer fica sem outline de foco, por pedido de design; o foco continua indicado pelo botão adjacente e pelo cursor.

## Testes E2E

Os testes rodam no Playwright contra o build de produção (`vite preview` na porta 4300), com dois projetos:
- `desktop` (1440×900);
- `mobile` (390×844), que roda os testes marcados com `@responsive`.

São 43 testes. Com os responsivos executados nos dois projetos, a suíte roda 63 casos e cobre:
- catálogo, detalhe, estados de carregamento e erro;
- auth, carrinho (incluindo o merge do visitante), checkout feliz e compra com vários NFTs após revisitar o checkout;
- falhas de checkout: carteira recusada, pagamento recusado, clique repetido, timeout com idempotência, preço alterado e esgotado;
- favoritos com rollback, conta e realtime (patch, duplicado, versão antiga, reconexão com pedido pendente);
- acessibilidade com axe e regressão visual. As baselines ficam em `e2e/__screenshots__` e foram geradas em macOS (sufixo `-darwin`); em Linux/CI é preciso gerar as `-linux` com `pnpm test:e2e:update`.

Cada teste roda num contexto isolado. Os cenários sensíveis a tempo são determinísticos:
- **Relógio**: `page.clock.setFixedTime` congela o `Date.now()` sem parar os timers, e o pedido só liquida quando o teste avança o relógio.
- **Latência**: vem dos cenários do MSW.
- **Eventos**: são disparados por `window.__mocks.realtime`, sempre passando pelo `socket.io-client`.
- **Estados transitórios**: o skeleton e o favorito otimista são capturados dentro da página com `MutationObserver`, em vez de depender do polling do Playwright.

```bash
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:e2e:update   # regenera baselines visuais
pnpm test:e2e:report   # relatório HTML com traces das falhas
```

## Lighthouse

`pnpm lighthouse` gera o build, sobe o `vite preview` na porta 4400 e audita a home (`/`) e o detalhe (`/nfts/nft-001`) em mobile e desktop. São 3 execuções por página e perfil, com um Chrome novo em cada uma. Resultados:
- `lighthouse/summary.md` e `summary.json`: medianas, LCP/CLS/TBT/FCP, versões, máquina, throttling e a execução escolhida como mediana;
- `lighthouse/reports/<página>-<perfil>.report.{html,json}`: relatórios da execução mediana, versionados;
- `lighthouse/reports/runs/`: todas as execuções, fora do git.

Metas: Performance 90, Accessibility 95, Best Practices 95, SEO 90.

Resultado atual (mediana): Accessibility, Best Practices e SEO em 100 em todos os casos. Performance desktop: 97 na home e 95 no detalhe. Performance mobile: 60 na home e 49 no detalhe, com CLS ≤ 0,016.

**Justificativa para a performance mobile abaixo da meta.** No perfil mobile, o Lighthouse simula CPU 4x mais lenta e rede Slow 4G. O que pesa é o runtime de mocks exigido pelo desafio, não a aplicação:
- antes da primeira requisição é preciso registrar o service worker do MSW e avaliar o bundle de mocks (cerca de 356 KB não comprimidos, com fixtures e zod), o que concentra TBT e atrasa o LCP;
- o LCP é a arte do NFT, que vem da "API" e só começa a carregar depois que o mock responde.

Com uma API real, esse custo sai do caminho crítico. Builds com `VITE_ENABLE_MOCKS=false` não carregam o MSW, e a imagem poderia ser pré-carregada ou renderizada no servidor.

Otimizações já aplicadas:
- o app renderiza sem esperar o MSW;
- code splitting por rota, com o modal de auth e o socket.io-client carregados sob demanda;
- imagens WebP com dimensões explícitas e `fetchpriority` na arte principal;
- fonte auto-hospedada;
- `min-height` no `main` para eliminar o CLS do footer;
- sessão de visitante sem 401 no console;
- `robots.txt` e source maps.

Otimizações recusadas, por servirem só para inflar a pontuação:
- preload fixo de imagens que dependem de dados;
- remoção do MSW apenas para a auditoria.

A variação entre execuções em mobile (36–62) vem da máquina local (Apple M1, 8 GB). Por isso o relatório usa a mediana e registra o ambiente.

## Deploy

O `vercel.json` configura:
- instalação com o lockfile congelado, `pnpm build` e saída em `dist`;
- rewrite de todas as rotas para `index.html`, para que acesso direto e refresh em rotas profundas funcionem (arquivos estáticos são servidos antes do rewrite);
- `mockServiceWorker.js` sem cache, para o MSW atualizar a cada deploy;
- cache imutável para `/assets/`.

`packageManager` e `engines` no `package.json` fixam pnpm 9 e Node 20.19+. O MSW e o hub de tempo real rodam também no build publicado (`VITE_ENABLE_MOCKS=true` por padrão).

## Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | base REST |
| `VITE_SOCKET_URL` | `wss://realtime.nft-marketplace.local` | origem do Socket.IO (interceptada pelo MSW) |
| `VITE_ENABLE_MOCKS` | `true` | inicia o MSW; `false` aponta para uma API real |
