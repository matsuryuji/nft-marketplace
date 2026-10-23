# Kurio · NFT Marketplace

Marketplace de NFTs em React + TypeScript com APIs, sessão, carteiras, pagamentos e tempo real simulados via MSW.

## Stack

React 19 · TypeScript · Vite · TanStack Router · TanStack Query · Axios · Zod · Tailwind CSS v4 · shadcn/ui · MSW 2 · Socket.IO (via `@mswjs/socket.io-binding`) · Playwright · Lighthouse

## Setup

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
