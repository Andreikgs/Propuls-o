# Propulsão

Jogo de stock car top-down inspirado em corridas ovais, com identidade própria.

## Jogar offline
Abra `Propulsao-Offline.html` em um navegador. Não precisa instalar dependências nem conectar à internet.

- ↑ / W: acelerar; ↓ / S: frear.
- ← → / A D: esterçar as rodas. Todas as curvas são feitas pelo jogador.
- R: retornar ao último setor válido, com uma espera de 3 segundos.
- P: pausar. Controles de toque aparecem em telas menores.
- Daytona, Talladega e Bristol: traçados adaptados dos circuitos reais, em sentido anti-horário.
- 3 dificuldades, 14 adversários IA, seleção de pilotos e recorde local.
- Drupa: retrato e carro verde/preto nº 17 fornecidos pelo usuário. O carro escolhido é usado na corrida; não há edição de pintura na garagem.
- Bozo: retrato laranja/preto e carro nº 07. A escolha fica salva no navegador; no campeonato, o carro acompanha o piloto registrado naquela sala.
- Lorena: retrato branco/preto e carro nº 08, disponíveis na mesma seleção offline e online.
- Os carros dos pilotos selecionáveis têm escala de corrida 50% maior, com carroceria de colisão e inércia ajustadas à nova dimensão.
- Mapas, referências e limites da adaptação em [CIRCUITOS.md](CIRCUITOS.md).

## Pilotagem e câmera
Mapa de 10800 × 6480 unidades, com os traçados 50% mais longos que a versão de 7200 × 4320 e carros na mesma escala. O cenário estático usa resolução limitada para evitar aumentar a memória na proporção da área do mapa. Carro fixo no centro da câmera; minimapa mostra o circuito completo. A física inclui esterçamento progressivo, inércia lateral, limite de aderência em curvas, freios, grama com menor tração e colisão com o muro externo. As voltas exigem 16 setores em ordem. Os recordes desta física usam armazenamento separado da versão assistida.

## Colisões contra a IA
Os 15 carros usam posição e velocidade físicas. Contato por carroceria orientada transfere impulso aos dois carros, com atrito e rotação em impactos fora do centro. A IA volta a pilotar após o empurrão; engavetamentos afetam os demais adversários. O muro considera o tamanho do carro. Carros em recuperação ficam temporariamente fora das colisões.

Esta física entre carros está disponível no single player. O modo online mantém a sincronização anterior sem colisões entre jogadores.

## Som
Gravações reais de motor (domasx2, CC0) e pneus (Mike Koenig / SoundBible, CC BY 3.0), incorporadas em PCM16 para funcionar offline. Motor acompanha aceleração e marchas virtuais. Frenagem e derrapagem usam mixagens da gravação dos pneus. Créditos e alterações em public/audio/CREDITS.md e na tela “Créditos de áudio”.

Botão de som durante a corrida e volume na tela de pilotos. Preferências salvas neste navegador. Pausa, chegada, saída e aba em segundo plano silenciam o áudio.

## Modo online
Aplicação Sites/Vinext com autenticação ChatGPT e banco D1. Login, criação de campeonatos por código, até 15 participantes, largada sincronizada, 3/5/8 etapas e classificação acumulada. Posições são enviadas a cada 350 ms e consultadas a cada 700 ms. Os carros online não possuem colisão física entre si nesta versão.

O servidor verifica autenticação, participação, permissões do organizador, número da etapa, limites de estado e tempo mínimo. A simulação de pilotagem ainda é executada no cliente; esta versão é para partidas casuais e não oferece proteção antitrapaça competitiva.

As etapas alternam Daytona → Talladega → Bristol, repetindo o ciclo em campeonatos maiores.

No primeiro login, defina o nome da conta (2 a 24 caracteres). Ele fica salvo no servidor e identifica o jogador no placar, independentemente do personagem escolhido. Contas anteriores também completam esse cadastro no próximo acesso. Antes de correr, confirme o piloto e seu carro fixo. O modo offline continua sem exigir conta.

