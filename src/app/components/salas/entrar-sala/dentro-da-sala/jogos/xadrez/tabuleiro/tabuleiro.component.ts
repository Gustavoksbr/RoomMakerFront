import {
    Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild,
} from '@angular/core';

import {
    Casa, Cor, Ocupacao, Peca, TipoPeca,
    ehCasaClara, ocupacaoDeFen, paraCasa, paraCoordenada,
} from '../../../../../../../services/xadrez/tabuleiro';
import { LanceLegal } from '../../../../../../../services/xadrez/partida';
import { FilaPreLances, PreLance } from '../../../../../../../services/xadrez/pre-lance';

/** Uma peça com identidade própria, para conseguir animá-la de uma casa a outra. */
interface PecaDesenhada {
    id: number;
    casa: Casa;
    peca: Peca;
}

export interface Seta {
    readonly de: Casa;
    readonly para: Casa;
}

export interface LanceEscolhido {
    readonly from: Casa;
    readonly to: Casa;
    readonly promocao?: TipoPeca;
}

/** Glifos Unicode preenchidos; a cor vem do CSS, não do glifo. */
const GLIFOS: Record<TipoPeca, string> = {
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const TAMANHO_MINIMO = 240;
const TAMANHO_MAXIMO = 900;

@Component({
    selector: 'app-tabuleiro-xadrez',
    standalone: true,
    imports: [],
    templateUrl: './tabuleiro.component.html',
    styleUrl: './tabuleiro.component.scss',
})
export class TabuleiroComponent implements OnChanges {

    /** Posição a desenhar. */
    @Input() fen: string = '';
    /** De que lado o jogador olha o tabuleiro. */
    @Input() orientacao: Cor = 'w';
    /** Lances legais na posição atual, indexados por origem. Vazio = não posso jogar. */
    @Input() destinosLegais: Map<Casa, LanceLegal[]> = new Map();
    /** Fila de pré-lances, quando é a vez do adversário. Null = não posso pré-lançar. */
    @Input() fila: FilaPreLances | null = null;
    @Input() ultimoLance: { from: Casa; to: Casa } | null = null;
    @Input() casaXeque: Casa | null = null;
    /** Largura em px. O tabuleiro é quadrado. */
    @Input() tamanho: number = 420;
    @Input() mostrarCoordenadas: boolean = true;

    @Output() lance = new EventEmitter<LanceEscolhido>();
    @Output() preLanceEscolhido = new EventEmitter<LanceEscolhido>();
    @Output() preLancesCancelados = new EventEmitter<void>();
    @Output() tamanhoAlterado = new EventEmitter<number>();

    @ViewChild('grade') private grade?: ElementRef<HTMLDivElement>;

    /** As 64 casas na ordem de leitura da grade, já viradas para a orientação. */
    casasNaOrdem: Casa[] = [];
    pecas: PecaDesenhada[] = [];

    selecionada: Casa | null = null;
    /** Casas pintadas de vermelho pelo jogador (botão direito), para calcular. */
    marcadas = new Set<Casa>();
    setas: Seta[] = [];

    /** Arrasto de peça em curso. x/y em px, relativos à grade. */
    arrastando: { id: number; origem: Casa; x: number; y: number } | null = null;
    /** Seta sendo desenhada com o botão direito. */
    setaEmCurso: Seta | null = null;

    promocaoPendente: { from: Casa; to: Casa; ehPreLance: boolean } | null = null;
    readonly opcoesPromocao: TipoPeca[] = ['q', 'r', 'b', 'n'];

    private proximoId = 1;
    private ocupacaoAtual: Ocupacao = new Map();
    private redimensionando: { xInicial: number; yInicial: number; larguraInicial: number } | null = null;

    // -----------------------------------------------------------------------
    // Sincronização com a posição
    // -----------------------------------------------------------------------

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['orientacao'] || this.casasNaOrdem.length === 0) {
            this.casasNaOrdem = this.ordenarCasas();
        }
        if (changes['fen']) {
            this.sincronizarPecas(ocupacaoDeFen(this.fen));

            // Só a POSIÇÃO cancela o que o jogador estava fazendo: a seleção, o
            // arrasto e as anotações descrevem um tabuleiro que deixou de existir.
            //
            // `destinosLegais` de propósito NÃO entra aqui. Ele é recalculado a
            // cada mensagem do servidor e chega sempre como um Map novo, mesmo
            // sem nada ter mudado — reagir a ele derrubava a peça da mão do
            // jogador quando uma resposta chegava no meio do arrasto. Em bullet,
            // com o adversário jogando rápido, isso acontece o tempo todo.
            this.selecionada = null;
            this.arrastando = null;
            this.limparAnotacoes();
        }
    }

    /**
     * Reconcilia as peças desenhadas com a posição nova, PRESERVANDO a identidade
     * de cada uma.
     *
     * Sem isso, cada atualização de FEN recria os 32 elementos e o tabuleiro pisca
     * em vez de mover a peça: o navegador não tem como saber que a torre de a1 e a
     * torre de d1 são a mesma. Casar as saídas com as entradas por tipo e cor
     * resolve o caso que importa — um lance move uma peça só.
     */
    private sincronizarPecas(nova: Ocupacao): void {
        const permanecem: PecaDesenhada[] = [];
        const sairam: PecaDesenhada[] = [];

        for (const desenhada of this.pecas) {
            const naNova = nova.get(desenhada.casa);
            if (naNova && naNova.tipo === desenhada.peca.tipo && naNova.cor === desenhada.peca.cor) {
                permanecem.push(desenhada);
            } else {
                sairam.push(desenhada);
            }
        }

        const ocupadas = new Set(permanecem.map(p => p.casa));
        const resultado = [...permanecem];

        for (const [casa, peca] of nova) {
            if (ocupadas.has(casa)) continue;

            // Uma peça do mesmo tipo e cor que sumiu de outra casa é, quase sempre,
            // esta mesma peça — foi ela que se moveu.
            const indice = sairam.findIndex(s => s.peca.tipo === peca.tipo && s.peca.cor === peca.cor);
            if (indice >= 0) {
                const mesma = sairam.splice(indice, 1)[0];
                resultado.push({ id: mesma.id, casa, peca });
            } else {
                resultado.push({ id: this.proximoId++, casa, peca });
            }
        }

        this.ocupacaoAtual = nova;
        this.pecas = resultado;
    }

    /**
     * Da casa de cima-esquerda até a de baixo-direita, do ponto de vista de quem
     * olha. Recalculado só quando o tabuleiro vira — a ordem é fixa enquanto a
     * orientação não muda, e o template a percorre a cada ciclo de detecção.
     */
    private ordenarCasas(): Casa[] {
        const casas: Casa[] = [];
        for (let linhaVisual = 0; linhaVisual < 8; linhaVisual++) {
            for (let colunaVisual = 0; colunaVisual < 8; colunaVisual++) {
                casas.push(this.orientacao === 'w'
                    ? paraCasa(colunaVisual, 7 - linhaVisual)!
                    : paraCasa(7 - colunaVisual, linhaVisual)!);
            }
        }
        return casas;
    }

    // -----------------------------------------------------------------------
    // Consultas usadas pelo template
    // -----------------------------------------------------------------------

    glifo(peca: Peca): string {
        return GLIFOS[peca.tipo];
    }

    ehClara(casa: Casa): boolean {
        return ehCasaClara(casa);
    }

    /** Posição da casa em % dentro da grade, já respeitando a orientação. */
    posicao(casa: Casa): { esquerda: number; topo: number } {
        const c = paraCoordenada(casa)!;
        const coluna = this.orientacao === 'w' ? c.coluna : 7 - c.coluna;
        const linha = this.orientacao === 'w' ? 7 - c.linha : c.linha;
        return { esquerda: coluna * 12.5, topo: linha * 12.5 };
    }

    /** Letra da coluna a mostrar nesta casa, ou null. Só na fileira de baixo. */
    rotuloColuna(casa: Casa): string | null {
        const c = paraCoordenada(casa)!;
        const ultimaLinha = this.orientacao === 'w' ? 0 : 7;
        return c.linha === ultimaLinha ? casa[0] : null;
    }

    /** Número da linha a mostrar nesta casa, ou null. Só na coluna da esquerda. */
    rotuloLinha(casa: Casa): string | null {
        const c = paraCoordenada(casa)!;
        const primeiraColuna = this.orientacao === 'w' ? 0 : 7;
        return c.coluna === primeiraColuna ? casa[1] : null;
    }

    get podeJogar(): boolean {
        return this.destinosLegais.size > 0;
    }

    get podePreLancar(): boolean {
        return this.fila !== null;
    }

    ehUltimoLance(casa: Casa): boolean {
        return !!this.ultimoLance && (this.ultimoLance.from === casa || this.ultimoLance.to === casa);
    }

    ehDestino(casa: Casa): boolean {
        if (!this.selecionada) return false;
        if (this.podeJogar) {
            return (this.destinosLegais.get(this.selecionada) ?? []).some(l => l.to === casa);
        }
        return this.fila?.destinosDe(this.selecionada).includes(casa) ?? false;
    }

    /** Destino que tem peça para capturar — desenhado como anel, não como ponto. */
    ehDestinoDeCaptura(casa: Casa): boolean {
        return this.ehDestino(casa) && this.ocupacaoAtual.has(casa);
    }

    /** Casas envolvidas em algum pré-lance enfileirado. */
    ehCasaDePreLance(casa: Casa): boolean {
        return (this.fila?.itens ?? []).some(p => p.from === casa || p.to === casa);
    }

    /**
     * As setas que o próprio jogador desenhou (botão direito), sem as de
     * pré-lance — essas viraram só o destaque azul nas casas
     * ({@link ehCasaDePreLance}), sem seta, para não competir visualmente com
     * as anotações de verdade do jogador.
     */
    get setasVisiveis(): Seta[] {
        const emCurso = this.setaEmCurso && this.setaEmCurso.de !== this.setaEmCurso.para
            ? [this.setaEmCurso] : [];
        return [...this.setas, ...emCurso];
    }

    /** Centro da casa em % — a origem das setas no SVG. */
    centro(casa: Casa): { x: number; y: number } {
        const p = this.posicao(casa);
        return { x: p.esquerda + 6.25, y: p.topo + 6.25 };
    }

    /**
     * Ponto final da seta, encurtado para a ponta não cobrir a peça de destino.
     */
    pontaDaSeta(seta: Seta): { x: number; y: number } {
        const de = this.centro(seta.de);
        const para = this.centro(seta.para);
        const dx = para.x - de.x;
        const dy = para.y - de.y;
        const distancia = Math.hypot(dx, dy) || 1;
        const recuo = 4;
        return {
            x: para.x - (dx / distancia) * recuo,
            y: para.y - (dy / distancia) * recuo,
        };
    }

    /** Peça sendo arrastada, para o template posicioná-la sob o cursor. */
    ehArrastada(peca: PecaDesenhada): boolean {
        return this.arrastando?.id === peca.id;
    }

    // -----------------------------------------------------------------------
    // Interação
    // -----------------------------------------------------------------------

    /** Qual casa está sob este ponto da tela. */
    private casaEm(clienteX: number, clienteY: number): Casa | null {
        const el = this.grade?.nativeElement;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const coluna = Math.floor(((clienteX - r.left) / r.width) * 8);
        const linha = Math.floor(((clienteY - r.top) / r.height) * 8);
        if (coluna < 0 || coluna > 7 || linha < 0 || linha > 7) return null;

        return this.orientacao === 'w'
            ? paraCasa(coluna, 7 - linha)
            : paraCasa(7 - coluna, linha);
    }

    private pontoNaGrade(clienteX: number, clienteY: number): { x: number; y: number } {
        const r = this.grade!.nativeElement.getBoundingClientRect();
        return { x: clienteX - r.left, y: clienteY - r.top };
    }

    onPointerDown(evento: PointerEvent): void {
        const casa = this.casaEm(evento.clientX, evento.clientY);
        if (!casa) return;

        // Botão direito: anotações do jogador (marca ou seta) — a MENOS que
        // haja pré-lances na fila, caso em que o botão direito os cancela em
        // vez de anotar, como no chess.com e no lichess. Enquanto a fila
        // existe, o jogador não desenha seta nem marca casa de vermelho.
        if (evento.button === 2) {
            evento.preventDefault();
            if (this.fila && !this.fila.vazia) {
                this.cancelarPreLances();
                return;
            }
            this.setaEmCurso = { de: casa, para: casa };
            this.grade?.nativeElement.setPointerCapture(evento.pointerId);
            return;
        }
        if (evento.button !== 0) return;

        // Clique esquerdo limpa as anotações, como no chess.com e no lichess.
        this.limparAnotacoes();

        if (this.promocaoPendente) return;

        // Segundo clique: tenta completar o lance escolhido antes.
        if (this.selecionada && this.selecionada !== casa && this.tentarLance(this.selecionada, casa)) {
            return;
        }
        if (this.selecionada === casa) {
            this.selecionada = null;
            return;
        }

        if (!this.podeSelecionar(casa)) {
            // Clicar numa peça do adversário (ou no vazio) desmarca.
            this.selecionada = null;
            return;
        }

        this.selecionada = casa;

        const peca = this.pecas.find(p => p.casa === casa);
        if (peca) {
            const ponto = this.pontoNaGrade(evento.clientX, evento.clientY);
            this.arrastando = { id: peca.id, origem: casa, x: ponto.x, y: ponto.y };
            this.grade?.nativeElement.setPointerCapture(evento.pointerId);
        }
    }

    onPointerMove(evento: PointerEvent): void {
        if (this.setaEmCurso) {
            const casa = this.casaEm(evento.clientX, evento.clientY);
            if (casa) this.setaEmCurso = { de: this.setaEmCurso.de, para: casa };
            return;
        }
        if (!this.arrastando) return;
        const ponto = this.pontoNaGrade(evento.clientX, evento.clientY);
        this.arrastando = { ...this.arrastando, x: ponto.x, y: ponto.y };
    }

    onPointerUp(evento: PointerEvent): void {
        if (this.setaEmCurso) {
            const seta = this.setaEmCurso;
            this.setaEmCurso = null;
            if (seta.de === seta.para) this.alternarMarca(seta.de);
            else this.alternarSeta(seta);
            return;
        }

        const arrasto = this.arrastando;
        this.arrastando = null;
        if (!arrasto) return;

        const destino = this.casaEm(evento.clientX, evento.clientY);
        if (!destino || destino === arrasto.origem) {
            // Soltou onde pegou: vira um clique, e a seleção continua de pé para o
            // jogador escolher o destino com um segundo clique.
            return;
        }
        if (this.tentarLance(arrasto.origem, destino)) return;

        // Destino inválido: solta a peça de volta e desmarca.
        this.selecionada = null;
    }

    onPointerCancel(): void {
        this.arrastando = null;
        this.setaEmCurso = null;
    }

    onContextMenu(evento: MouseEvent): void {
        evento.preventDefault();
    }

    private podeSelecionar(casa: Casa): boolean {
        if (this.podeJogar) return this.destinosLegais.has(casa);
        return this.fila?.podePreLancarDe(casa) ?? false;
    }

    /**
     * Tenta transformar origem+destino num lance (ou pré-lance).
     * @return true se virou alguma coisa — inclusive um pedido de promoção.
     */
    private tentarLance(origem: Casa, destino: Casa): boolean {
        if (this.podeJogar) {
            const candidatos = (this.destinosLegais.get(origem) ?? []).filter(l => l.to === destino);
            if (candidatos.length === 0) return false;

            this.selecionada = null;
            if (candidatos.some(l => l.promocao)) {
                this.promocaoPendente = { from: origem, to: destino, ehPreLance: false };
                return true;
            }
            this.lance.emit({ from: origem, to: destino });
            return true;
        }

        if (!this.fila?.destinosDe(origem).includes(destino)) return false;

        this.selecionada = null;
        if (this.fila.ehPromocao(origem, destino)) {
            this.promocaoPendente = { from: origem, to: destino, ehPreLance: true };
            return true;
        }
        this.preLanceEscolhido.emit({ from: origem, to: destino });
        return true;
    }

    escolherPromocao(peca: TipoPeca): void {
        const pendente = this.promocaoPendente;
        this.promocaoPendente = null;
        if (!pendente) return;

        const escolhido: LanceEscolhido = { from: pendente.from, to: pendente.to, promocao: peca };
        if (pendente.ehPreLance) this.preLanceEscolhido.emit(escolhido);
        else this.lance.emit(escolhido);
    }

    cancelarPromocao(): void {
        this.promocaoPendente = null;
        this.selecionada = null;
    }

    /** Cor da peça no seletor de promoção — a de quem está promovendo. */
    get corDaPromocao(): Cor {
        const origem = this.promocaoPendente?.from;
        const peca = origem ? this.ocupacaoAtual.get(origem) : null;
        return peca?.cor ?? this.orientacao;
    }

    cancelarPreLances(): void {
        this.preLancesCancelados.emit();
    }

    // -----------------------------------------------------------------------
    // Anotações do jogador
    // -----------------------------------------------------------------------

    private alternarMarca(casa: Casa): void {
        const novas = new Set(this.marcadas);
        if (!novas.delete(casa)) novas.add(casa);
        this.marcadas = novas;
    }

    private alternarSeta(seta: Seta): void {
        const existente = this.setas.findIndex(s => s.de === seta.de && s.para === seta.para);
        this.setas = existente >= 0
            ? this.setas.filter((_, i) => i !== existente)
            : [...this.setas, seta];
    }

    private limparAnotacoes(): void {
        if (this.marcadas.size > 0) this.marcadas = new Set();
        if (this.setas.length > 0) this.setas = [];
    }

    // -----------------------------------------------------------------------
    // Redimensionamento
    // -----------------------------------------------------------------------

    onRedimensionarInicio(evento: PointerEvent): void {
        evento.preventDefault();
        evento.stopPropagation();
        (evento.currentTarget as HTMLElement).setPointerCapture(evento.pointerId);
        this.redimensionando = {
            xInicial: evento.clientX,
            yInicial: evento.clientY,
            larguraInicial: this.tamanho,
        };
    }

    onRedimensionarMove(evento: PointerEvent): void {
        const arrasto = this.redimensionando;
        if (!arrasto) return;

        const dx = evento.clientX - arrasto.xInicial;
        const dy = evento.clientY - arrasto.yInicial;
        // Manda o eixo em que o jogador se moveu mais, para arrastar na diagonal
        // não sair pela metade da velocidade.
        const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
        const novo = Math.round(arrasto.larguraInicial + delta);

        this.tamanhoAlterado.emit(Math.max(TAMANHO_MINIMO, Math.min(TAMANHO_MAXIMO, novo)));
    }

    onRedimensionarFim(evento: PointerEvent): void {
        this.redimensionando = null;
        const alvo = evento.currentTarget as HTMLElement;
        if (alvo.hasPointerCapture(evento.pointerId)) alvo.releasePointerCapture(evento.pointerId);
    }

    // -----------------------------------------------------------------------

    protected readonly idDaPeca = (_: number, peca: PecaDesenhada) => peca.id;
    protected readonly idDaCasa = (_: number, casa: Casa) => casa;
    protected readonly idDaSeta = (_: number, seta: Seta) => seta.de + seta.para;
}
