# Lua de Sangue

Jogo de Lobisomem (dedução social) para jogar presencialmente com um único celular, offline.

```sh
npm install
npm run dev     # desenvolvimento
npm test        # regras do jogo
npm run build   # checa tipos e gera o PWA em dist/
```

## Estrutura

- `src/engine/`: regras puras, sem React. `roles.ts` (catálogo de papéis), `setup.ts` (montagem da partida), `game.ts` (fases, ações noturnas, votação, vitória).
- `src/app/`: casca do app. Estado, salvamento local (`storage.ts`) e efeitos de cada fase (narração, transições).
- `src/ui/kit/`: componentes genéricos (botões, telas, folhas, ícones).
- `src/ui/players/`, `roles/`, `setup/`, `game/`, `help/`: telas e peças por funcionalidade.

Para criar um papel: adicione-o em `engine/roles.ts` (textos e traços), diga em `nightAction` (`engine/game.ts`) o que ele pode fazer à noite e implemente o efeito em `resolveNight`. Desenhe o ícone em `ui/roles/RoleIcon.tsx`.
