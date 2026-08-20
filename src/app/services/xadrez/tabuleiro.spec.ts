import { describe, expect, it } from 'vitest';

import {
    alcanceGeometrico, ehCasaClara, ocupacaoDeFen, paraCasa, paraCoordenada,
    roquesDeFen, todasAsCasas, vezDeFen,
} from './tabuleiro';

const FEN_INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('coordenadas', () => {
    it('traduz casa para coluna/linha e de volta', () => {
        expect(paraCoordenada('a1')).toEqual({ coluna: 0, linha: 0 });
        expect(paraCoordenada('h8')).toEqual({ coluna: 7, linha: 7 });
        expect(paraCoordenada('e4')).toEqual({ coluna: 4, linha: 3 });
        expect(paraCasa(4, 3)).toBe('e4');
    });

    it('recusa casa fora do tabuleiro em vez de devolver lixo', () => {
        expect(paraCoordenada('i1')).toBeNull();
        expect(paraCoordenada('a9')).toBeNull();
        expect(paraCoordenada('e')).toBeNull();
        expect(paraCoordenada('')).toBeNull();
        expect(paraCasa(8, 0)).toBeNull();
        expect(paraCasa(-1, 0)).toBeNull();
    });

    it('lista as 64 casas sem repetir', () => {
        const casas = todasAsCasas();
        expect(casas).toHaveLength(64);
        expect(new Set(casas).size).toBe(64);
        expect(casas[0]).toBe('a1');
        expect(casas[63]).toBe('h8');
    });

    it('sabe a cor da casa (h1 é clara, a1 é escura)', () => {
        expect(ehCasaClara('h1')).toBe(true);
        expect(ehCasaClara('a1')).toBe(false);
        expect(ehCasaClara('a8')).toBe(true);
        expect(ehCasaClara('e1')).toBe(false);
        expect(ehCasaClara('e4')).toBe(true); // e1 escura, e2, e3, e4 clara
    });
});

describe('leitura de FEN', () => {
    it('lê as 32 peças da posição inicial nas casas certas', () => {
        const ocupacao = ocupacaoDeFen(FEN_INICIAL);

        expect(ocupacao.size).toBe(32);
        expect(ocupacao.get('e1')).toEqual({ tipo: 'k', cor: 'w' });
        expect(ocupacao.get('d8')).toEqual({ tipo: 'q', cor: 'b' });
        expect(ocupacao.get('a2')).toEqual({ tipo: 'p', cor: 'w' });
        expect(ocupacao.get('h7')).toEqual({ tipo: 'p', cor: 'b' });
        expect(ocupacao.has('e4')).toBe(false);
    });

    it('não confunde a ordem das linhas — o FEN começa pela oitava', () => {
        // Só um rei preto em a8 e um branco em h1.
        const ocupacao = ocupacaoDeFen('k7/8/8/8/8/8/8/7K w - - 0 1');
        expect(ocupacao.get('a8')).toEqual({ tipo: 'k', cor: 'b' });
        expect(ocupacao.get('h1')).toEqual({ tipo: 'k', cor: 'w' });
    });

    it('lê a vez e os direitos de roque', () => {
        expect(vezDeFen(FEN_INICIAL)).toBe('w');
        expect(vezDeFen('k7/8/8/8/8/8/8/7K b - - 0 1')).toBe('b');
        expect(roquesDeFen(FEN_INICIAL)).toBe('KQkq');
        expect(roquesDeFen('k7/8/8/8/8/8/8/7K w - - 0 1')).toBe('');
    });

    it('não explode com FEN vazio', () => {
        expect(ocupacaoDeFen('').size).toBe(0);
        expect(vezDeFen('')).toBe('w');
    });
});

