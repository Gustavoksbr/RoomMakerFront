import { describe, expect, it } from 'vitest';

import { FilaPreLances, MAX_PRE_LANCES, projetarPreLance } from './pre-lance';
import { ocupacaoDeFen } from './tabuleiro';

const INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
/** Depois de 1.e4 — vez das pretas. */
const APOS_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

describe('projeção de um pré-lance', () => {
    it('move a peça de uma casa para outra', () => {
        const depois = projetarPreLance(ocupacaoDeFen(INICIAL), { from: 'e2', to: 'e4' });

        expect(depois.has('e2')).toBe(false);
        expect(depois.get('e4')).toEqual({ tipo: 'p', cor: 'w' });
    });

    it('captura o que estava no destino', () => {
        const ocupacao = ocupacaoDeFen('4k3/8/8/8/4r3/8/8/4K2R w - - 0 1');
        const depois = projetarPreLance(ocupacao, { from: 'h1', to: 'e1' });

        expect(depois.get('e1')).toEqual({ tipo: 'r', cor: 'w' });
    });

    it('arrasta a torre junto no roque curto', () => {
        const ocupacao = ocupacaoDeFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
        const depois = projetarPreLance(ocupacao, { from: 'e1', to: 'g1' });

        expect(depois.get('g1')).toEqual({ tipo: 'k', cor: 'w' });
        expect(depois.get('f1')).toEqual({ tipo: 'r', cor: 'w' });
        expect(depois.has('h1')).toBe(false);
    });

    it('arrasta a torre junto no roque longo', () => {
        const ocupacao = ocupacaoDeFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
        const depois = projetarPreLance(ocupacao, { from: 'e1', to: 'c1' });

        expect(depois.get('c1')).toEqual({ tipo: 'k', cor: 'w' });
        expect(depois.get('d1')).toEqual({ tipo: 'r', cor: 'w' });
        expect(depois.has('a1')).toBe(false);
    });

    it('tira o peão certo no en passant — o de ao lado, não o de baixo', () => {
        // Peão branco em e5, preto em d5 recém-chegado. exd6 tira o peão de d5.
        const ocupacao = ocupacaoDeFen('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
        const depois = projetarPreLance(ocupacao, { from: 'e5', to: 'd6' });

        expect(depois.get('d6')).toEqual({ tipo: 'p', cor: 'w' });
        expect(depois.has('d5')).toBe(false);
        expect(depois.has('e5')).toBe(false);
    });

    it('promove na peça escolhida', () => {
        const ocupacao = ocupacaoDeFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
        const depois = projetarPreLance(ocupacao, { from: 'a7', to: 'a8', promocao: 'n' });

        expect(depois.get('a8')).toEqual({ tipo: 'n', cor: 'w' });
    });

    it('promove a dama quando a peça não foi escolhida', () => {
        const ocupacao = ocupacaoDeFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
        const depois = projetarPreLance(ocupacao, { from: 'a7', to: 'a8' });

        expect(depois.get('a8')).toEqual({ tipo: 'q', cor: 'w' });
    });

    it('não altera a ocupação original', () => {
        const antes = ocupacaoDeFen(INICIAL);
        projetarPreLance(antes, { from: 'e2', to: 'e4' });

        expect(antes.get('e2')).toEqual({ tipo: 'p', cor: 'w' });
    });

    it('ignora um pré-lance que sai de casa vazia', () => {
        const depois = projetarPreLance(ocupacaoDeFen(INICIAL), { from: 'e4', to: 'e5' });
        expect(depois.size).toBe(32);
    });
});

describe('fila de pré-lances', () => {
    it('começa vazia e projetando a posição real', () => {
        const fila = FilaPreLances.daPosicao(APOS_E4, 'b');

        expect(fila.vazia).toBe(true);
        expect(fila.ocupacaoProjetada.get('e7')).toEqual({ tipo: 'p', cor: 'b' });
    });

    it('só deixa mover peça da própria cor', () => {
        const fila = FilaPreLances.daPosicao(APOS_E4, 'b');

        expect(fila.podePreLancarDe('e7')).toBe(true);
        expect(fila.podePreLancarDe('e4')).toBe(false); // peão branco
        expect(fila.destinosDe('e4')).toEqual([]);
    });

    it('enfileira e projeta o resultado', () => {
        const fila = FilaPreLances.daPosicao(APOS_E4, 'b').enfileirar({ from: 'e7', to: 'e5' });

        expect(fila.itens).toEqual([{ from: 'e7', to: 'e5' }]);
        expect(fila.ocupacaoProjetada.has('e7')).toBe(false);
        expect(fila.ocupacaoProjetada.get('e5')).toEqual({ tipo: 'p', cor: 'b' });
    });

    it('o segundo pré-lance parte da posição PROJETADA, não da real', () => {
        // É o ponto inteiro de aceitar vários pré-lances: depois de enfileirar
        // Cc6, o cavalo tem de sair de c6 — e não mais de b8.
        const fila = FilaPreLances.daPosicao(APOS_E4, 'b')
            .enfileirar({ from: 'b8', to: 'c6' });

        expect(fila.podePreLancarDe('c6')).toBe(true);
        expect(fila.podePreLancarDe('b8')).toBe(false);
        expect(fila.destinosDe('c6')).toContain('d4');
    });

    it('encadeia vários pré-lances da mesma peça', () => {
        const fila = FilaPreLances.daPosicao(APOS_E4, 'b')
            .enfileirar({ from: 'b8', to: 'c6' })
            .enfileirar({ from: 'c6', to: 'd4' })
            .enfileirar({ from: 'd4', to: 'f3' });

        expect(fila.itens).toHaveLength(3);
        expect(fila.ocupacaoProjetada.get('f3')).toEqual({ tipo: 'n', cor: 'b' });
    });

    it('aceita destino ocupado por peça própria — ela pode sair antes', () => {
        const fila = FilaPreLances.daPosicao(APOS_E4, 'b');
        expect(fila.destinosDe('d8')).toContain('d7');
    });

    it('recusa um pré-lance que a peça não alcança', () => {
        const fila = FilaPreLances.daPosicao(APOS_E4, 'b');
        const depois = fila.enfileirar({ from: 'e7', to: 'e4' }); // peão não anda 3

        expect(depois.itens).toHaveLength(0);
        expect(depois).toBe(fila);
    });

    it('recusa acima do limite', () => {
        let fila = FilaPreLances.daPosicao(APOS_E4, 'b');
        // Vai e volta com o cavalo para encher a fila sem sair do tabuleiro.
        const idaEVolta = [
            { from: 'b8', to: 'c6' }, { from: 'c6', to: 'b8' },
        ] as const;
        for (let i = 0; i < MAX_PRE_LANCES + 3; i++) {
            fila = fila.enfileirar(idaEVolta[i % 2]);
        }

        expect(fila.itens).toHaveLength(MAX_PRE_LANCES);
        expect(fila.cheia).toBe(true);
    });

    it('desfaz o último e reprojeta corretamente', () => {
        const fila = FilaPreLances.daPosicao(APOS_E4, 'b')
            .enfileirar({ from: 'b8', to: 'c6' })
            .enfileirar({ from: 'c6', to: 'd4' })
            .desfazerUltimo();

        expect(fila.itens).toEqual([{ from: 'b8', to: 'c6' }]);
        expect(fila.ocupacaoProjetada.get('c6')).toEqual({ tipo: 'n', cor: 'b' });
        expect(fila.ocupacaoProjetada.has('d4')).toBe(false);
    });

    it('desfazer numa fila vazia não quebra', () => {
        const fila = FilaPreLances.daPosicao(APOS_E4, 'b');
        expect(fila.desfazerUltimo()).toBe(fila);
    });

    it('limpar volta à posição real', () => {
        const fila = FilaPreLances.daPosicao(APOS_E4, 'b')
            .enfileirar({ from: 'b8', to: 'c6' })
            .limpar();

        expect(fila.vazia).toBe(true);
        expect(fila.ocupacaoProjetada.get('b8')).toEqual({ tipo: 'n', cor: 'b' });
    });

    describe('promoção', () => {
        const FEN = '4k3/P7/8/8/8/8/7p/4K3 w - - 0 1';

        it('reconhece que o pré-lance promove', () => {
            const brancas = FilaPreLances.daPosicao(FEN, 'w');
            expect(brancas.ehPromocao('a7', 'a8')).toBe(true);
            expect(brancas.ehPromocao('e1', 'e2')).toBe(false);
        });

        it('reconhece a promoção das pretas na primeira fileira', () => {
            const pretas = FilaPreLances.daPosicao(FEN, 'b');
            expect(pretas.ehPromocao('h2', 'h1')).toBe(true);
        });
    });

    describe('rebasear quando o tabuleiro anda', () => {
        it('mantém o pré-lance que continua fazendo sentido', () => {
            const fila = FilaPreLances.daPosicao(APOS_E4, 'b')
                .enfileirar({ from: 'b8', to: 'c6' });

            // As brancas jogaram Cf3; o cavalo preto continua em b8.
            const APOS_NF3 = 'rnbqkbnr/pppppppp/8/8/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
            const rebaseada = fila.rebasear(APOS_NF3);

            expect(rebaseada.itens).toEqual([{ from: 'b8', to: 'c6' }]);
        });

        it('derruba o pré-lance cuja peça não está mais lá', () => {
            const fila = FilaPreLances.daPosicao(APOS_E4, 'b')
                .enfileirar({ from: 'e7', to: 'e5' });

            // Numa posição em que não há peça preta em e7, o pré-lance não entra.
            const rebaseada = fila.rebasear('4k3/8/8/8/8/8/8/4K3 w - - 0 1');

            expect(rebaseada.vazia).toBe(true);
        });
    });

    describe('restaurar a fila que veio do servidor', () => {
        it('reconstrói a projeção inteira', () => {
            const fila = FilaPreLances.restaurar(APOS_E4, 'b', [
                { from: 'b8', to: 'c6' },
                { from: 'c6', to: 'd4' },
            ]);

            expect(fila.itens).toHaveLength(2);
            expect(fila.ocupacaoProjetada.get('d4')).toEqual({ tipo: 'n', cor: 'b' });
        });

        it('descarta silenciosamente item impossível vindo do servidor', () => {
            const fila = FilaPreLances.restaurar(APOS_E4, 'b', [
                { from: 'b8', to: 'c6' },
                { from: 'h8', to: 'a1' }, // torre não vai de h8 a a1 num lance
            ]);

            expect(fila.itens).toHaveLength(1);
        });
    });
});
