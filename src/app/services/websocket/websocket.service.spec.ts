import { describe, expect, it } from 'vitest';

import { deveSerSuprimidoGlobalmente } from './websocket.service';

describe('deveSerSuprimidoGlobalmente', () => {
    it('cala erro de notação inválida — o jogo já mostra aviso local', () => {
        expect(deveSerSuprimidoGlobalmente("Notação inválida: 'e9'. Use SAN (ex: e4, Nf3, O-O).")).toBe(true);
        expect(deveSerSuprimidoGlobalmente('Lance contém caracteres inválidos para a notação inglesa.')).toBe(true);
    });

    it('cala lance ilegal no TABULEIRO VISUAL — é sempre desync de rede, não erro do jogador', () => {
        expect(deveSerSuprimidoGlobalmente('Lance ilegal na posição atual (tabuleiro visual): e2-e5.')).toBe(true);
    });

    it('NÃO cala lance ilegal no modo às cegas — ali é um erro de verdade do jogador', () => {
        // Mesma frase-base, sem o marcador "(tabuleiro visual)": vem do modo SAN,
        // onde a mensagem é a única forma de o jogador saber que errou.
        expect(deveSerSuprimidoGlobalmente("Lance ilegal na posição atual: 'e5'.")).toBe(false);
    });

    it('não cala erros de outros jogos ou de outras categorias de xadrez', () => {
        expect(deveSerSuprimidoGlobalmente('Você não está na sala.')).toBe(false);
        expect(deveSerSuprimidoGlobalmente('Já há uma partida em andamento.')).toBe(false);
        expect(deveSerSuprimidoGlobalmente('Token expirado.')).toBe(false);
    });

    it('é insensível a maiúsculas/minúsculas', () => {
        expect(deveSerSuprimidoGlobalmente('LANCE ILEGAL NA POSIÇÃO ATUAL (TABULEIRO VISUAL): A1-A2.')).toBe(true);
    });
});