describe('alcance geométrico', () => {
    it('cavalo no centro alcança 8 casas; no canto, 2', () => {
        expect(alcanceGeometrico({ tipo: 'n', cor: 'w' }, 'd4')).toHaveLength(8);
        expect(alcanceGeometrico({ tipo: 'n', cor: 'w' }, 'a1').sort()).toEqual(['b3', 'c2']);
    });

    it('torre alcança a linha e a coluna inteiras — 14 casas de qualquer lugar', () => {
        expect(alcanceGeometrico({ tipo: 'r', cor: 'w' }, 'd4')).toHaveLength(14);
        expect(alcanceGeometrico({ tipo: 'r', cor: 'w' }, 'a1')).toHaveLength(14);
    });

    it('bispo alcança 13 casas do centro e 7 do canto', () => {
        expect(alcanceGeometrico({ tipo: 'b', cor: 'w' }, 'd4')).toHaveLength(13);
        expect(alcanceGeometrico({ tipo: 'b', cor: 'w' }, 'a1')).toHaveLength(7);
    });

    it('dama é torre mais bispo', () => {
        expect(alcanceGeometrico({ tipo: 'q', cor: 'w' }, 'd4')).toHaveLength(27);
    });

    it('IGNORA bloqueios — é o que faz o pré-lance funcionar', () => {
        // A torre em a1 "alcança" a8 mesmo com a coluna cheia de peças agora: até
        // o pré-lance sair, elas podem ter saído da frente. Filtrar aqui esconderia
        // pré-lances legítimos.
        const destinos = alcanceGeometrico({ tipo: 'r', cor: 'w' }, 'a1');
        expect(destinos).toContain('a8');
    });

    it('nunca inclui a própria casa', () => {
        for (const tipo of ['p', 'n', 'b', 'r', 'q', 'k'] as const) {
            expect(alcanceGeometrico({ tipo, cor: 'w' }, 'd4')).not.toContain('d4');
        }
    });

    describe('peão', () => {
        it('anda duas casas só da fileira inicial', () => {
            expect(alcanceGeometrico({ tipo: 'p', cor: 'w' }, 'e2')).toContain('e4');
            expect(alcanceGeometrico({ tipo: 'p', cor: 'w' }, 'e3')).not.toContain('e5');
        });

        it('anda para o lado certo conforme a cor', () => {
            expect(alcanceGeometrico({ tipo: 'p', cor: 'w' }, 'e2')).toContain('e3');
            expect(alcanceGeometrico({ tipo: 'p', cor: 'b' }, 'e7')).toContain('e6');
            expect(alcanceGeometrico({ tipo: 'p', cor: 'b' }, 'e7')).toContain('e5');
            expect(alcanceGeometrico({ tipo: 'p', cor: 'b' }, 'e7')).not.toContain('e8');
        });

        it('oferece as diagonais mesmo com a casa vazia agora', () => {
            // Uma peça pode chegar lá antes do pré-lance sair — inclusive de passagem.
            const destinos = alcanceGeometrico({ tipo: 'p', cor: 'w' }, 'e4');
            expect(destinos).toContain('d5');
            expect(destinos).toContain('f5');
        });

        it('não sai do tabuleiro na coluna da borda', () => {
            const destinos = alcanceGeometrico({ tipo: 'p', cor: 'w' }, 'a4');
            expect(destinos).toContain('b5');
            expect(destinos).toHaveLength(2); // a5 e b5
        });
    });

    describe('rei', () => {
        it('anda uma casa em volta', () => {
            expect(alcanceGeometrico({ tipo: 'k', cor: 'w' }, 'd4', false)).toHaveLength(8);
        });

        it('inclui o roque como duas casas na horizontal, a partir da casa inicial', () => {
            const destinos = alcanceGeometrico({ tipo: 'k', cor: 'w' }, 'e1', true);
            expect(destinos).toContain('g1');
            expect(destinos).toContain('c1');
        });

        it('não oferece roque de outra casa que não a inicial', () => {
            expect(alcanceGeometrico({ tipo: 'k', cor: 'w' }, 'e2', true)).not.toContain('g2');
        });

        it('não oferece roque quando o direito já se perdeu', () => {
            expect(alcanceGeometrico({ tipo: 'k', cor: 'w' }, 'e1', false)).not.toContain('g1');
        });

        it('usa a casa inicial da cor certa', () => {
            expect(alcanceGeometrico({ tipo: 'k', cor: 'b' }, 'e8', true)).toContain('g8');
            expect(alcanceGeometrico({ tipo: 'k', cor: 'b' }, 'e1', true)).not.toContain('g1');
        });
    });
});
