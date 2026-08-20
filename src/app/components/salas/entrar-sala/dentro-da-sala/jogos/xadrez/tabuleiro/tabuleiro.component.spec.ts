import { SimpleChange, SimpleChanges } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FilaPreLances } from '../../../../../../../services/xadrez/pre-lance';
import { LanceLegal } from '../../../../../../../services/xadrez/partida';
import { Casa } from '../../../../../../../services/xadrez/tabuleiro';
import { TabuleiroComponent } from './tabuleiro.component';

/**
 * O componente do tabuleiro não injeta nada, então dá para instanciá-lo com
 * `new` e exercitar a lógica de verdade — reconciliação de peças, geometria,
 * seleção — sem TestBed, sem DOM e sem esperar renderização.
 */

const INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const APOS_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
/** 1.e4 d5 2.exd5 — o peão branco capturou em d5. */
const APOS_EXD5 = 'rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2';

const LADO = 400;

function montar(fen = INICIAL): TabuleiroComponent {
    const c = new TabuleiroComponent();
    c.fen = fen;
    aplicar(c, { fen: true, orientacao: true });
    return c;
}

function aplicar(c: TabuleiroComponent, campos: Record<string, boolean>): void {
    const changes: SimpleChanges = {};
    for (const campo of Object.keys(campos)) {
        changes[campo] = new SimpleChange(null, (c as any)[campo], false);
    }
    c.ngOnChanges(changes);
}

/** Finge uma grade de 400x400 na origem da tela. */
function comGrade(c: TabuleiroComponent): void {
    (c as any).grade = {
        nativeElement: {
            getBoundingClientRect: () => ({ left: 0, top: 0, width: LADO, height: LADO }),
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
            hasPointerCapture: () => false,
        },
    };
}

/** Centro da casa em pixels, na orientação atual. */
function centroEmPixels(c: TabuleiroComponent, casa: Casa): { clientX: number; clientY: number } {
    const p = c.posicao(casa);
    return {
        clientX: (p.esquerda / 100) * LADO + LADO / 16,
        clientY: (p.topo / 100) * LADO + LADO / 16,
    };
}

function ponteiro(pos: { clientX: number; clientY: number }, button = 0): PointerEvent {
    return { ...pos, button, pointerId: 1, preventDefault: vi.fn() } as unknown as PointerEvent;
}

describe('desenho do tabuleiro', () => {
    it('lê a posição inicial com 32 peças', () => {
        expect(montar().pecas).toHaveLength(32);
    });

    it('ordena as casas de a8 a h1 quando visto pelas brancas', () => {
        const c = montar();
        expect(c.casasNaOrdem[0]).toBe('a8');
        expect(c.casasNaOrdem[7]).toBe('h8');
        expect(c.casasNaOrdem[63]).toBe('h1');
    });

    it('inverte a ordem quando visto pelas pretas', () => {
        const c = montar();
        c.orientacao = 'b';
        aplicar(c, { orientacao: true });

        expect(c.casasNaOrdem[0]).toBe('h1');
        expect(c.casasNaOrdem[63]).toBe('a8');
    });

    it('posiciona a1 no canto de baixo pelas brancas e no de cima pelas pretas', () => {
        const c = montar();
        expect(c.posicao('a1')).toEqual({ esquerda: 0, topo: 87.5 });

        c.orientacao = 'b';
        aplicar(c, { orientacao: true });
        expect(c.posicao('a1')).toEqual({ esquerda: 87.5, topo: 0 });
    });

    it('mostra coordenada só na borda de baixo e na da esquerda', () => {
        const c = montar();

        expect(c.rotuloColuna('e1')).toBe('e');
        expect(c.rotuloColuna('e2')).toBeNull();
        expect(c.rotuloLinha('a4')).toBe('4');
        expect(c.rotuloLinha('b4')).toBeNull();
    });

    it('acompanha as bordas quando o tabuleiro vira', () => {
        const c = montar();
        c.orientacao = 'b';
        aplicar(c, { orientacao: true });

        expect(c.rotuloColuna('e8')).toBe('e');
        expect(c.rotuloColuna('e1')).toBeNull();
        expect(c.rotuloLinha('h4')).toBe('4');
    });
});