Um campeonato precisa de 2 jogadores para começar. Cada etapa dura no máximo 30 minutos. Pontos: 25, 18, 15, 12, 10, 8, 6, 4. Abandonos não pontuam. A ordem de chegada usa o horário do servidor e pode ser afetada pela latência.

## Desenvolvimento
Node >=22.13, npm ci, npm run dev. Configuração de hospedagem em `.openai/hosting.json`; banco DB; migrações em `drizzle/`. O modo online depende da publicação e do acesso compartilhado do site. O site nasce privado, restrito ao proprietário.

## Validação
Verificação TypeScript e testes de lógica de corrida e rotas com SQLite em memória. A seleção de Drupa, o início da corrida e o layout móvel foram validados no Edge local. O build de produção é validado na publicação pelo Sites.

Execute npm test para verificar direção manual, aderência, muro, câmera centralizada, checkpoints, três voltas de teste (uma em cada circuito), recuperação, pausa e rotas do campeonato.

Os testes de colisão verificam transferência de impulso, conservação de momento, energia, contatos laterais, engavetamentos, muro, recuperação e voltas da IA física.

Cada corrida tem 10 voltas. No single player são 15 carros (jogador + 14 IAs); o online aceita até 15 participantes humanos. Recordes antigos de 3 voltas não são comparados aos novos tempos.

## Barreiras, recuperação e posição
As barreiras interna e externa consideram o tamanho da carroceria. Após uma colisão, ficar preso por 5 segundos provoca retorno ao último setor validado, com a mesma proteção de recuperação de 3 segundos. Deslocar-se mais de 18 unidades cancela a detecção. Pausas não contam.

A classificação usa distância assinada dentro do setor, sem retroceder ao tocar o acostamento, com tolerância de 2 unidades para evitar oscilações lado a lado e ordem de chegada preservada.

## Pneus e pit stop
Desgaste por distância (9% por volta de base), com acréscimo por derrapagem e frenagem. Pneus gastos reduzem aderência e velocidade máxima; aviso a 35%. A IA solicita boxes abaixo de 35%.

B ou botão Boxes solicita/cancela a parada. O pit lane é uma via separada no interior do circuito, com acesso PIT IN antes da chegada e retorno PIT OUT depois dos boxes. B apenas solicita/cancela a orientação: é preciso dirigir pela entrada, parar no box por 4 segundos e percorrer a saída. Há limitador automático a aproximadamente 80 km/h. A via tem suas próprias barreiras e mantém a contagem dos checkpoints durante a passagem. Durante o atendimento, o carro fica sem colisão com a IA para evitar bloqueio dos boxes. A pausa congela o serviço; o reset cancela o atendimento e não repara pneus. Jogadores online usam o mesmo desgaste e atendimento local; a sincronização online continua sem colisões entre jogadores.

Os boxes usam uma reta de serviço dentro do circuito, com 15 garagens alinhadas, área de apoio e acessos graduais separados da faixa de corrida. A geometria acompanha a posição real da reta dianteira em cada traçado, independentemente da linha de chegada.

## Organização do jogo

O código editável está em public/game/: tracks.js (geometria), pits.js (boxes e pneus), physics.js (movimento, colisões e classificação), rendering.js (Canvas), drivers.js (pilotos e carros fixos), ui.js (perfil e campeonatos), audio.js e audio-samples.js (áudio), race.js (ciclo da corrida) e bootstrap.js (inicialização).

São scripts clássicos com escopo global compartilhado, carregados com defer na ordem declarada em public/game.html. Funções de desenho e física são declaradas antes da interface; bootstrap.js inicia a página por último. Ao mover declarações, preserve essa ordem e execute os testes, que carregam os arquivos individualmente. O Graphify pode indexar as definições JavaScript; a resolução de ligações entre scripts globais depende do indexador.

Não edite Propulsao-Offline.html nem Oval-Rush-Offline.html diretamente. Execute node scripts/build-offline.mjs para regenerá-los, ou node scripts/build-offline.mjs --check para conferir sincronização. O comando de desenvolvimento/build também gera os arquivos automaticamente. O áudio fica incorporado, permitindo jogar offline sem downloads.
