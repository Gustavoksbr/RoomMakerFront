import { Locator, Page, expect } from '@playwright/test';

/**
 * O tabuleiro visto de fora, pelo navegador.
 *
 * Tudo aqui passa por eventos de ponteiro reais sobre coordenadas reais — é o
 * único lugar do projeto onde o cálculo de "que casa está sob este pixel" é
 * exercitado contra o layout de verdade. Os testes unitários do componente usam
 * um retângulo fingido; se o CSS quebrasse o alinhamento da grade, só aqui
 * apareceria.
 */
export class Tabuleiro {

    constructor(private readonly page: Page, private readonly nome: string) { }

    private get raiz(): Locator {
        return this.page.locator('app-tabuleiro-xadrez .grade');
    }

    /** A CASA. Precisa do `.casa` porque a peça daquela casa carrega o mesmo
     *  data-casa — sem a classe, o seletor pega os dois. */
    casa(nomeDaCasa: string): Locator {
        return this.raiz.locator(`.casa[data-casa="${nomeDaCasa}"]`);
    }

    /** A peça que está nesta casa (ex.: 'wp' = peão branco). */
    peca(nomeDaCasa: string): Locator {
        return this.raiz.locator(`.peca[data-casa="${nomeDaCasa}"]`);
    }

    async esperarVisivel(): Promise<void> {
        await expect(this.raiz).toBeVisible();
    }

    /**
     * Traz o tabuleiro para dentro da viewport.
     *
     * `page.mouse` trabalha em coordenadas de viewport e NÃO rola a página — ao
     * contrário de `locator.click()`, que rola sozinho. Sem isto, um tabuleiro
     * abaixo da dobra faz o ponteiro ir parar fora da tela e o arrasto vira um
     * evento em lugar nenhum, sem erro: o teste só falha depois, na asserção, sem
     * dizer o porquê.
     */
    private async trazerParaTela(): Promise<void> {
        await this.raiz.scrollIntoViewIfNeeded();
    }

    /** Centro da casa, em coordenadas de viewport. */
    private async centroDe(nomeDaCasa: string): Promise<{ x: number; y: number }> {
        const caixa = await this.casa(nomeDaCasa).boundingBox();
        if (!caixa) throw new Error(`[${this.nome}] casa ${nomeDaCasa} não está na tela`);

        const ponto = { x: caixa.x + caixa.width / 2, y: caixa.y + caixa.height / 2 };
        const viewport = this.page.viewportSize();
        if (viewport && (ponto.y < 0 || ponto.y > viewport.height || ponto.x < 0 || ponto.x > viewport.width)) {
            throw new Error(
                `[${this.nome}] a casa ${nomeDaCasa} está fora da viewport (${ponto.x}, ${ponto.y}); ` +
                'o ponteiro cairia fora da tela');
        }
        return ponto;
    }

    /** Lance arrastando a peça, com passos intermediários como um humano faria. */
    async arrastar(de: string, para: string): Promise<void> {
        await this.trazerParaTela();
        const origem = await this.centroDe(de);
        const destino = await this.centroDe(para);

        await this.page.mouse.move(origem.x, origem.y);
        await this.page.mouse.down();
        // Passos intermediários: um `move` único não dispara o pointermove que o
        // componente usa para acompanhar a peça sob o cursor.
        await this.page.mouse.move(
            (origem.x + destino.x) / 2, (origem.y + destino.y) / 2, { steps: 5 });
        await this.page.mouse.move(destino.x, destino.y, { steps: 5 });
        await this.page.mouse.up();
    }

    /** Lance clicando na peça e depois na casa de destino. */
    async clicarClicar(de: string, para: string): Promise<void> {
        await this.trazerParaTela();
        await this.casa(de).click();
        await expect(this.casa(de)).toHaveClass(/selecionada/);
        await this.casa(para).click();
    }

    /** Marca vermelha / seta: botão direito. */
    async clicarDireito(nomeDaCasa: string): Promise<void> {
        await this.casa(nomeDaCasa).click({ button: 'right' });
    }

    async escolherPromocao(peca: 'q' | 'r' | 'b' | 'n'): Promise<void> {
        const indice = { q: 0, r: 1, b: 2, n: 3 }[peca];
        await this.raiz.locator('.opcao-promocao').nth(indice).click();
    }

    /** Casas destacadas como pré-lance enfileirado. */
    get casasDePreLance(): Locator {
        return this.raiz.locator('.casa.pre-lance');
    }

    /**
     * Setas na tela — só as manuais (botão direito). Pré-lance não desenha
     * seta nenhuma; vira só o destaque azul em {@link casasDePreLance}.
     */
    get setasNaTela(): Locator {
        return this.raiz.locator('.setas line');
    }

    get avisoDeFila(): Locator {
        return this.page.locator('app-tabuleiro-xadrez .aviso-pre-lance');
    }
}

/** A lista de lances ao lado do tabuleiro. */
export class ListaDeLances {

    constructor(private readonly page: Page) { }

    get botoes(): Locator {
        return this.page.locator('app-navegador-lances .lance-botao');
    }

    /** Os lances em ordem, como o jogador os lê. */
    async lances(): Promise<string[]> {
        return this.botoes.allInnerTexts();
    }

    async esperarLances(esperados: string[]): Promise<void> {
        // toHaveText com array re-tenta até a lista bater: é o que substitui um
        // sleep esperando o WebSocket chegar.
        await expect(this.botoes).toHaveText(esperados);
    }
}