describe('identidade das peças entre posições', () => {
    // Sem preservar a identidade, o navegador recria os 32 elementos a cada
    // lance e o tabuleiro pisca em vez de mover a peça.

    it('a peça que se moveu mantém o mesmo id', () => {
        const c = montar();
        const peaoE2 = c.pecas.find(p => p.casa === 'e2')!;

        c.fen = APOS_E4;
        aplicar(c, { fen: true });

        const peaoE4 = c.pecas.find(p => p.casa === 'e4')!;
        expect(peaoE4.id).toBe(peaoE2.id);
        expect(c.pecas.find(p => p.casa === 'e2')).toBeUndefined();
    });

    it('as peças paradas não são recriadas', () => {
        const c = montar();
        const idsAntes = new Map(c.pecas.map(p => [p.casa, p.id]));

        c.fen = APOS_E4;
        aplicar(c, { fen: true });

        for (const parada of ['a1', 'e1', 'h8', 'd8'] as Casa[]) {
            expect(c.pecas.find(p => p.casa === parada)!.id).toBe(idsAntes.get(parada));
        }
    });

    it('a peça capturada desaparece e a capturadora continua sendo a mesma', () => {
        const c = montar(APOS_E4);
        c.fen = 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2';
        aplicar(c, { fen: true });
        const peaoBranco = c.pecas.find(p => p.casa === 'e4')!;

        c.fen = APOS_EXD5;
        aplicar(c, { fen: true });

        expect(c.pecas.find(p => p.casa === 'd5')!.id).toBe(peaoBranco.id);
        expect(c.pecas).toHaveLength(31);
    });

    it('sempre termina com exatamente as peças da posição nova', () => {
        const c = montar();
        c.fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
        aplicar(c, { fen: true });

        expect(c.pecas).toHaveLength(2);
        expect(c.pecas.map(p => p.casa).sort()).toEqual(['e1', 'e8']);
    });

    it('ids nunca se repetem numa mesma posição', () => {
        const c = montar();
        for (const fen of [APOS_E4, APOS_EXD5, INICIAL]) {
            c.fen = fen;
            aplicar(c, { fen: true });
            expect(new Set(c.pecas.map(p => p.id)).size).toBe(c.pecas.length);
        }
    });
});

