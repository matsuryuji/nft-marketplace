# Auditoria Lighthouse

Gerado por `pnpm lighthouse` em 2026-10-24T13:08:38.332Z. Mediana de 3 execuções por página e perfil.

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| inicio | mobile | **60** ⚠️ | 100 | 100 | 100 | 4.41 s | 0.016 | 785 ms | 2.85 s |
| inicio | desktop | 97 | 100 | 100 | 100 | 1.16 s | 0.009 | 59 ms | 0.75 s |
| detalhe | mobile | **49** ⚠️ | 100 | 100 | 100 | 4.58 s | 0.000 | 2024 ms | 2.74 s |
| detalhe | desktop | 95 | 100 | 100 | 100 | 1.18 s | 0.000 | 40 ms | 0.77 s |

## Ambiente

- **date**: 2026-10-24T13:08:38.332Z
- **lighthouse**: 13.5.0
- **chromeLauncher**: 1.2.2
- **chrome**: Chrome/156.0.8078.4
- **node**: v22.13.1
- **os**: Darwin 24.5.0 (arm64)
- **cpu**: Apple M1
- **memoryGb**: 8
- **build**: vite build + vite preview, VITE_ENABLE_MOCKS=true, cenário default do MSW
- **runsPerPageAndProfile**: 3
- **throttling**: {"mobile":"padrão do Lighthouse (Moto G Power simulado, 4x CPU, Slow 4G simulado)","desktop":"preset desktop do Lighthouse (40ms RTT, 10 Mbps, sem lentidão de CPU)"}

Relatórios HTML/JSON da execução mediana de cada página e perfil em `lighthouse/reports/` (todas as execuções em `lighthouse/reports/runs/`, fora do git). Categorias abaixo da meta (⚠️) estão justificadas em `ARCHITECTURE.md`, seção Lighthouse.
