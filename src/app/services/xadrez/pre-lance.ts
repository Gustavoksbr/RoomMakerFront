/**
 * Pré-lances: os lances que o jogador escolhe antes de ser a vez dele.
 *
 * O modelo é o do chess.com — vários pré-lances enfileirados, e não um só como
 * no lichess. Isso obriga a responder a uma pergunta que o pré-lance único não
 * faz: depois de enfileirar Cf3, de onde sai o cavalo no PRÓXIMO pré-lance? A
 * resposta é a POSIÇÃO PROJETADA — o tabuleiro como ficaria se os pré-lances já
 * enfileirados fossem jogados e o adversário passasse a vez.
 *
 * A projeção é geométrica de propósito: ela move peças num mapa, sem motor de
 * regras. Um motor recusaria a posição intermediária (é a vez do adversário, o
 * rei pode estar "em xeque") justamente porque ela não é uma posição de xadrez
 * de verdade — é uma hipótese. Quem decide o que é legal é o servidor, na hora
 * em que a posição real finalmente existe.
 */

import {
    Casa, Cor, Ocupacao, Peca, TipoPeca,
    alcanceGeometrico, ocupacaoDeFen, paraCoordenada, roquesDeFen,
} from './tabuleiro';

/** Precisa bater com PartidaXadrez.MAX_PRE_LANCES no backend. */
export const MAX_PRE_LANCES = 8;

export interface PreLance {
    readonly from: Casa;
    readonly to: Casa;
    /** 'q' | 'r' | 'b' | 'n', ou ausente quando o lance não promove. */
    readonly promocao?: TipoPeca;
}

export function preLanceParaTexto(p: PreLance): string {
    return p.from + p.to + (p.promocao ?? '');
}

export function preLancesIguais(a: PreLance, b: PreLance): boolean {
    return a.from === b.from && a.to === b.to && (a.promocao ?? null) === (b.promocao ?? null);
}

// ---------------------------------------------------------------------------
// Projeção
// ---------------------------------------------------------------------------

/**
 * O tabuleiro depois de aplicar um pré-lance, assumindo que ele vai dar certo.
 *
 * Reproduz os efeitos colaterais que mudam o VISUAL — torre do roque, peão
 * promovido, peão capturado de passagem — porque é isso que o jogador precisa
 * enxergar para escolher o pré-lance seguinte.
 */
export function projetarPreLance(ocupacao: Ocupacao, preLance: PreLance): Map<Casa, Peca> {
    const novo = new Map(ocupacao);
    const peca = novo.get(preLance.from);
    if (!peca) return novo;

    novo.delete(preLance.from);

    const origem = paraCoordenada(preLance.from)!;
    const destino = paraCoordenada(preLance.to)!;

    // Roque: o rei andou duas casas na horizontal, então a torre acompanha.
    if (peca.tipo === 'k' && Math.abs(destino.coluna - origem.coluna) === 2) {
        const curto = destino.coluna > origem.coluna;
        const linha = preLance.from[1];
        const casaTorre = (curto ? 'h' : 'a') + linha;
        const destinoTorre = (curto ? 'f' : 'd') + linha;
        const torre = novo.get(casaTorre);
        if (torre) {
            novo.delete(casaTorre);
            novo.set(destinoTorre, torre);
        }
    }

    // En passant: o peão andou na diagonal para uma casa vazia, logo o peão
    // capturado está ao lado, e não embaixo.
    if (peca.tipo === 'p' && origem.coluna !== destino.coluna && !novo.has(preLance.to)) {
        const casaCapturada = preLance.to[0] + preLance.from[1];
        novo.delete(casaCapturada);
    }

    const promoveu = peca.tipo === 'p' && (destino.linha === 7 || destino.linha === 0);
    novo.set(preLance.to, promoveu
        ? { tipo: preLance.promocao ?? 'q', cor: peca.cor }
        : peca);

    return novo;
}

/** A posição projetada depois de toda a fila. */
export function projetarFila(ocupacao: Ocupacao, fila: readonly PreLance[]): Map<Casa, Peca> {
    let atual = new Map(ocupacao);
    for (const preLance of fila) {
        atual = projetarPreLance(atual, preLance);
    }
    return atual;
}

// ---------------------------------------------------------------------------
// Fila
// ---------------------------------------------------------------------------

