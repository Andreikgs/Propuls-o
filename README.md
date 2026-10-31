# Propulsão Nascar

Código do jogo publicado como **Oval Rush**.

Jogo de stock car top-down inspirado em corridas ovais, com identidade própria.

## Jogar offline
Abra `Oval-Rush-Offline.html` em um navegador. Não precisa instalar dependências nem conectar à internet.

- ↑ / W: acelerar; ↓ / S: frear.
- ← → / A D: esterçar as rodas. Todas as curvas são feitas pelo jogador.
- R: retornar ao último setor válido, com uma espera de 3 segundos.
- P: pausar. Controles de toque aparecem em telas menores.
- 3 circuitos, 3 dificuldades, 7 adversários IA, garagem e recorde local.

## Pilotagem e câmera
Mapa de 4800 × 2880 unidades, quatro vezes maior em cada dimensão. Carro fixo no centro da câmera; minimapa mostra o circuito completo. A física inclui esterçamento progressivo, inércia lateral, limite de aderência em curvas, freios, grama com menor tração e colisão com o muro externo. As voltas exigem 16 setores em ordem. Os recordes desta física usam armazenamento separado da versão assistida.

## Modo online
Aplicação Sites/Vinext com autenticação ChatGPT e banco D1. Login, criação de campeonatos por código, até 8 participantes, largada sincronizada, 3/5/8 etapas e classificação acumulada. Posições são enviadas a cada 350 ms e consultadas a cada 700 ms. Os carros online não possuem colisão física entre si nesta versão.

O servidor verifica autenticação, participação, permissões do organizador, número da etapa, limites de estado e tempo mínimo. A simulação de pilotagem ainda é executada no cliente; esta versão é para partidas casuais e não oferece proteção antitrapaça competitiva.

Um campeonato precisa de 2 jogadores para começar. Cada etapa dura no máximo 10 minutos. Pontos: 25, 18, 15, 12, 10, 8, 6, 4. Abandonos não pontuam. A ordem de chegada usa o horário do servidor e pode ser afetada pela latência.

## Desenvolvimento
Node >=22.13, npm ci, npm run dev. Configuração de hospedagem em `.openai/hosting.json`; banco DB; migrações em `drizzle/`. O modo online depende da publicação e do acesso compartilhado do site. O site nasce privado, restrito ao proprietário.

## Validação
Verificação TypeScript e testes de lógica de corrida e rotas com SQLite em memória. O navegador e o build local foram bloqueados pelo ambiente Windows (spawn EPERM); a corrida foi inspecionada por renderização do Canvas, mas não em uma sessão interativa do navegador.

Execute npm test para verificar direção manual, aderência, muro, câmera centralizada, checkpoints, três voltas de teste (uma em cada circuito), recuperação, pausa e rotas do campeonato.
