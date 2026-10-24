# Kurio · NFT Marketplace

Marketplace de NFTs em React + TypeScript com APIs, sessão, carteiras, pagamentos e tempo real simulados via MSW.

## Stack

React 19 · TypeScript · Vite · TanStack Router · TanStack Query · Axios · Zod · Tailwind CSS v4 · shadcn/ui · MSW 2 · Socket.IO (via `@mswjs/socket.io-binding`) · Playwright · Lighthouse

## Setup

Requer Node 20.19+ e pnpm 9.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Base das chamadas REST (interceptadas pelo MSW) |
| `VITE_SOCKET_URL` | `wss://realtime.nft-marketplace.local` | Endpoint Socket.IO (interceptado pelo MSW) |
| `VITE_ENABLE_MOCKS` | `true` | Ativa o service worker do MSW, inclusive no build de demonstração |

## Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Desenvolvimento com mocks em `http://localhost:5173` |
| `pnpm build` | Gera as rotas, verifica tipos e cria o build de produção em `dist/` |
| `pnpm preview` | Serve o build de produção |
| `pnpm typecheck` | Verificação de tipos |
| `pnpm lint` | ESLint |
| `pnpm test:e2e` | Testes Playwright (desktop 1440 e mobile 390) contra o build de produção |
| `pnpm test:e2e:update` | Regenera as baselines de regressão visual |
| `pnpm test:e2e:report` | Abre o relatório HTML (com traces das falhas) |
| `pnpm lighthouse` | Auditoria de início e detalhe, mobile e desktop, 3 execuções cada |

Na primeira execução dos testes, instale o navegador com `pnpm exec playwright install chromium`.

## Credenciais fictícias

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Colecionador Kurio | `colecionador@kurio.test` | `Kurio@2026` |
| Criadora Kurio | `criadora@kurio.test` | `Kurio@2026` |

Cupons: `KURIO10` e `GENESIS` são válidos; `BEMVINDO` está expirado.

## Cenários de mock

O estado simulado (catálogo, carrinho, favoritos, perfil, carteiras e pedidos) fica no `localStorage` e sobrevive ao refresh.

**Selecionar um cenário**: abra qualquer URL com `?mock-scenario=<id>`, por exemplo `/?mock-scenario=slow`. O cenário fica salvo e o parâmetro sai da URL. Pelo console também é possível usar `window.__mocks.setScenario('<id>')`.

**Resetar**: no console, `window.__mocks.reset()` restaura o banco simulado, volta ao cenário `default` e limpa sessão e carrinho de visitante. Recarregue a página em seguida.

| Cenário | Efeito |
| --- | --- |
| `default` | Dados completos, latência de 120–350 ms |
| `slow` | Todas as respostas levam cerca de 2,5 s |
| `variable-latency` | Latência entre 100 ms e 2 s (respostas fora de ordem) |
| `empty` | Catálogo sem resultados |
| `server-error` | Catálogo e cotação respondem HTTP 5xx |
| `offline` | Falha de conexão em todas as requisições |
| `timeout` | Requisições nunca respondem (timeout do cliente) |
| `wallet-rejected` | A carteira recusa a conexão no checkout |
| `payment-refused` | O pedido é criado e o pagamento é recusado |
| `order-timeout` | O pedido é criado, mas a resposta excede o timeout (recuperação por idempotência) |
| `checkout-price-change` | O preço do primeiro item sobe 10% ao confirmar a compra |
| `checkout-sold-out` | A edição do primeiro item esgota ao confirmar a compra |
| `favorites-error` | Favoritar e desfavoritar respondem HTTP 503 (rollback otimista) |

Outros controles no console:

```js
window.__mocks.expireSession()                                   // expira a sessão atual
window.__mocks.realtime.updateEdition('nft-001', 'nft-001-1-50', { price: '1.5', available: 3 }) // emite nft.updated
window.__mocks.realtime.replayLast()                             // reenvia o último evento (duplicata)
window.__mocks.realtime.emitStale('nft-001')                     // envia um evento com versão antiga
window.__mocks.realtime.setAvailable(false)                      // derruba o socket; true reconecta
```

## Reproduzindo os fluxos de falha

Entre com um dos usuários acima e adicione um NFT ao carrinho antes dos fluxos de checkout.

| Fluxo | Como reproduzir |
| --- | --- |
| Carregamento lento e skeletons | `/?mock-scenario=slow` |
| Erro e nova tentativa | `/?mock-scenario=server-error`, depois `__mocks.setScenario('default')` e "Tentar novamente" |
| Sem conexão | `/?mock-scenario=offline` |
| Respostas fora de ordem | `/?mock-scenario=variable-latency` e altere filtros rapidamente |
| Catálogo vazio | `/?mock-scenario=empty` |
| Cadastro com conflito | Cadastre-se com `colecionador@kurio.test` |
| Sessão expirada | Em `/profile` ou `/checkout`, rode `__mocks.expireSession()` e navegue |
| Cupom inválido ou expirado | Aplique `ERRADO` ou `BEMVINDO` no carrinho |
| Carteira recusada | `/checkout?mock-scenario=wallet-rejected` e confirme a compra |
| Pagamento recusado | `/checkout?mock-scenario=payment-refused` e confirme a compra |
| Timeout com idempotência | `/checkout?mock-scenario=order-timeout` e confirme a compra |
| Preço alterado na compra | `/checkout?mock-scenario=checkout-price-change` e confirme a compra |
| Edição esgotada na compra | `/checkout?mock-scenario=checkout-sold-out` e confirme a compra |
| Preço alterado em tempo real | Com o NFT no carrinho, rode `__mocks.realtime.updateEdition(...)` |
| Queda do socket com pedido pendente | Confirme uma compra e rode `__mocks.realtime.setAvailable(false)`; depois `setAvailable(true)` ou recarregue |
| Rollback de favorito | `/?mock-scenario=favorites-error` e clique no coração de um NFT |

## Deploy

O projeto inclui `vercel.json` (build `pnpm build`, saída `dist`, rewrite de todas as rotas para `index.html`). Na Vercel, importe o repositório e defina as variáveis de ambiente da tabela acima. O MSW roda também no build publicado.

## Documentação

Contratos REST e eventos, política de sessão, estado do carrinho, cache, reconciliação REST × Socket.IO, limitações, decisões de UX e desvios do Figma estão em [`ARCHITECTURE.md`](ARCHITECTURE.md). O resultado da auditoria está em [`lighthouse/summary.md`](lighthouse/summary.md).