/**
 * A fila de pré-lances de um jogador e a posição projetada correspondente.
 *
 * É um valor imutável: cada operação devolve uma fila nova. O componente troca a
 * referência inteira, e assim não existe estado meio-atualizado para a tela
 * pegar no meio do caminho.
 */
export class FilaPreLances {

    private constructor(
        /** FEN da posição REAL, de onde a projeção parte. */
        readonly fenBase: string,
        readonly cor: Cor,
        readonly itens: readonly PreLance[],
        /** A posição como ficaria depois de toda a fila. */
        readonly ocupacaoProjetada: Ocupacao,
    ) { }

    /** Cria uma fila vazia a partir do FEN da posição atual. */
    static daPosicao(fen: string, cor: Cor): FilaPreLances {
        return new FilaPreLances(fen, cor, [], ocupacaoDeFen(fen));
    }

    /**
     * Reconstrói uma fila sobre uma posição.
     *
     * Cada item passa pelo mesmo `enfileirar` de sempre, então os pré-lances que
     * deixaram de fazer sentido nessa posição simplesmente não entram — é assim
     * que a fila se conserta sozinha quando o tabuleiro anda.
     */
    static restaurar(fen: string, cor: Cor, itens: readonly PreLance[]): FilaPreLances {
        return itens.reduce<FilaPreLances>(
            (fila, item) => fila.enfileirar(item),
            FilaPreLances.daPosicao(fen, cor),
        );
    }

    get vazia(): boolean {
        return this.itens.length === 0;
    }

    get cheia(): boolean {
        return this.itens.length >= MAX_PRE_LANCES;
    }

    /**
     * Para onde a peça desta casa pode ser pré-lançada, na posição projetada.
     *
     * Devolve lista vazia se a casa não tem peça do jogador — inclusive quando a
     * peça só existe no tabuleiro REAL mas já saiu de lá na projeção, que é o
     * caso de tentar arrastar de novo uma peça que você mesmo já pré-lançou.
     */
    destinosDe(origem: Casa): Casa[] {
        const peca = this.ocupacaoProjetada.get(origem);
        if (!peca || peca.cor !== this.cor) return [];

        // Casa ocupada por peça própria continua valendo como destino: ela pode
        // sair do caminho antes — inclusive por um pré-lance anterior da fila.
        return alcanceGeometrico(peca, origem, roquesDeFen(this.fenBase).length > 0);
    }

    podePreLancarDe(origem: Casa): boolean {
        const peca = this.ocupacaoProjetada.get(origem);
        return !!peca && peca.cor === this.cor;
    }

    /** true se este pré-lance levaria um peão à última fileira. */
    ehPromocao(origem: Casa, destino: Casa): boolean {
        const peca = this.ocupacaoProjetada.get(origem);
        if (!peca || peca.tipo !== 'p' || peca.cor !== this.cor) return false;
        const linha = paraCoordenada(destino)?.linha;
        return peca.cor === 'w' ? linha === 7 : linha === 0;
    }

    /** Acrescenta ao fim da fila. Ignora o pedido se a fila encheu ou o lance for impossível. */
    enfileirar(preLance: PreLance): FilaPreLances {
        if (this.cheia) return this;
        if (!this.destinosDe(preLance.from).includes(preLance.to)) return this;

        return new FilaPreLances(this.fenBase, this.cor, [...this.itens, preLance],
            projetarPreLance(this.ocupacaoProjetada, preLance));
    }

    /**
     * Remove o último pré-lance.
     *
     * Reprojeta do zero em vez de desfazer o último passo: desfazer exigiria
     * guardar o que foi capturado, promovido e arrastado junto em cada item, e
     * manter esse histórico paralelo em sincronia é onde os bugs moram.
     */
    desfazerUltimo(): FilaPreLances {
        if (this.vazia) return this;
        return FilaPreLances.restaurar(this.fenBase, this.cor, this.itens.slice(0, -1));
    }

    /** Descarta a fila inteira, mantendo a posição base. */
    limpar(): FilaPreLances {
        return FilaPreLances.daPosicao(this.fenBase, this.cor);
    }

    /**
     * A mesma fila sobre uma posição nova.
     *
     * Usado quando um lance chega do servidor: os pré-lances seguem valendo, mas
     * passam a ser projetados a partir do tabuleiro atualizado. Os que deixaram
     * de fazer sentido (a peça não está mais lá) caem sozinhos.
     */
    rebasear(fen: string): FilaPreLances {
        return FilaPreLances.restaurar(fen, this.cor, this.itens);
    }
}
