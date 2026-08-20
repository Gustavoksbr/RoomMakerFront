import { APIRequestContext, Browser, Page, expect, test } from '@playwright/test';

import {
    Sala, Usuario, abrirComoUsuario, apagarSala, apiContext,
    criarSalaXadrez, criarUsuario, entrarNaSala, irParaSala,
} from './fixtures/roommaker';
import { ListaDeLances, Tabuleiro } from './fixtures/tabuleiro';

/**
 * O xadrez visual atravessando tudo: dois navegadores de verdade, WebSocket de
 * verdade, MongoDB de testes de verdade.
 *
 * Estes cenários existem para cobrir exatamente o que as duas suítes unitárias
 * não alcançam:
 *
 *  1. O CONTRATO das mensagens. O navegador manda {from, to, promocao} e o
 *     servidor desserializa em XadrezLanceRequest. Um nome de campo trocado
 *     passaria pelos 324 testes unitários e quebraria o jogo — é o buraco mais
 *     perigoso, porque as três mensagens do modo visual são novas.
 *  2. O PRÉ-LANCE, que por definição envolve dois jogadores: um enfileira, o
 *     outro joga, e o lance do primeiro sai sozinho. Nenhum teste de um lado só
 *     consegue observar isso.
 *  3. O SIGILO da fila: o adversário não pode receber o pré-lance nem no DOM nem
 *     no tráfego.
 */

