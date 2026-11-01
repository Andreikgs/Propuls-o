# Propulsão

Jogo de stock car top-down inspirado em corridas ovais, com identidade própria.

## Jogar offline
Abra `Propulsao-Offline.html` em um navegador. Não precisa instalar dependências nem conectar à internet.

- ↑ / W: acelerar; ↓ / S: frear.
- ← → / A D: esterçar as rodas. Todas as curvas são feitas pelo jogador.
- R: retornar ao último setor válido, com uma espera de 3 segundos.
- P: pausar. Controles de toque aparecem em telas menores.
- Daytona, Talladega e Bristol: traçados adaptados dos circuitos reais, em sentido anti-horário.
- 3 dificuldades, 14 adversários IA, garagem e recorde local.
- Mapas, referências e limites da adaptação em [CIRCUITOS.md](CIRCUITOS.md).

## Pilotagem e câmera
Mapa de 4800 × 2880 unidades, quatro vezes maior em cada dimensão. Carro fixo no centro da câmera; minimapa mostra o circuito completo. A física inclui esterçamento progressivo, inércia lateral, limite de aderência em curvas, freios, grama com menor tração e colisão com o muro externo. As voltas exigem 16 setores em ordem. Os recordes desta física usam armazenamento separado da versão assistida.

## Colisões contra a IA
Os 15 carros usam posição e velocidade físicas. Contato por carroceria orientada transfere impulso aos dois carros, com atrito e rotação em impactos fora do centro. A IA volta a pilotar após o empurrão; engavetamentos afetam os demais adversários. O muro considera o tamanho do carro. Carros em recuperação ficam temporariamente fora das colisões.

Esta física entre carros está disponível no single player. O modo online mantém a sincronização anterior sem colisões entre jogadores.

## Som
Gravações reais de motor (domasx2, CC0) e pneus (Mike Koenig / SoundBible, CC BY 3.0), incorporadas em PCM16 para funcionar offline. Motor acompanha aceleração e marchas virtuais. Frenagem e derrapagem usam mixagens da gravação dos pneus. Créditos e alterações em public/audio/CREDITS.md e na tela “Créditos de áudio”.

Botão de som durante a corrida e volume na garagem. Preferências salvas neste navegador. Pausa, chegada, saída e aba em segundo plano silenciam o áudio.

## Modo online
Aplicação Sites/Vinext com autenticação ChatGPT e banco D1. Login, criação de campeonatos por código, até 15 participantes, largada sincronizada, 3/5/8 etapas e classificação acumulada. Posições são enviadas a cada 350 ms e consultadas a cada 700 ms. Os carros online não possuem colisão física entre si nesta versão.

O servidor verifica autenticação, participação, permissões do organizador, número da etapa, limites de estado e tempo mínimo. A simulação de pilotagem ainda é executada no cliente; esta versão é para partidas casuais e não oferece proteção antitrapaça competitiva.

As etapas alternam Daytona → Talladega → Bristol, repetindo o ciclo em campeonatos maiores.

Um campeonato precisa de 2 jogadores para começar. Cada etapa dura no máximo 30 minutos. Pontos: 25, 18, 15, 12, 10, 8, 6, 4. Abandonos não pontuam. A ordem de chegada usa o horário do servidor e pode ser afetada pela latência.

## Desenvolvimento
Node >=22.13, npm ci, npm run dev. Configuração de hospedagem em `.openai/hosting.json`; banco DB; migrações em `drizzle/`. O modo online depende da publicação e do acesso compartilhado do site. O site nasce privado, restrito ao proprietário.

## Validação
Verificação TypeScript e testes de lógica de corrida e rotas com SQLite em memória. O navegador e o build local foram bloqueados pelo ambiente Windows (spawn EPERM); a corrida foi inspecionada por renderização do Canvas, mas não em uma sessão interativa do navegador.

Execute npm test para verificar direção manual, aderência, muro, câmera centralizada, checkpoints, três voltas de teste (uma em cada circuito), recuperação, pausa e rotas do campeonato.

Os testes de colisão verificam transferência de impulso, conservação de momento, energia, contatos laterais, engavetamentos, muro, recuperação e voltas da IA física.

Cada corrida tem 10 voltas. No single player são 15 carros (jogador + 14 IAs); o online aceita até 15 participantes humanos. Recordes antigos de 3 voltas não são comparados aos novos tempos.
