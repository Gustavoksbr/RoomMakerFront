import { describe, expect, it } from 'vitest';

import { deIngles, paraIngles } from './notacao';
import { FEN_INICIAL, PartidaTabuleiro } from './partida';
import { ocupacaoDeFen } from './tabuleiro';

/** Mate do pastor. */
const PASTOR = ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#'];

describe('notação portuguesa', () => {
    it('traduz as peças nos dois sentidos', () => {
        expect(paraIngles('Cf3', 'PORTUGUESA')).toBe('Nf3');
        expect(paraIngles('Td1', 'PORTUGUESA')).toBe('Rd1');
        expect(paraIngles('Re2', 'PORTUGUESA')).toBe('Ke2');
        expect(paraIngles('Dd4', 'PORTUGUESA')).toBe('Qd4');
        expect(paraIngles('Bb5', 'PORTUGUESA')).toBe('Bb5');
    });

    it('não confunde Rei com Torre — as duas usam R em algum dos lados', () => {
        // Em português R é Rei; em inglês R é Torre. Uma tradução ingênua faria
        // Rei virar Torre no caminho de volta.
        expect(deIngles(paraIngles('Re2', 'PORTUGUESA'), 'PORTUGUESA')).toBe('Re2');
        expect(deIngles(paraIngles('Td1', 'PORTUGUESA'), 'PORTUGUESA')).toBe('Td1');
        expect(paraIngles('Rd1', 'PORTUGUESA')).toBe('Kd1');
        expect(deIngles('Rd1', 'PORTUGUESA')).toBe('Td1');
    });

    it('traduz também a peça da promoção', () => {
        expect(paraIngles('e8=D', 'PORTUGUESA')).toBe('e8=Q');
        expect(deIngles('e8=Q', 'PORTUGUESA')).toBe('e8=D');
    });

    it('deixa o roque e os peões em paz', () => {
        expect(paraIngles('O-O', 'PORTUGUESA')).toBe('O-O');
        expect(paraIngles('exd5', 'PORTUGUESA')).toBe('exd5');
    });

    it('não mexe em nada quando a notação é inglesa', () => {
        expect(paraIngles('Nf3', 'INGLESA')).toBe('Nf3');
        expect(deIngles('Nf3', 'INGLESA')).toBe('Nf3');
        expect(paraIngles('Nf3', null)).toBe('Nf3');
    });
});

describe('reconstrução da partida', () => {
    it('parte da posição inicial quando não há lances', () => {
        const partida = PartidaTabuleiro.de([], 'INGLESA');

        expect(partida.totalLances).toBe(0);
        expect(partida.fenAtual).toBe(FEN_INICIAL);
        expect(partida.vezDe).toBe('w');
        expect(partida.ultimoLance).toBeNull();
    });

    it('reproduz a partida e detalha cada lance', () => {
        const partida = PartidaTabuleiro.de(PASTOR, 'INGLESA');

        expect(partida.totalLances).toBe(7);
        expect(partida.lancesCorrompidos).toBe(0);

        const ultimo = partida.ultimoLance!;
        expect(ultimo.san).toBe('Qxf7#');
        expect(ultimo.from).toBe('h5');
        expect(ultimo.to).toBe('f7');
        expect(ultimo.capturou).toBe('p');
        expect(ultimo.mate).toBe(true);
    });

    it('alterna a vez a cada lance', () => {
        expect(PartidaTabuleiro.de(['e4'], 'INGLESA').vezDe).toBe('b');
        expect(PartidaTabuleiro.de(['e4', 'e5'], 'INGLESA').vezDe).toBe('w');
    });

    it('guarda uma posição por lance, mais a inicial', () => {
        const partida = PartidaTabuleiro.de(['e4', 'e5'], 'INGLESA');

        expect(partida.fenNoLance(0)).toBe(FEN_INICIAL);
        expect(ocupacaoDeFen(partida.fenNoLance(1)).get('e4')).toEqual({ tipo: 'p', cor: 'w' });
        expect(ocupacaoDeFen(partida.fenNoLance(2)).get('e5')).toEqual({ tipo: 'p', cor: 'b' });
    });

    it('limita o ply pedido em vez de devolver undefined', () => {
        const partida = PartidaTabuleiro.de(['e4'], 'INGLESA');

        expect(partida.fenNoLance(-5)).toBe(FEN_INICIAL);
        expect(partida.fenNoLance(99)).toBe(partida.fenAtual);
    });

    it('entende lances em português', () => {
        const partida = PartidaTabuleiro.de(['e4', 'e5', 'Cf3'], 'PORTUGUESA');

        expect(partida.totalLances).toBe(3);
        expect(partida.ultimoLance!.san).toBe('Nf3');
        expect(partida.ultimoLance!.sanExibicao).toBe('Cf3');
    });

    it('conta lance impossível em vez de desenhar uma posição inventada', () => {
        const partida = PartidaTabuleiro.de(['e4', 'lixo', 'e5'], 'INGLESA');

        expect(partida.lancesCorrompidos).toBe(1);
        expect(partida.totalLances).toBe(2);
    });

    it('marca o xeque', () => {
        // 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 — a dama já ameaça, mas não é xeque ainda.
        const semXeque = PartidaTabuleiro.de(PASTOR.slice(0, 6), 'INGLESA');
        expect(semXeque.ultimoLance!.xeque).toBe(false);
        expect(semXeque.casaDoReiEmXeque).toBeNull();

        const comMate = PartidaTabuleiro.de(PASTOR, 'INGLESA');
        expect(comMate.casaDoReiEmXeque).toBe('e8');
    });
});