test.describe('Xadrez visual', () => {

    let api: APIRequestContext;
    let brancas: Usuario;
    let pretas: Usuario;
    let sala: Sala;

    let paginaBrancas: Page;
    let paginaPretas: Page;

    test.beforeAll(async () => {
        api = await apiContext();
    });

    test.afterAll(async () => {
        await api.dispose();
    });

    test.beforeEach(async ({ browser }) => {
        brancas = await criarUsuario(api, 'brancas');
        pretas = await criarUsuario(api, 'pretas');
        sala = await criarSalaXadrez(api, brancas);
        await entrarNaSala(api, sala, pretas);

        paginaBrancas = await abrirComoUsuario(browser, brancas);
        paginaPretas = await abrirComoUsuario(browser, pretas);
    });

    test.afterEach(async () => {
        await apagarSala(api, sala, brancas);
        await paginaBrancas.context().close();
        await paginaPretas.context().close();
    });

    /**
     * O dono configura o modo visual e inicia. Deixa as duas telas dentro da
     * partida, com as brancas para jogar.
     */
    async function iniciarPartidaVisual(): Promise<void> {
        await irParaSala(paginaBrancas, sala);
        await irParaSala(paginaPretas, sala);

        // Só o dono vê a configuração.
        const configuracao = paginaBrancas.locator('.xadrez-config');
        await expect(configuracao).toBeVisible();

        // Clica no CARTÃO, não no rádio: o input é `display:none` no CSS e quem o
        // usuário atinge é o label inteiro.
        const cartaoVisual = paginaBrancas.locator('.modo-opcao', { hasText: 'Visual' });
        await cartaoVisual.click();
        await expect(cartaoVisual).toHaveClass(/ativa/);

        // O dono joga de brancas; o convidado, de pretas.
        await configuracao.locator('select').first().selectOption(brancas.username);
        await configuracao.locator('select').nth(1).selectOption(pretas.username);

        await paginaBrancas.locator('.btn-iniciar').click();

        await new Tabuleiro(paginaBrancas, 'brancas').esperarVisivel();
        await new Tabuleiro(paginaPretas, 'pretas').esperarVisivel();
    }

    // =========================================================================

    test('a partida começa em modo visual e o tabuleiro aparece para os dois', async () => {
        await iniciarPartidaVisual();

        const tabBrancas = new Tabuleiro(paginaBrancas, 'brancas');
        const tabPretas = new Tabuleiro(paginaPretas, 'pretas');

        // Posição inicial completa nas duas telas.
        await expect(paginaBrancas.locator('app-tabuleiro-xadrez .peca')).toHaveCount(32);
        await expect(paginaPretas.locator('app-tabuleiro-xadrez .peca')).toHaveCount(32);

        await expect(tabBrancas.peca('e1')).toHaveAttribute('data-peca', 'wk');
        await expect(tabPretas.peca('e8')).toHaveAttribute('data-peca', 'bk');

        // Sem campo de digitar lance: no modo visual só existe o tabuleiro.
        await expect(paginaBrancas.locator('.xadrez-input')).toHaveCount(0);
        await expect(paginaBrancas.locator('.badge-modo')).toContainText('Visual');
    });

    test('lance arrastando e lance clicando chegam aos dois navegadores', async () => {
        // É este teste que prova o contrato {from, to, promocao} entre o
        // WebSocket do navegador e o XadrezLanceRequest do servidor.
        await iniciarPartidaVisual();

        const tabBrancas = new Tabuleiro(paginaBrancas, 'brancas');
        const tabPretas = new Tabuleiro(paginaPretas, 'pretas');
        const lancesBrancas = new ListaDeLances(paginaBrancas);
        const lancesPretas = new ListaDeLances(paginaPretas);

        await tabBrancas.arrastar('e2', 'e4');

        await lancesBrancas.esperarLances(['e4']);
        await lancesPretas.esperarLances(['e4']);
        await expect(tabPretas.peca('e4')).toHaveAttribute('data-peca', 'wp');
        await expect(tabPretas.peca('e2')).toHaveCount(0);

        // As pretas respondem clicando na peça e depois na casa.
        await tabPretas.clicarClicar('e7', 'e5');

        await lancesBrancas.esperarLances(['e4', 'e5']);
        await lancesPretas.esperarLances(['e4', 'e5']);
        await expect(tabBrancas.peca('e5')).toHaveAttribute('data-peca', 'bp');

        // A casa de origem e a de destino ficam destacadas nas duas telas.
        await expect(tabBrancas.casa('e7')).toHaveClass(/ultimo-lance/);
        await expect(tabBrancas.casa('e5')).toHaveClass(/ultimo-lance/);
    });

    test('o pré-lance dispara sozinho quando o adversário joga', async () => {
        await iniciarPartidaVisual();

        const tabBrancas = new Tabuleiro(paginaBrancas, 'brancas');
        const tabPretas = new Tabuleiro(paginaPretas, 'pretas');
        const lancesPretas = new ListaDeLances(paginaPretas);

        // É a vez das brancas: as pretas só conseguem PRÉ-lançar. Duas de uma
        // vez, à moda do chess.com.
        await tabPretas.arrastar('e7', 'e5');
        await expect(tabPretas.avisoDeFila).toContainText('1 pré-lance');

        await tabPretas.arrastar('b8', 'c6');
        await expect(tabPretas.avisoDeFila).toContainText('2 pré-lances');
        await expect(tabPretas.setasDePreLance).toHaveCount(2);

        // Nada disso virou lance ainda.
        expect(await lancesPretas.lances()).toEqual([]);

        // As brancas jogam: o primeiro pré-lance sai junto, na mesma resposta.
        await tabBrancas.arrastar('d2', 'd4');
        await lancesPretas.esperarLances(['d4', 'e5']);
        await expect(tabPretas.avisoDeFila).toContainText('1 pré-lance');

        // O segundo espera o próximo lance do adversário — pinga um por vez.
        await tabBrancas.arrastar('g1', 'f3');
        await lancesPretas.esperarLances(['d4', 'e5', 'Nf3', 'Nc6']);
        await expect(tabPretas.avisoDeFila).toHaveCount(0);
    });

    test('pré-lance que virou impossível é descartado com aviso, sem punir o jogador', async () => {
        await iniciarPartidaVisual();

        const tabBrancas = new Tabuleiro(paginaBrancas, 'brancas');
        const tabPretas = new Tabuleiro(paginaPretas, 'pretas');
        const lancesPretas = new ListaDeLances(paginaPretas);

        // Dama de d8 para h4: geometricamente possível, mas o peão de e7 tranca a
        // diagonal — e continuará trancando depois do lance das brancas.
        await tabPretas.arrastar('d8', 'h4');
        await expect(tabPretas.avisoDeFila).toContainText('1 pré-lance');

        await tabBrancas.arrastar('a2', 'a3');

        await lancesPretas.esperarLances(['a3']);
        await expect(paginaPretas.locator('.xadrez-aviso')).toContainText('fila foi cancelada');
        await expect(tabPretas.avisoDeFila).toHaveCount(0);

        // Não é lance ilegal: o contador nem aparece.
        await expect(paginaPretas.locator('.xadrez-ilegais')).toHaveCount(0);
    });

    test('o adversário não recebe a fila de pré-lances, nem no DOM nem no tráfego', async () => {
        await iniciarPartidaVisual();

        // Guarda tudo o que chega ao navegador das brancas pelo WebSocket.
        const recebidoPelasBrancas: string[] = [];
        paginaBrancas.on('websocket', ws => {
            ws.on('framereceived', quadro => {
                if (typeof quadro.payload === 'string') recebidoPelasBrancas.push(quadro.payload);
            });
        });

        const tabBrancas = new Tabuleiro(paginaBrancas, 'brancas');
        const tabPretas = new Tabuleiro(paginaPretas, 'pretas');

        await tabPretas.arrastar('g8', 'f6');
        await expect(tabPretas.avisoDeFila).toContainText('1 pré-lance');
        // As pretas veem a própria fila destacada.
        await expect(tabPretas.casasDePreLance).toHaveCount(2);

        // Um lance das brancas força o servidor a responder para os dois.
        await tabBrancas.arrastar('e2', 'e4');
        await new ListaDeLances(paginaBrancas).esperarLances(['e4', 'Nf6']);

        // Na tela das brancas, nada de fila em momento algum.
        await expect(tabBrancas.casasDePreLance).toHaveCount(0);
        await expect(tabBrancas.avisoDeFila).toHaveCount(0);

        // E o pré-lance também não passou pelo fio: se `meusPreLances` das
        // brancas viesse preenchido, o vazamento seria invisível na tela e real
        // para quem abrisse o DevTools.
        const comFilaPreenchida = recebidoPelasBrancas.filter(quadro =>
            /"meusPreLances"\s*:\s*\[\s*\{/.test(quadro));
        expect(comFilaPreenchida, 'as brancas receberam uma fila de pré-lances não vazia').toEqual([]);
    });
});
