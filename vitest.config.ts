import { defineConfig } from 'vitest/config';

/**
 * Roda só a lógica pura (tabuleiro, pré-lances, notação, reconstrução da
 * partida) — nada de TestBed nem de DOM.
 *
 * Essa lógica é onde moram os casos de borda do xadrez visual: alcance de peça,
 * projeção de pré-lance, promoção, roque, en passant. Poder exercitá-la em
 * milissegundos, sem subir Angular, é o que torna razoável ter muitos testes
 * dela — e é justamente ela que precisa de muitos.
 */
export default defineConfig({
    test: {
        include: ['src/**/*.spec.ts'],
        environment: 'node',
        globals: false,
    },
});
