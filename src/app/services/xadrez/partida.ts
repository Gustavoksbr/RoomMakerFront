/**
 * A partida vista pelo tabuleiro.
 *
 * O servidor manda só a lista de lances em SAN. Tudo o que a tela precisa —
 * a posição depois de cada lance, o que foi capturado, quem está em xeque, para
 * onde cada peça pode ir — é derivado aqui, de uma vez, e depois só consultado.
 *
 * Reconstruir a partida inteira a cada atualização parece caro e não é: são
 * dezenas de lances, não milhares, e a alternativa (aplicar incrementalmente e
 * torcer para o estado local não divergir do servidor) é justamente o tipo de
 * cache que sai de sincronia e mostra uma peça no lugar errado.
 */

import { Chess } from 'chess.js';

import { Notacao, paraIngles } from './notacao';
import { Casa, Cor, TipoPeca, VALOR_PECA } from './tabuleiro';

/** Posição inicial do xadrez. */
export const FEN_INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export interface LanceDetalhado {
    /** 1-indexado: o primeiro lance da partida é 1. */
    readonly numero: number;
    /** SAN em inglês — a forma que o chess.js entende. */
    readonly san: string;
    /** SAN na notação da sala, que é como o jogador vê. */
    readonly sanExibicao: string;
    readonly from: Casa;
    readonly to: Casa;
    readonly cor: Cor;
    readonly peca: TipoPeca;
    readonly capturou?: TipoPeca;
    readonly promoveu?: TipoPeca;
    /** FEN depois deste lance. */
    readonly fen: string;
    readonly xeque: boolean;
    readonly mate: boolean;
}

export interface LanceLegal {
    readonly from: Casa;
    readonly to: Casa;
    readonly promocao?: TipoPeca;
    readonly captura: boolean;
}

export interface Material {
    /** Peças pretas que as brancas capturaram. */
    readonly capturadasPelasBrancas: readonly TipoPeca[];
    readonly capturadasPelasPretas: readonly TipoPeca[];
    /** Positivo = brancas na frente. */
    readonly saldo: number;
}

export class PartidaTabuleiro {

    private constructor(
        readonly lances: readonly LanceDetalhado[],
        /** fens[i] = posição APÓS i lances; fens[0] é a posição inicial. */
        private readonly fens: readonly string[],
        /**
         * Quantos lances do servidor não puderam ser reproduzidos. Deveria ser
         * sempre zero: se não for, o cliente e o servidor discordam sobre a
         * partida, e a tela precisa dizer isso em vez de desenhar uma posição
         * inventada.
         */
        readonly lancesCorrompidos: number,
    ) { }

    /**
     * @param lances lances em SAN, na notação da sala.
     */
    static de(lances: readonly string[], notacao: Notacao | null): PartidaTabuleiro {
        const jogo = new Chess();
        const detalhados: LanceDetalhado[] = [];
        const fens: string[] = [jogo.fen()];
        let corrompidos = 0;

        for (const sanOriginal of lances ?? []) {
            const san = paraIngles(sanOriginal, notacao);
            let aplicado;
            try {
                aplicado = jogo.move(san);
            } catch {
                aplicado = null;
            }
            if (!aplicado) {
                corrompidos++;
                continue;
            }

            detalhados.push({
                numero: detalhados.length + 1,
                san: aplicado.san,
                sanExibicao: sanOriginal,
                from: aplicado.from,
                to: aplicado.to,
                cor: aplicado.color as Cor,
                peca: aplicado.piece as TipoPeca,
                capturou: aplicado.captured as TipoPeca | undefined,
                promoveu: aplicado.promotion as TipoPeca | undefined,
                fen: jogo.fen(),
                xeque: jogo.inCheck(),
                mate: jogo.isCheckmate(),
            });
            fens.push(jogo.fen());
        }

        return new PartidaTabuleiro(detalhados, fens, corrompidos);
    }

    get totalLances(): number {
        return this.lances.length;
    }

    /** FEN da posição após `ply` lances. `ply` 0 é a posição inicial. */
    fenNoLance(ply: number): string {
        const indice = Math.max(0, Math.min(this.fens.length - 1, ply));
        return this.fens[indice];
    }

    get fenAtual(): string {
        return this.fens[this.fens.length - 1];
    }

    /** O lance que levou à posição após `ply` lances, ou null na posição inicial. */
    lanceNoLance(ply: number): LanceDetalhado | null {
        if (ply <= 0 || ply > this.lances.length) return null;
        return this.lances[ply - 1];
    }

    get ultimoLance(): LanceDetalhado | null {
        return this.lanceNoLance(this.totalLances);
    }

    get vezDe(): Cor {
        return this.totalLances % 2 === 0 ? 'w' : 'b';
    }

    /**
     * Todos os lances legais na posição atual, prontos para consulta por origem.
     *
     * O tabuleiro nunca recalcula regra nenhuma: ele pergunta a esta lista, e a
     * palavra final continua sendo do servidor.
     */
    lancesLegais(): LanceLegal[] {
        const jogo = new Chess(this.fenAtual);
        return jogo.moves({ verbose: true }).map(m => ({
            from: m.from,
            to: m.to,
            promocao: m.promotion as TipoPeca | undefined,
            captura: !!m.captured,
        }));
    }

    /** Índice from → destinos legais, que é como a tela consulta. */
    destinosLegaisPorOrigem(): Map<Casa, LanceLegal[]> {
        const indice = new Map<Casa, LanceLegal[]>();
        for (const lance of this.lancesLegais()) {
            const lista = indice.get(lance.from);
            if (lista) lista.push(lance);
            else indice.set(lance.from, [lance]);
        }
        return indice;
    }

    /** A casa do rei em xeque na posição atual, ou null. */
    get casaDoReiEmXeque(): Casa | null {
        const jogo = new Chess(this.fenAtual);
        if (!jogo.inCheck()) return null;

        const corEmXeque = jogo.turn();
        for (const linha of jogo.board()) {
            for (const casa of linha) {
                if (casa && casa.type === 'k' && casa.color === corEmXeque) {
                    return casa.square;
                }
            }
        }
        return null;
    }

    /**
     * O material capturado até o lance `ply`.
     *
     * Contado a partir das capturas de fato, e não comparando com a posição
     * inicial: assim a promoção não vira "peão desaparecido" na conta.
     */
    materialNoLance(ply: number): Material {
        const pelasBrancas: TipoPeca[] = [];
        const pelasPretas: TipoPeca[] = [];

        for (const lance of this.lances.slice(0, Math.max(0, ply))) {
            if (!lance.capturou) continue;
            (lance.cor === 'w' ? pelasBrancas : pelasPretas).push(lance.capturou);
        }

        const somar = (pecas: readonly TipoPeca[]) =>
            pecas.reduce((total, peca) => total + VALOR_PECA[peca], 0);

        return {
            capturadasPelasBrancas: pelasBrancas,
            capturadasPelasPretas: pelasPretas,
            saldo: somar(pelasBrancas) - somar(pelasPretas),
        };
    }

    get material(): Material {
        return this.materialNoLance(this.totalLances);
    }
}