describe('seleção e lances', () => {
    function comLancesLegais(c: TabuleiroComponent, lances: LanceLegal[]): void {
        const indice = new Map<Casa, LanceLegal[]>();
        for (const l of lances) {
            const lista = indice.get(l.from);
            if (lista) lista.push(l);
            else indice.set(l.from, [l]);
        }
        c.destinosLegais = indice;
        aplicar(c, { destinosLegais: true });
    }

    let c: TabuleiroComponent;

    beforeEach(() => {
        c = montar();
        comGrade(c);
        comLancesLegais(c, [
            { from: 'e2', to: 'e3', captura: false },
            { from: 'e2', to: 'e4', captura: false },
            { from: 'g1', to: 'f3', captura: false },
        ]);
    });

    it('seleciona ao clicar numa peça que tem lance', () => {
        c.onPointerDown(ponteiro(centroEmPixels(c, 'e2')));
        expect(c.selecionada).toBe('e2');
    });

    it('não seleciona casa sem lance disponível', () => {
        c.onPointerDown(ponteiro(centroEmPixels(c, 'e1')));
        expect(c.selecionada).toBeNull();
    });

    it('clicar de novo na mesma peça desmarca', () => {
        c.onPointerDown(ponteiro(centroEmPixels(c, 'e2')));
        c.arrastando = null; // o jogador soltou o mouse sem arrastar
        c.onPointerDown(ponteiro(centroEmPixels(c, 'e2')));

        expect(c.selecionada).toBeNull();
    });

    it('clique-clique emite o lance', () => {
        const emitidos: unknown[] = [];
        c.lance.subscribe(l => emitidos.push(l));

        c.onPointerDown(ponteiro(centroEmPixels(c, 'e2')));
        c.arrastando = null;
        c.onPointerDown(ponteiro(centroEmPixels(c, 'e4')));

        expect(emitidos).toEqual([{ from: 'e2', to: 'e4' }]);
        expect(c.selecionada).toBeNull();
    });

    it('arrastar e soltar emite o lance', () => {
        const emitidos: unknown[] = [];
        c.lance.subscribe(l => emitidos.push(l));

        c.onPointerDown(ponteiro(centroEmPixels(c, 'g1')));
        c.onPointerUp(ponteiro(centroEmPixels(c, 'f3')));

        expect(emitidos).toEqual([{ from: 'g1', to: 'f3' }]);
    });

    it('soltar na mesma casa mantém a seleção, para o jogador clicar o destino', () => {
        c.onPointerDown(ponteiro(centroEmPixels(c, 'e2')));
        c.onPointerUp(ponteiro(centroEmPixels(c, 'e2')));

        expect(c.selecionada).toBe('e2');
        expect(c.arrastando).toBeNull();
    });

    it('soltar num destino inválido não emite nada e desmarca', () => {
        const emitidos: unknown[] = [];
        c.lance.subscribe(l => emitidos.push(l));

        c.onPointerDown(ponteiro(centroEmPixels(c, 'e2')));
        c.onPointerUp(ponteiro(centroEmPixels(c, 'h6')));

        expect(emitidos).toEqual([]);
        expect(c.selecionada).toBeNull();
    });

    it('marca os destinos, distinguindo captura de casa vazia', () => {
        comLancesLegais(c, [
            { from: 'e4', to: 'e5', captura: false },
            { from: 'e4', to: 'd5', captura: true },
        ]);
        c.fen = 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2';
        aplicar(c, { fen: true });
        c.selecionada = 'e4';

        expect(c.ehDestino('e5')).toBe(true);
        expect(c.ehDestinoDeCaptura('e5')).toBe(false);
        expect(c.ehDestino('d5')).toBe(true);
        expect(c.ehDestinoDeCaptura('d5')).toBe(true);
        expect(c.ehDestino('a1')).toBe(false);
    });

    it('uma posição nova descarta a seleção da posição velha', () => {
        c.selecionada = 'e2';
        c.fen = APOS_E4;
        aplicar(c, { fen: true });

        expect(c.selecionada).toBeNull();
    });

    it('uma lista de destinos recalculada NÃO derruba a peça da mão do jogador', () => {
        // O componente pai recalcula `destinosLegais` a cada mensagem do servidor
        // e entrega sempre um Map novo. Se isso cancelasse o arrasto, uma resposta
        // chegando no meio do movimento faria a peça cair — o que em bullet, com o
        // adversário jogando rápido, aconteceria o tempo todo.
        c.onPointerDown(ponteiro(centroEmPixels(c, 'e2')));
        expect(c.arrastando).not.toBeNull();

        comLancesLegais(c, [
            { from: 'e2', to: 'e3', captura: false },
            { from: 'e2', to: 'e4', captura: false },
        ]);

        expect(c.arrastando).not.toBeNull();
        expect(c.selecionada).toBe('e2');
    });

    describe('promoção', () => {
        beforeEach(() => {
            c.fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1';
            aplicar(c, { fen: true });
            comLancesLegais(c, [
                { from: 'a7', to: 'a8', promocao: 'q', captura: false },
                { from: 'a7', to: 'a8', promocao: 'n', captura: false },
            ]);
        });

        it('pede a peça em vez de jogar direto', () => {
            const emitidos: unknown[] = [];
            c.lance.subscribe(l => emitidos.push(l));

            c.onPointerDown(ponteiro(centroEmPixels(c, 'a7')));
            c.onPointerUp(ponteiro(centroEmPixels(c, 'a8')));

            expect(emitidos).toEqual([]);
            expect(c.promocaoPendente).toEqual({ from: 'a7', to: 'a8', ehPreLance: false });
        });

        it('emite o lance com a peça escolhida', () => {
            const emitidos: unknown[] = [];
            c.lance.subscribe(l => emitidos.push(l));

            c.promocaoPendente = { from: 'a7', to: 'a8', ehPreLance: false };
            c.escolherPromocao('n');

            expect(emitidos).toEqual([{ from: 'a7', to: 'a8', promocao: 'n' }]);
            expect(c.promocaoPendente).toBeNull();
        });

        it('cancelar não emite nada', () => {
            const emitidos: unknown[] = [];
            c.lance.subscribe(l => emitidos.push(l));

            c.promocaoPendente = { from: 'a7', to: 'a8', ehPreLance: false };
            c.cancelarPromocao();

            expect(emitidos).toEqual([]);
            expect(c.selecionada).toBeNull();
        });
    });
});

