# Jogos

Cada jogo é um plugin. A sessão (quem joga, grupos, status) vive no store global; pontos, dealer e regras ficam no store do jogo. Não há backend: tudo é `localStorage` via Zustand persist.

Hoje: Canastra, Pife, Poker e Truco gaúcho. O que se repete entre eles é o padrão. O que muda é só a regra da mesa.

## Anatomia

```
src/games/<id>/
  index.ts       registro no registry
  schema.ts      Zod + funções puras de placar
  store.ts       persistência e mutações
  summary.ts     resumo para o card da Home
  GameScreen.tsx tela da partida
```

O bootstrap importa o barrel em `App.tsx`:

```ts
import '@/games'
```

`src/games/index.ts` só puxa cada pasta. Sem esse import o jogo não aparece em Novo jogo nem abre em `/jogo/:gameId/:sessionId`.

## Registry

`registerGame` em `src/lib/game-registry.ts`. Campos que todo jogo preenche:

| Campo | Papel |
| --- | --- |
| `id` | slug estável (`canastra`, `pife`, `poker`, `truco`). Entra na URL e em `Session.gameId` |
| `label` | nome na UI, em português |
| `icon` | Lucide |
| `minPlayers` / `maxPlayers` | validação no fluxo de Novo jogo |
| `supportsTeams` | se `true`, Novo jogo oferece Individual vs Grupos |
| `schema` | Zod do estado da partida |
| `createInitialState` | cria a entrada no store do jogo |
| `deleteSession` | apaga a entrada quando a sessão some na Home |
| `summarizeSession` | placar do `SessionCard` |
| `ScreenComponent` | recebe só `{ sessionId: string }` |

Jogos com times (Canastra, Truco) usam `scoringSides(session)`: se há `session.teams`, cada time é um lado; senão cada jogador vira um lado de uma pessoa. Pife e Poker são sempre individuais (`supportsTeams: false`).

## Sessão vs estado do jogo

`useSessionStore` (`pontos-sessions`) guarda o que é comum:

- `id`, `gameId`, `players`, `teams?`, `createdAt`, `finishedAt?`, `status: 'active' | 'finished'`

O store do jogo guarda só o que a regra precisa, indexado por `sessionId`:

```ts
sessions: Record<string, GameState>
```

Fluxo ao criar:

1. `useSessionStore.createSession({ gameId, players, teams })`
2. `game.createInitialState(session.id, order, sessionTeams)`
3. navega para `/jogo/${game.id}/${session.id}`

Ao apagar na Home, `sessionStore.deleteSession` chama `getGame(gameId)?.deleteSession` para não deixar lixo no store do jogo.

## Store

Convenções que os stores de jogo repetem:

- Zustand + `persist`, chave `pontos-<id>` (ex.: `pontos-canastra`)
- `version` no persist; se o schema mudar, `migrate`
- `createSession` monta o estado, valida com `Schema.parse` e devolve o objeto parseado
- `deleteSession` remove a chave do mapa
- `dealerPlayerId` começa no primeiro da ordem; `setDealer` / `nextDealer` ciclam a lista de jogadores (no Poker, só os que ainda estão na mesa)
- IDs de rodada/evento/mão: `createId()` (`crypto.randomUUID`)
- Encerrar: se alguém bateu o alvo (ou last-standing no Poker), chamar `useSessionStore.finishSession`
- Reabrir: se um undo ou mudança de alvo desfaz a vitória, chamar `reopenSession`
- Helper `patchSession` para updates parciais sem clobber

O estado da sessão (`active` / `finished`) **não** é duplicado no store do jogo. A tela lê `session.status`.

### Hidratação

Todo store persistido que a UI lê no primeiro paint entra em `src/lib/use-stores-hydrated.ts`. Sem isso a Home/partida podem renderizar vazio e depois “aparecer”. Stores só de ferramenta (ex.: histórico de dados) podem ficar de fora se um flash for aceitável.

## Schema

Zod no mesmo arquivo das funções puras (`teamTotals`, `mesasWon`, defaults). O store não calcula placar no render — a tela e o `summary` usam essas funções.

Defaults nomeados no schema (`CANASTRA_DEFAULT_TARGET`, `TRUCO_DEFAULT_TARGET`, …).

## Summary (card da Home)

`summarizeSession(session)` devolve `SessionSummary`:

- `mode`: `'individual' | 'groups'`
- `modeLabel`: `Individual`, `Duplas`, `Trios`, …
- `sides[]`: `id`, `name`, `members`, `score?`, `leader?`

Líder: maior pontuação, só se não estiver tudo empatado e o máximo for `> 0`. Empate = ninguém com `leader`. O card destaca com troféu + `bg-primary/10`.

Se o jogo não implementar summary, o card cai no fallback (lados sem score).

## Tela da partida

A rota `/jogo/:gameId/:sessionId` **não** usa `AppShell` (sem bottom nav). A tela monta o chrome sozinha.

Padrão visual (todos os jogos):

1. Shell `relative z-10 mx-auto min-h-dvh w-full max-w-lg … pb-28 … md:max-w-4xl` (espaço pro FAB de ferramentas)
2. Header: voltar para `/`, título do jogo, subtítulo (`Rodada N · Fulano dá as cartas` ou `Partida encerrada`), badge `Fim` se terminou, engrenagem da Mesa
3. Placar em **2 colunas no mobile** quando há mais de um lado (`grid-cols-2`)
4. Líder: `Trophy` + `border-primary bg-primary/10 ring-2 ring-primary/30`
5. Quem já fechou o alvo: mesmo destaque, um pouco mais forte, badge `Fechou` / `Alvo` / `Fim`
6. Ações: botão Mesa + ação principal (`Registrar rodada`, lançar mão, etc.)
7. Histórico desfazível
8. Drawer **Mesa**: dealer (select + Próximo), alvo, opções da regra
9. FAB fixo **Ferramentas** + `ToolsDrawer` com `items={playerNames}` (a roleta usa os nomes da mesa)
10. Números com `toLocaleString('pt-BR')` e `tabular-nums`
11. Cards `bg-card/90`
12. Copy em português; toasts via Sonner

Estado ausente: mensagem curta + link Voltar. Não explode.

Alvo na Mesa: input controlado com draft (`targetDraft`), commit no blur; inteiro `>= 1`.

## Novo jogo

Passos compartilhados em `NovoJogo` — o jogo só declara limites e `supportsTeams`:

1. Escolher o jogo
2. Jogadores (roster em `pontos-roster`) + modo Individual/Grupos se couber
3. Montar grupos iguais (`groupSizeOptions`: o total tem que dividir)
4. Ordem (em grupos, `alternatePlayerOrder`)
5. `createSession` + `createInitialState`

Nomes de grupo: duas duplas viram **Nós / Eles**; senão `Dupla N`, `Trio N`, `Grupo N`.

## Checklist: jogo novo

1. Pasta `src/games/<id>/` com os cinco arquivos
2. `registerGame` no `index.ts` da pasta
3. Import em `src/games/index.ts`
4. Store persist `name: 'pontos-<id>'` + entrada em `use-stores-hydrated.ts`
5. `createInitialState` / `deleteSession` / `summarizeSession` / `ScreenComponent`
6. Encerrar e reabrir a sessão pelo `sessionStore`, não por flag local
7. Tela com o chrome acima (placar, mesa, histórico, ferramentas)
8. UI em português, mobile-first, 2 colunas no placar
