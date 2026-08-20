/**
 * Tipos e geometria do tabuleiro.
 *
 * Este arquivo não conhece chess.js nem Angular: é só "que casa é essa, que
 * peça está nela, e para onde essa peça consegue ir". Serve tanto ao desenho da
 * tela quanto aos pré-lances, que precisam raciocinar sobre uma posição que
 * ainda não existe e por isso não podem depender de um motor de regras.
 */

export type Cor = 'w' | 'b';
export type TipoPeca = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/** Uma casa em notação algébrica: 'a1' a 'h8'. */
export type Casa = string;

export interface Peca {
    readonly tipo: TipoPeca;
    readonly cor: Cor;
}

/** Ocupação do tabuleiro: só as casas com peça aparecem. */
export type Ocupacao = ReadonlyMap<Casa, Peca>;

export const COLUNAS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const LINHAS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

/** Valor das peças para a contagem de material. O rei não conta. */
export const VALOR_PECA: Record<TipoPeca, number> = {
    p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

// ---------------------------------------------------------------------------
// Casas <-> coordenadas
// ---------------------------------------------------------------------------

/** Coluna 0..7 (a..h) e linha 0..7 (1..8). Retorna null se a casa não existir. */
export function paraCoordenada(casa: Casa): { coluna: number; linha: number } | null {
    if (!casa || casa.length !== 2) return null;
    const coluna = casa.charCodeAt(0) - 97; // 'a'
    const linha = casa.charCodeAt(1) - 49;  // '1'
    if (coluna < 0 || coluna > 7 || linha < 0 || linha > 7) return null;
    return { coluna, linha };
}

export function paraCasa(coluna: number, linha: number): Casa | null {
    if (coluna < 0 || coluna > 7 || linha < 0 || linha > 7) return null;
    return COLUNAS[coluna] + LINHAS[linha];
}

export function ehCasaValida(casa: Casa): boolean {
    return paraCoordenada(casa) !== null;
}

/** Todas as 64 casas, de a1 a h8. */
export function todasAsCasas(): Casa[] {
    const casas: Casa[] = [];
    for (let linha = 0; linha < 8; linha++) {
        for (let coluna = 0; coluna < 8; coluna++) {
            casas.push(paraCasa(coluna, linha)!);
        }
    }
    return casas;
}

/** true quando a casa é clara (a mesma paridade de h1). */
export function ehCasaClara(casa: Casa): boolean {
    const c = paraCoordenada(casa);
    if (!c) return false;
    return (c.coluna + c.linha) % 2 === 1;
}

// ---------------------------------------------------------------------------
// FEN
// ---------------------------------------------------------------------------

/**
 * Lê só o campo de peças do FEN. O resto (vez, roques, contadores) não interessa
 * a quem só quer desenhar ou calcular alcance de peça.
 */
export function ocupacaoDeFen(fen: string): Map<Casa, Peca> {
    const mapa = new Map<Casa, Peca>();
    const campoPecas = (fen ?? '').trim().split(/\s+/)[0] ?? '';
    const linhas = campoPecas.split('/');

    // O FEN começa pela 8ª linha e desce até a 1ª.
    for (let i = 0; i < linhas.length && i < 8; i++) {
        const linha = 7 - i;
        let coluna = 0;
        for (const caractere of linhas[i]) {
            if (caractere >= '1' && caractere <= '8') {
                coluna += Number(caractere);
                continue;
            }
            const casa = paraCasa(coluna, linha);
            if (casa) {
                mapa.set(casa, {
                    tipo: caractere.toLowerCase() as TipoPeca,
                    cor: caractere === caractere.toUpperCase() ? 'w' : 'b',
                });
            }
            coluna++;
        }
    }
    return mapa;
}

/**
 * O inverso de {@link ocupacaoDeFen}: serializa uma ocupação de volta para o
 * campo de peças do FEN (a parte antes do primeiro espaço).
 *
 * Existe para desenhar posições HIPOTÉTICAS — a posição projetada de uma fila
 * de pré-lances, por exemplo — que não têm vez, direitos de roque ou contador
 * de lances fazendo sentido nenhum. Quem usa esta string (o tabuleiro) só lê o
 * campo de peças mesmo, então o resto do FEN pode ser preenchido com qualquer
 * placeholder válido.
 */
export function ocupacaoParaFenPecas(ocupacao: Ocupacao): string {
    const linhas: string[] = [];
    for (let linha = 7; linha >= 0; linha--) {
        let linhaTexto = '';
        let vazias = 0;
        for (let coluna = 0; coluna < 8; coluna++) {
            const peca = ocupacao.get(paraCasa(coluna, linha)!);
            if (!peca) {
                vazias++;
                continue;
            }
            if (vazias > 0) {
                linhaTexto += vazias;
                vazias = 0;
            }
            linhaTexto += peca.cor === 'w' ? peca.tipo.toUpperCase() : peca.tipo;
        }
        if (vazias > 0) linhaTexto += vazias;
        linhas.push(linhaTexto);
    }
    return linhas.join('/');
}

/** De quem é a vez, segundo o FEN. */
export function vezDeFen(fen: string): Cor {
    return (fen ?? '').trim().split(/\s+/)[1] === 'b' ? 'b' : 'w';
}

/** Direitos de roque ainda existentes, segundo o FEN (ex.: "KQkq"). */
export function roquesDeFen(fen: string): string {
    const campo = (fen ?? '').trim().split(/\s+/)[2] ?? '-';
    return campo === '-' ? '' : campo;
}

// ---------------------------------------------------------------------------
// Alcance geométrico das peças
// ---------------------------------------------------------------------------

/**
 * Para onde esta peça CONSEGUIRIA ir, olhando só a geometria: sem se importar
 * com xeque, com de quem é a vez, nem com o que está no caminho.
 *
 * É deliberadamente permissivo, porque é a base dos pré-lances. Quando o jogador
 * escolhe um pré-lance, a posição em que ele vai cair ainda não existe: a torre
 * que hoje está trancada pode estar livre daqui a um lance, e a casa vazia para
 * onde o bispo aponta pode ter uma peça capturável. Filtrar por bloqueio aqui
 * esconderia pré-lances legítimos — que é o erro que dá para sentir jogando.
 *
 * A conferência de verdade acontece no servidor, na hora de aplicar.
 */
export function alcanceGeometrico(peca: Peca, origem: Casa, podeRocar = true): Casa[] {
    const o = paraCoordenada(origem);
    if (!o) return [];

    const destinos: Casa[] = [];
    const adicionar = (coluna: number, linha: number) => {
        const casa = paraCasa(coluna, linha);
        if (casa && casa !== origem) destinos.push(casa);
    };

    const raio = (passos: readonly [number, number][]) => {
        for (const [dc, dl] of passos) {
            for (let n = 1; n < 8; n++) {
                const casa = paraCasa(o.coluna + dc * n, o.linha + dl * n);
                if (!casa) break;
                destinos.push(casa);
            }
        }
    };

    const DIAGONAIS: readonly [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    const RETAS: readonly [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    switch (peca.tipo) {
        case 'p': {
            const frente = peca.cor === 'w' ? 1 : -1;
            const linhaInicial = peca.cor === 'w' ? 1 : 6;
            adicionar(o.coluna, o.linha + frente);
            if (o.linha === linhaInicial) adicionar(o.coluna, o.linha + frente * 2);
            // As diagonais entram mesmo com a casa vazia agora: até o lance sair,
            // uma peça pode chegar lá — inclusive de passagem.
            adicionar(o.coluna - 1, o.linha + frente);
            adicionar(o.coluna + 1, o.linha + frente);
            break;
        }
        case 'n':
            for (const [dc, dl] of [[1, 2], [2, 1], [2, -1], [1, -2],
            [-1, -2], [-2, -1], [-2, 1], [-1, 2]] as const) {
                adicionar(o.coluna + dc, o.linha + dl);
            }
            break;
        case 'b':
            raio(DIAGONAIS);
            break;
        case 'r':
            raio(RETAS);
            break;
        case 'q':
            raio([...RETAS, ...DIAGONAIS]);
            break;
        case 'k': {
            for (const [dc, dl] of [...RETAS, ...DIAGONAIS]) {
                adicionar(o.coluna + dc, o.linha + dl);
            }
            // Roque como o rei andando duas casas — a mesma forma que o servidor
            // espera receber.
            const casaDoRei = peca.cor === 'w' ? 'e1' : 'e8';
            if (podeRocar && origem === casaDoRei) {
                adicionar(o.coluna + 2, o.linha);
                adicionar(o.coluna - 2, o.linha);
            }
            break;
        }
    }

    return destinos;
}