describe('pré-lances no tabuleiro', () => {
    let c: TabuleiroComponent;

    beforeEach(() => {
        c = montar(APOS_E4);
        comGrade(c);
        // Vez das pretas do ponto de vista do servidor; quem olha joga de brancas
        // e por isso só pode pré-lançar.
        c.fila = FilaPreLances.daPosicao(APOS_E4, 'w');
        c.destinosLegais = new Map();
        aplicar(c, { fila: true, destinosLegais: true });
    });

    it('não deixa jogar, só pré-lançar', () => {
        expect(c.podeJogar).toBe(false);
        expect(c.podePreLancar).toBe(true);
    });

    it('emite pré-lance em vez de lance', () => {
        const lances: unknown[] = [];
        const preLances: unknown[] = [];
        c.lance.subscribe(l => lances.push(l));
        c.preLanceEscolhido.subscribe(l => preLances.push(l));

        c.onPointerDown(ponteiro(centroEmPixels(c, 'g1')));
        c.onPointerUp(ponteiro(centroEmPixels(c, 'f3')));

        expect(lances).toEqual([]);
        expect(preLances).toEqual([{ from: 'g1', to: 'f3' }]);
    });

    it('só deixa pegar peça da própria cor', () => {
        c.onPointerDown(ponteiro(centroEmPixels(c, 'e7'))); // peão preto
        expect(c.selecionada).toBeNull();
    });

    it('destaca as casas dos pré-lances já enfileirados', () => {
        c.fila = c.fila!.enfileirar({ from: 'g1', to: 'f3' });
        aplicar(c, { fila: true });

        expect(c.ehCasaDePreLance('g1')).toBe(true);
        expect(c.ehCasaDePreLance('f3')).toBe(true);
        expect(c.ehCasaDePreLance('a1')).toBe(false);
    });

    it('desenha uma seta por pré-lance enfileirado', () => {
        c.fila = c.fila!
            .enfileirar({ from: 'g1', to: 'f3' })
            .enfileirar({ from: 'f1', to: 'c4' });
        aplicar(c, { fila: true });

        expect(c.setasVisiveis).toEqual([
            { de: 'g1', para: 'f3' },
            { de: 'f1', para: 'c4' },
        ]);
        expect(c.ehSetaDePreLance({ de: 'g1', para: 'f3' })).toBe(true);
    });
});

