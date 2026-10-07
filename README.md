# Mesa Cheia

## Visão Geral do Projeto
O **Mesa Cheia** é uma aplicação web voltada para auxiliar jogadores de jogos de tabuleiro, cartas e outros jogos de mesa presenciais. Ele atua como um companheiro digital (companion app) para registrar pontuações, gerenciar jogadores e equipes, além de fornecer ferramentas úteis, como lançamento de moedas virtuais. 

O problema central que o projeto resolve é a necessidade de usar papel e caneta para manter o controle de partidas longas ou complexas, centralizando essa gestão no dispositivo de um ou mais jogadores de forma persistente e com uma interface moderna e amigável. Por possuir uma arquitetura extensível baseada em um registro de jogos (game registry), a plataforma facilita a adição de novas modalidades (por exemplo, Uno, Dominó, jogos de RPG) mantendo o estado isolado e regras específicas de pontuação para cada um.

## Tecnologias e Arquitetura
O projeto foi construído utilizando as seguintes tecnologias:

- **Front-end:** React 19, TypeScript
- **Estilização & UI:** TailwindCSS v4, Radix UI Primitives, Lucide React (ícones), Framer Motion (animações)
- **Gerenciamento de Estado:** Zustand (com suporte a persistência local via `persist`)
- **Gráficos/3D:** Three.js, React Three Fiber, React Three Drei (utilizados para as ferramentas visuais em 3D, como a moeda virtual)
- **Validação & Tipagem:** Zod (para validação de schemas de dados no front-end)
- **Build & Ferramentas:** Vite, pnpm (gerenciador de pacotes), oxlint (linter)

## Regras de Negócio e Entidades Principais

O domínio do aplicativo é focado no acompanhamento de **Sessões** de diferentes tipos de jogos. 

- **Session (Sessão):** É a entidade central da aplicação, representando uma partida de um jogo específico. Ela possui um `gameId` (que a vincula a um jogo registrado no sistema), um status (`active` ou `finished`), timestamps de criação/finalização e agrega listas de jogadores e times.
- **Player (Jogador) e Team (Time):** Jogadores são as entidades base. Um time é um agregador de identificadores de jogadores (`playerIds`). Alguns jogos suportam times (como duplas em Dominó), outros apenas jogadores individuais.
- **Game Registry (Registro de Jogos):** O coração da arquitetura extensível. Arquivos definem um `GameDefinition`, que inclui restrições (ex: mínimo e máximo de jogadores), schema do estado do jogo (via Zod), lógica para criar o estado inicial e o próprio componente de tela (`ScreenComponent`). 
- **Ferramentas (Tools):** Entidades independentes que servem como utilitários de mesa. Por exemplo, a moeda virtual (`Coin`), gerenciada pelo `coinStore`, que possui predefinições (presets) de faces ou aceita imagens customizadas, com persistência para manter as preferências do usuário.

### Fluxos Principais
1. **Ciclo de vida da Sessão:** A sessão nasce `active`, persistida no `sessionStore.ts`. Ao terminar a partida, ela pode ser marcada como `finished`, congelando o estado (mas mantendo o histórico de pontuações). Sessões finalizadas podem ser reabertas (`reopenSession`) ou deletadas.
2. **Registro de Jogos:** Para adicionar um jogo novo, é criado um módulo na pasta `src/games/` que exporta a chamada para `registerGame()`. Isso anexa o jogo à plataforma sem acoplamento direto nas telas principais de listagem, tornando a UI baseada puramente na lista gerada por `listGames()`.

## Como Rodar o Projeto

Para rodar o projeto localmente, certifique-se de ter o Node.js e o gerenciador de pacotes `pnpm` instalados na sua máquina.

1. **Clone o repositório e entre na pasta:**
```bash
git clone <url-do-repo>
cd mesa-cheia
```

2. **Instale as dependências:**
```bash
pnpm install
```

3. **Inicie o servidor de desenvolvimento:**
```bash
pnpm dev
```
O Vite iniciará o servidor, geralmente acessível em `http://localhost:5173`.

4. **Para rodar o build e a pré-visualização (opcional):**
```bash
pnpm build
pnpm preview
```

## Guia para Agentes de IA
Caso outro assistente ou agente de IA precise trabalhar neste projeto, aqui vão algumas dicas essenciais de arquitetura:

- **Single Source of Truth (Modelos e Schemas):** Todos os schemas base de Zod (que definem as tipagens e validações centrais) estão na pasta `src/schemas/`. Use-os sempre como ponto de partida (ex: `src/schemas/session.ts`).
- **Gerenciamento de Estado (Stores):** A lógica de negócio global fica em `src/stores/`. O projeto utiliza Zustand extensivamente. O gerenciamento de sessões (`sessionStore.ts`) e configurações da ferramenta de moedas (`coinStore.ts`) e temas (`themeStore.ts`) concentram as mutações. Sempre procure os stores para entender como os dados estão sendo manipulados.
- **Adição de Novos Jogos:** Ao criar um novo tipo de jogo, estude e siga a interface `GameDefinition` presente em `src/lib/game-registry.ts`. A pasta `src/games/` é o local correto para implementações específicas.
- **Estilização e Componentes:** O sistema de design é fundamentado no Radix UI com Tailwind CSS. Os componentes reaproveitáveis se encontram em `src/components/`. Evite criar CSS do zero se já houver um componente estilizado e acessível (ex: botão, modal/diálogo, dropdown).