describe('lances legais', () => {
    it('a posição inicial tem 20 lances', () => {
        expect(PartidaTabuleiro.de([], 'INGLESA').lancesLegais()).toHaveLength(20);
    });

    it('indexa por casa de origem', () => {
        const indice = PartidaTabuleiro.de([], 'INGLESA').destinosLegaisPorOrigem();

        expect(indice.get('e2')!.map(l => l.to).sort()).toEqual(['e3', 'e4']);
        expect(indice.get('g1')!.map(l => l.to).sort()).toEqual(['f3', 'h3']);
        expect(indice.has('e1')).toBe(false); // o rei não tem para onde ir
    });

    it('marca capturas', () => {
        // 1.e4 d5 — as brancas podem capturar em d5.
        const partida = PartidaTabuleiro.de(['e4', 'd5'], 'INGLESA');
        const captura = partida.lancesLegais().find(l => l.from === 'e4' && l.to === 'd5');

        expect(captura).toBeDefined();
        expect(captura!.captura).toBe(true);
    });

    it('oferece as quatro peças na promoção', () => {
        const partida = PartidaTabuleiro.de(
            ['e4', 'd5', 'exd5', 'c6', 'dxc6', 'h6', 'cxb7', 'h5'], 'INGLESA');
        const promocoes = partida.lancesLegais().filter(l => l.from === 'b7' && l.to === 'a8');

        expect(promocoes.map(p => p.promocao).sort()).toEqual(['b', 'n', 'q', 'r']);
    });
});

describe('material', () => {
    it('está zerado antes de qualquer captura', () => {
        const material = PartidaTabuleiro.de(['e4', 'e5'], 'INGLESA').material;

        expect(material.saldo).toBe(0);
        expect(material.capturadasPelasBrancas).toEqual([]);
    });

    it('registra a captura do lado certo', () => {
        // 1.e4 d5 2.exd5 — as brancas ganharam um peão.
        const material = PartidaTabuleiro.de(['e4', 'd5', 'exd5'], 'INGLESA').material;

        expect(material.capturadasPelasBrancas).toEqual(['p']);
        expect(material.capturadasPelasPretas).toEqual([]);
        expect(material.saldo).toBe(1);
    });

    it('soma pelo valor da peça', () => {
        // 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7 — dama comeu peão; saldo +1.
        const material = PartidaTabuleiro.de(PASTOR, 'INGLESA').material;
        expect(material.saldo).toBe(1);
    });

    it('fica negativo quando são as pretas que estão na frente', () => {
        // 1.d4 e5 2.c4 exd4 — as pretas ganharam um peão.
        const material = PartidaTabuleiro.de(['d4', 'e5', 'c4', 'exd4'], 'INGLESA').material;

        expect(material.capturadasPelasPretas).toEqual(['p']);
        expect(material.saldo).toBe(-1);
    });

    it('conta o material de uma posição passada, para a navegação no histórico', () => {
        const partida = PartidaTabuleiro.de(['e4', 'd5', 'exd5'], 'INGLESA');

        expect(partida.materialNoLance(2).saldo).toBe(0);
        expect(partida.materialNoLance(3).saldo).toBe(1);
    });

    it('promoção não é contada como peão sumido', () => {
        // Contar por captura, e não comparando com a posição inicial, é o que faz
        // a promoção não bagunçar o placar.
        const partida = PartidaTabuleiro.de(
            ['e4', 'd5', 'exd5', 'c6', 'dxc6', 'h6', 'cxb7', 'h5', 'bxa8=Q'], 'INGLESA');

        // Três peões pretos e uma torre: 1+1+1+5 = 8.
        expect(partida.material.saldo).toBe(8);
        expect(partida.material.capturadasPelasBrancas).toEqual(['p', 'p', 'p', 'r']);
    });
});