describe('anotações do jogador', () => {
    let c: TabuleiroComponent;

    beforeEach(() => {
        c = montar();
        comGrade(c);
    });

    it('botão direito no mesmo lugar pinta a casa', () => {
        const e4 = centroEmPixels(c, 'e4');
        c.onPointerDown(ponteiro(e4, 2));
        c.onPointerUp(ponteiro(e4, 2));

        expect(c.marcadas.has('e4')).toBe(true);
    });

    it('repetir o botão direito despinta', () => {
        const e4 = centroEmPixels(c, 'e4');
        for (let i = 0; i < 2; i++) {
            c.onPointerDown(ponteiro(e4, 2));
            c.onPointerUp(ponteiro(e4, 2));
        }

        expect(c.marcadas.has('e4')).toBe(false);
    });

    it('arrastar com o botão direito cria uma seta', () => {
        c.onPointerDown(ponteiro(centroEmPixels(c, 'e2'), 2));
        c.onPointerMove(ponteiro(centroEmPixels(c, 'e4'), 2));
        c.onPointerUp(ponteiro(centroEmPixels(c, 'e4'), 2));

        expect(c.setas).toEqual([{ de: 'e2', para: 'e4' }]);
    });

    it('a mesma seta duas vezes some', () => {
        for (let i = 0; i < 2; i++) {
            c.onPointerDown(ponteiro(centroEmPixels(c, 'e2'), 2));
            c.onPointerMove(ponteiro(centroEmPixels(c, 'e4'), 2));
            c.onPointerUp(ponteiro(centroEmPixels(c, 'e4'), 2));
        }

        expect(c.setas).toEqual([]);
    });

    it('clique esquerdo limpa marcas e setas, como no chess.com', () => {
        c.marcadas = new Set(['e4']);
        c.setas = [{ de: 'e2', para: 'e4' }];

        c.onPointerDown(ponteiro(centroEmPixels(c, 'a3')));

        expect(c.marcadas.size).toBe(0);
        expect(c.setas).toEqual([]);
    });

    it('um lance novo apaga as anotações da posição anterior', () => {
        c.marcadas = new Set(['e4']);
        c.setas = [{ de: 'e2', para: 'e4' }];

        c.fen = APOS_E4;
        aplicar(c, { fen: true });

        expect(c.marcadas.size).toBe(0);
        expect(c.setas).toEqual([]);
    });

    it('a ponta da seta recua para não cobrir a peça de destino', () => {
        const centroDestino = c.centro('e4');
        const ponta = c.pontaDaSeta({ de: 'e2', para: 'e4' });

        // A seta sobe (e2 está abaixo de e4 na tela), então a ponta fica abaixo
        // do centro da casa de destino.
        expect(ponta.x).toBeCloseTo(centroDestino.x, 5);
        expect(ponta.y).toBeGreaterThan(centroDestino.y);
    });
});

describe('redimensionamento', () => {
    it('arrasta a alça e emite o tamanho novo, limitado ao intervalo permitido', () => {
        const c = montar();
        const emitidos: number[] = [];
        c.tamanhoAlterado.subscribe(t => emitidos.push(t));

        const alca = {
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
            hasPointerCapture: () => true,
        };
        const evento = (clientX: number, clientY: number) => ({
            clientX, clientY, pointerId: 1, currentTarget: alca,
            preventDefault: vi.fn(), stopPropagation: vi.fn(),
        } as unknown as PointerEvent);

        c.tamanho = 400;
        c.onRedimensionarInicio(evento(100, 100));
        c.onRedimensionarMove(evento(180, 100));
        expect(emitidos.at(-1)).toBe(480);

        // Muito para a esquerda: para no mínimo, em vez de virar um tabuleiro de 0px.
        c.onRedimensionarMove(evento(-900, 100));
        expect(emitidos.at(-1)).toBe(240);

        c.onRedimensionarMove(evento(2000, 100));
        expect(emitidos.at(-1)).toBe(900);
    });

    it('depois de soltar, mover o mouse não muda mais nada', () => {
        const c = montar();
        const emitidos: number[] = [];
        c.tamanhoAlterado.subscribe(t => emitidos.push(t));

        const alca = {
            setPointerCapture: vi.fn(), releasePointerCapture: vi.fn(), hasPointerCapture: () => true,
        };
        const evento = (x: number) => ({
            clientX: x, clientY: 0, pointerId: 1, currentTarget: alca,
            preventDefault: vi.fn(), stopPropagation: vi.fn(),
        } as unknown as PointerEvent);

        c.onRedimensionarInicio(evento(100));
        c.onRedimensionarFim(evento(100));
        c.onRedimensionarMove(evento(500));

        expect(emitidos).toEqual([]);
    });
});
