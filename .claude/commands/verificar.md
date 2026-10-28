---
description: Corre typecheck, lint y tests web y resume los fallos
allowed-tools: Bash(pnpm typecheck), Bash(pnpm lint), Bash(pnpm --filter @sgia/web test)
---

Ejecuta, en este orden y sin detenerte si uno falla:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm --filter @sgia/web test`

Compara con la línea base en `FIXES/baseline-*.txt` (typecheck: 0 errores; tests: 155 pasan; lint: 21 errores conocidos).

Resume en español: por cada comando, OK o fallo; si falla, los errores agrupados por archivo con `archivo:línea`. Marca como **nuevo** todo error de lint que no esté en `FIXES/baseline-lint.txt`. No corrijas nada.
