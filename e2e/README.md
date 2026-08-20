# Testes E2E do xadrez visual

Dois navegadores de verdade, WebSocket de verdade, MongoDB de testes de verdade.

## Por que existem

As duas suítes unitárias somam 324 testes e nenhuma delas consegue ver o que
estes quatro cenários veem:

1. **O contrato das mensagens.** O navegador manda `{from, to, promocao}` e o
   servidor desserializa em `XadrezLanceRequest`. Um nome de campo trocado
   passaria por todos os 324 testes e quebraria o jogo. As três mensagens do
   modo visual (`lance` com coordenadas, `pre-lances`, `cancelar-pre-lances`)
   são novas — é o ponto mais frágil do sistema hoje.
2. **O pré-lance**, que por definição envolve dois jogadores: um enfileira, o
   outro joga, e o lance do primeiro sai sozinho. Nenhum teste de um lado só
   observa isso.
3. **O sigilo da fila**: o adversário não pode recebê-la nem no DOM nem no
   tráfego. O teste inspeciona os quadros do WebSocket, não só a tela.
4. **A geometria real do tabuleiro.** Os testes unitários do componente usam um
   retângulo fingido; só aqui o cálculo de "que casa está sob este pixel" é
   exercitado contra o CSS de verdade.

São quatro cenários de propósito. E2E é lento e propenso a intermitência: o
valor está concentrado, não espalhado.

## Como rodar

Precisa de **dois terminais**.

Terminal 1 — o backend, apontado para o banco de testes:

```bash
npm run e2e:backend
```

O script lê `ROOMMAKER_MONGODB_URI_TESTES` do `.env` do RoomMakerBack e
sobrescreve `ROOMMAKER_MONGODB_URI` com ela. Se a variável faltar, ou se o banco
não tiver `test` no nome, ele **aborta** — o e2e cria e apaga salas e usuários,
e fazer isso em produção não pode ser uma possibilidade silenciosa.

Terminal 2 — os testes (o Playwright sobe o `ng serve` sozinho):

```bash
npm run e2e
```

Para acompanhar passo a passo, com viagem no tempo:

```bash
npm run e2e:ui
```

### Por que o backend não sobe junto

O Spring Boot leva ~40s. Pagar isso a cada execução tornaria o ciclo
insuportável, e um backend que não sobe apareceria como um timeout de navegador
sem explicação, em vez do erro do Spring na tela.

## O que os testes criam

Cada cenário cadastra dois usuários descartáveis e uma sala, todos com sufixo
único, e apaga a sala no fim. Os **usuários ficam** no banco de testes: não há
endpoint de exclusão de usuário, e inventar um só para o teste seria abrir uma
porta perigosa em produção. Limpe a coleção de vez em quando se incomodar.

## Decisões que valem saber

- **Preparação por API, verificação pela tela.** Cadastro, criação de sala e
  entrada acontecem via HTTP; a sessão é semeada no `localStorage` com
  `addInitScript`. A interface só é exercitada onde ela é o assunto: o
  tabuleiro. Fazer login pela tela custaria ~15s por cenário e traria junto todo
  o risco de flake dos formulários, que não têm nada a ver com xadrez.
- **Nenhum `waitForTimeout`.** Só asserções com auto-retry
  (`expect(locator).toHaveText(...)`). WebSocket é assíncrono; sleep fixo é a
  receita garantida de teste que passa aqui e falha na máquina do professor.
- **Um trabalhador só.** Os cenários usam salas distintas, mas paralelizar
  trocaria velocidade por intermitência — o oposto do que se quer de um teste
  que existe para dar confiança.
- **`data-casa` no HTML do tabuleiro.** A grade é uma sequência de 64 divs; sem
  uma âncora estável, um teste teria de contar posições e recontar toda vez que
  o tabuleiro virasse.
