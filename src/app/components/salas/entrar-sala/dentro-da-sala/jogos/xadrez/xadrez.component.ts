import {
    AfterViewChecked, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { Client } from '@stomp/stompjs';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';

import { WebSocketService } from '../../../../../../services/websocket/websocket.service';
import { AuthService } from '../../../../../../services/auth/auth.service';
import { XadrezService } from '../../../../../../services/xadrez/xadrez.service';
import { PartidaXadrezResumo, XadrezResponse } from '../../../../../../models/xadrez/XadrezResponse';
import { NoAutocompleteDirective } from '../../../../../../diretivas/no-autocomplete/no-autocomplete.directive';

import { LanceLegal, PartidaTabuleiro, casaDoReiEmXequeDeFen } from '../../../../../../services/xadrez/partida';
import { FilaPreLances } from '../../../../../../services/xadrez/pre-lance';
import { Casa, Cor, TipoPeca, VALOR_PECA, ocupacaoParaFenPecas } from '../../../../../../services/xadrez/tabuleiro';
import { LanceEscolhido, TabuleiroComponent } from './tabuleiro/tabuleiro.component';
import { NavegadorLancesComponent } from './navegador-lances/navegador-lances.component';

// Regex para notação INGLESA: K Q R B N (Rei, Dama, Torre, Bispo, Cavalo)
const SAN_CHARS_REGEX_INGLESA = /^[a-hKQRBNO1-8=+#x\-!?]*$/;

// Regex para notação PORTUGUESA: R D T B C (Rei, Dama, Torre, Bispo, Cavalo)
const SAN_CHARS_REGEX_PORTUGUESA = /^[a-hRDTBCO1-8=+#x\-!?]*$/;

const CHAVE_TAMANHO_TABULEIRO = 'xadrez_tamanho_tabuleiro';
const TAMANHO_TABULEIRO_PADRAO = 420;

/** Glifos usados na barra de peças capturadas. */
const GLIFOS: Record<TipoPeca, string> = {
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

@Component({
    selector: 'app-xadrez',
    standalone: true,
    imports: [FormsModule, NgIf, NgClass, NgFor, NoAutocompleteDirective,
        TabuleiroComponent, NavegadorLancesComponent],
    templateUrl: './xadrez.component.html',
    styleUrl: './xadrez.component.scss'
})
export class XadrezComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('pgnContainer') private pgnContainer?: ElementRef<HTMLDivElement>;
    private deveScrollarPgnParaFim: boolean = false;
    @Input() topic: string = '';
    @Input() app: string = '';
    @Input() stompClient: Client = new Client();
    @Input() jogadorDono: string = '';
    @Input() jogadorNomeSala: string = '';
    @Input() outrosJogadores: string[] = [];

    username: string = '';
    estado: XadrezResponse | null = null;

    // input de lance (só no modo às cegas)
    sanInput: string = '';
    enviandoLance: boolean = false;
    erroLance: string | null = null;
    avisoLance: string | null = null;

    // configuração (só dono)
    configurandoBrancas: string = '';
    configurandoPretas: string = '';
    configurandoNotacao: 'PORTUGUESA' | 'INGLESA' = 'INGLESA';
    configurandoModoVisual: boolean = true;
    private configuracaoInicializada: boolean = false;
    private configuracaoAlteradaManualmente: boolean = false;

    // configuração de tempo
    tempoInfinito: boolean = true;
    tempoBrancasMinutos: number | null = null;
    tempoBrancasSegundos: number | null = null;
    incrementoBrancas: number | null = null;
    tempoPretasMinutos: number | null = null;
    tempoPretasSegundos: number | null = null;
    incrementoPretas: number | null = null;

    private tempoConfiguracaoInicializada: boolean = false;
    private tempoConfiguracaoAlteradaManualmente: boolean = false;

    // controle do relógio em tempo real
    tempoRestanteBrancasAtual: number | null = null;
    tempoRestantePretasAtual: number | null = null;
    intervalRelogio: any = null;

    // ── Estado derivado do tabuleiro visual ──
    // São CAMPOS, e não getters: o tabuleiro compara referências em ngOnChanges,
    // e um getter devolveria um objeto novo a cada ciclo de detecção — a peça
    // selecionada seria descartada antes de o jogador conseguir soltá-la.
    partida: PartidaTabuleiro = PartidaTabuleiro.de([], 'INGLESA');
    destinosLegais = new Map<Casa, LanceLegal[]>();
    fila: FilaPreLances | null = null;
    ultimoLanceVisivel: { from: Casa; to: Casa } | null = null;
    casaXeque: Casa | null = null;
    fenVisivel: string = '';

    /** Lance sendo revisto. null = ao vivo, acompanhando a partida. */
    plyVisualizado: number | null = null;
    tamanhoTabuleiro: number = TAMANHO_TABULEIRO_PADRAO;
    /** Giro manual do tabuleiro; null = do lado em que o jogador joga. */
    private orientacaoManual: Cor | null = null;
    avisoPreLanceCancelado: boolean = false;
    private timerAvisoPreLance: any = null;

    /**
     * O MEU lance que acabei de mandar, mas o servidor ainda não confirmou.
     *
     * Existe só para a sensação de resposta instantânea: sem isto, a peça volta
     * pra casa de origem no instante em que o mouse solta (porque `fenVisivel`
     * ainda reflete a última posição confirmada) e só "anda de verdade" quando a
     * mensagem de volta chega — um efeito de "quicar" que qualquer lance sente,
     * mesmo numa rede rápida. Não é um pré-lance: não fica numa fila, é resolvido
     * num round-trip só, e volta sozinho ao estado confirmado se o servidor não
     * confirmar exatamente isto (ver os três lugares que chamam
     * `limparLanceOtimista`).
     */
    private lanceOtimista: { fen: string; from: Casa; to: Casa } | null = null;
    /** Rede de segurança: se a resposta nunca chegar, não fica preso pra sempre. */
    private timeoutLanceOtimista: any = null;

    // histórico expandido + paginação
    historicoExpandido: boolean = false;
    partidaCopiada: number | null = null;
    readonly HISTORICO_PAGE_SIZE = 3;
    readonly PGN_LANCES_LIMITE = 30;
    historicoPagina: number = 1;
    partidasExpandidas = new Set<number>();

    get totalPaginasHistorico(): number {
        return Math.ceil((this.estado?.historico?.length ?? 0) / this.HISTORICO_PAGE_SIZE);
    }

    get historicoPaginado(): PartidaXadrezResumo[] {
        const inicio = (this.historicoPagina - 1) * this.HISTORICO_PAGE_SIZE;
        return (this.estado?.historico ?? []).slice(inicio, inicio + this.HISTORICO_PAGE_SIZE);
    }

    paginaAnterior(): void {
        if (this.historicoPagina > 1) this.historicoPagina--;
    }

    proximaPagina(): void {
        if (this.historicoPagina < this.totalPaginasHistorico) this.historicoPagina++;
    }

    // Conta lances a partir do pgn quando lances[] não está disponível
    private contarLancesDoPgn(pgn: string): number {
        if (!pgn || pgn === '(sem lances)') return 0;
        return pgn.trim().split(/\s+/).filter(t => !/^\d+\.$/.test(t)).length;
    }

    totalLancesPublico(p: PartidaXadrezResumo): number {
        return this.totalLances(p);
    }

    private totalLances(p: PartidaXadrezResumo): number {
        return p.lances?.length ?? this.contarLancesDoPgn(p.pgn);
    }

    pgnTruncado(p: PartidaXadrezResumo): string {
        if (this.totalLances(p) <= this.PGN_LANCES_LIMITE || this.partidasExpandidas.has(p.id)) {
            return p.pgn;
        }
        if (p.lances?.length) {
            // Reconstrói o PGN só com os primeiros N lances
            const lancesVisiveis = p.lances.slice(0, this.PGN_LANCES_LIMITE);
            const linhas: string[] = [];
            for (let i = 0; i < lancesVisiveis.length; i += 2) {
                const num = i / 2 + 1;
                const brancas = lancesVisiveis[i];
                const pretas = lancesVisiveis[i + 1] ?? '';
                linhas.push(`${num}. ${brancas}${pretas ? ' ' + pretas : ''}`);
            }
            return linhas.join('  ') + '...';
        }
        // Sem lances[], trunca o pgn por tokens
        const tokens = p.pgn.trim().split(/\s+/);
        const resultado: string[] = [];
        let lancesContados = 0;
        for (const token of tokens) {
            resultado.push(token);
            if (!/^\d+\.$/.test(token)) {
                lancesContados++;
                if (lancesContados >= this.PGN_LANCES_LIMITE) break;
            }
        }
        return resultado.join(' ') + '...';
    }

    precisaTruncar(p: PartidaXadrezResumo): boolean {
        return this.totalLances(p) > this.PGN_LANCES_LIMITE && !this.partidasExpandidas.has(p.id);
    }

    estaExpandido(p: PartidaXadrezResumo): boolean {
        return this.totalLances(p) > this.PGN_LANCES_LIMITE && this.partidasExpandidas.has(p.id);
    }

    togglePgn(id: number): void {
        if (this.partidasExpandidas.has(id)) {
            this.partidasExpandidas.delete(id);
        } else {
            this.partidasExpandidas.add(id);
        }
    }

    // modais de confirmação
    modalDesistir: boolean = false;
    modalEmpate: boolean = false;
    modalConfiguracao: boolean = false;

    // modal de informações de tempo
    modalInfo: boolean = false;
    partidaInfoSelecionada: PartidaXadrezResumo | null = null;

    // subscrição de erros
    private erroSubscription: any = null;
    private xadrezSubscription: any = null;

    private normalizarAvisoNotacao(msg: string): string {
        if (!msg) return msg;

        let texto = msg;

        // Remove a parte explicativa do backend (UI já tem dica fixa)
        const idxUseSan = texto.toLowerCase().indexOf('. use san');
        if (idxUseSan >= 0) {
            texto = texto.slice(0, idxUseSan + 1);
        }

        // Remove status code se vier no texto
        const idxStatus = texto.toLowerCase().indexOf('status code');
        if (idxStatus >= 0) {
            texto = texto.slice(0, idxStatus).trim();
        }

        return texto.trim();
    }

    // áudio de notificação
    private audioNotificacao: HTMLAudioElement | null = null;
    private _notificacoesSonorasAtivadas: boolean = true;

    get notificacoesSonorasAtivadas(): boolean {
        return this._notificacoesSonorasAtivadas;
    }

    set notificacoesSonorasAtivadas(value: boolean) {
        this._notificacoesSonorasAtivadas = value;
        this.authService.saveStorage('xadrez_notificacoes_sonoras', JSON.stringify(value));
    }

    constructor(private websocketService: WebSocketService, private authService: AuthService, private xadrezService: XadrezService) {
        this.username = authService.getStorage('username')!;
        // Inicializa o áudio de notificação
        this.audioNotificacao = new Audio('notificacao.wav');

        // Carrega preferência de notificações do localStorage
        const notificacoesSalvas = this.authService.getStorage('xadrez_notificacoes_sonoras');
        if (notificacoesSalvas !== null) {
            this._notificacoesSonorasAtivadas = JSON.parse(notificacoesSalvas);
        }

        const tamanhoSalvo = Number(this.authService.getStorage(CHAVE_TAMANHO_TABULEIRO));
        if (Number.isFinite(tamanhoSalvo) && tamanhoSalvo > 0) {
            this.tamanhoTabuleiro = tamanhoSalvo;
        }
    }

    ngAfterViewChecked(): void {
        if (!this.deveScrollarPgnParaFim) return;
        const el = this.pgnContainer?.nativeElement;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        this.deveScrollarPgnParaFim = false;
    }

    private solicitarScrollPgnParaFim(): void {
        this.deveScrollarPgnParaFim = true;
    }

    private ultimaPartidaDoHistorico(): PartidaXadrezResumo | null {
        const historico = this.estado?.historico ?? [];
        if (historico.length === 0) return null;

        // Mais seguro do que assumir ordem: pega o maior id
        return historico.reduce((acc, cur) => (cur.id > acc.id ? cur : acc));
    }

    private aplicarDefaultsConfiguracao(): void {
        if (!this.estado) return;
        if (!this.ehDono) return;
        if (this.estado.partidaEmAndamento) return;

        const jogadores = this.jogadores;
        if (jogadores.length === 0) return;

        // Se só tem o dono, ambos ficam no dono
        if (jogadores.length === 1) {
            this.configurandoBrancas = jogadores[0];
            this.configurandoPretas = jogadores[0];
            this.configuracaoInicializada = true;
            return;
        }

        const valoresAtuaisValidos =
            jogadores.includes(this.configurandoBrancas) && jogadores.includes(this.configurandoPretas);

        // Não sobrescreve escolhas do dono, a menos que esteja vazio/ inválido
        if (this.configuracaoInicializada && this.configuracaoAlteradaManualmente && valoresAtuaisValidos) {
            return;
        }

        const ultima = this.ultimaPartidaDoHistorico();

        let brancasSugeridas: string | null = null;
        let pretasSugeridas: string | null = null;

        // Sugere invertido em relação à última partida
        if (ultima?.usernameBrancas && ultima?.usernamePretas) {
            brancasSugeridas = ultima.usernamePretas;
            pretasSugeridas = ultima.usernameBrancas;
        }

        // Fallback: dono de brancas, primeiro outro de pretas
        if (!brancasSugeridas || !jogadores.includes(brancasSugeridas)) {
            brancasSugeridas = this.jogadorDono;
        }

        if (!pretasSugeridas || !jogadores.includes(pretasSugeridas)) {
            pretasSugeridas = jogadores.find(j => j !== brancasSugeridas) ?? this.jogadorDono;
        }

        this.configurandoBrancas = brancasSugeridas;
        this.configurandoPretas = pretasSugeridas;
        this.configuracaoInicializada = true;
        this.configuracaoAlteradaManualmente = false;

        // Repete o modo da última partida da sala — trocar de modo é a exceção,
        // não a regra.
        if (ultima?.modoVisual !== null && ultima?.modoVisual !== undefined) {
            this.configurandoModoVisual = ultima.modoVisual;
        } else if (this.estado.modoVisual !== null) {
            this.configurandoModoVisual = this.estado.modoVisual;
        }

        this.aplicarDefaultsTempo();
    }

    private segundosParaMinSeg(total: number | null): { min: number | null; seg: number | null } {
        if (total === null || total === undefined) return { min: null, seg: null };
        const t = Math.max(0, Math.floor(total));
        return { min: Math.floor(t / 60), seg: t % 60 };
    }

    private aplicarDefaultsTempo(): void {
        if (!this.estado) return;
        if (!this.ehDono) return;
        if (this.estado.partidaEmAndamento) return;

        // Não sobrescreve se o dono já mexeu
        if (this.tempoConfiguracaoInicializada && this.tempoConfiguracaoAlteradaManualmente) {
            return;
        }

        const ultima = this.ultimaPartidaDoHistorico();

        // Se não tiver histórico, mantém o default atual
        if (!ultima) {
            this.tempoConfiguracaoInicializada = true;
            return;
        }

        const semTempo = ultima.tempoInicialBrancas === null && ultima.tempoInicialPretas === null;
        if (semTempo) {
            this.tempoInfinito = true;
            this.onTempoInfinitoChange();
            this.tempoConfiguracaoInicializada = true;
            this.tempoConfiguracaoAlteradaManualmente = false;
            return;
        }

        this.tempoInfinito = false;

        const tempoBaseBrancas = ultima.tempoInicialBrancas ?? ultima.tempoInicialPretas;
        const tempoBasePretas = ultima.tempoInicialPretas ?? ultima.tempoInicialBrancas;

        const brancas = this.segundosParaMinSeg(tempoBaseBrancas);
        const pretas = this.segundosParaMinSeg(tempoBasePretas);

        this.tempoBrancasMinutos = brancas.min;
        this.tempoBrancasSegundos = brancas.seg;
        this.incrementoBrancas = ultima.incrementoBrancas ?? ultima.incrementoPretas;

        this.tempoPretasMinutos = pretas.min;
        this.tempoPretasSegundos = pretas.seg;
        this.incrementoPretas = ultima.incrementoPretas ?? ultima.incrementoBrancas;

        this.tempoConfiguracaoInicializada = true;
        this.tempoConfiguracaoAlteradaManualmente = false;
    }

    onConfigManualChange(): void {
        this.configuracaoAlteradaManualmente = true;
    }

    onTempoManualChange(): void {
        this.tempoConfiguracaoAlteradaManualmente = true;
    }

    get motivoNaoPodeIniciarPartida(): string | null {
        const jogadores = this.jogadores;
        if (!this.configurandoBrancas || !this.configurandoPretas) {
            return 'Selecione os jogadores de brancas e pretas.';
        }
        if (!jogadores.includes(this.configurandoBrancas) || !jogadores.includes(this.configurandoPretas)) {
            return 'Jogador selecionado não está na sala.';
        }
        if (this.configurandoBrancas === this.configurandoPretas) {
            return 'Brancas e pretas não podem ser o mesmo usuário.';
        }
        return null;
    }

    get podeIniciarPartida(): boolean {
        return this.motivoNaoPodeIniciarPartida === null;
    }

    ngOnInit(): void {
        // Carrega estado inicial via HTTP
        this.xadrezService.mostrar(this.jogadorDono, this.jogadorNomeSala).subscribe({
            next: (estado) => {
                this.estado = estado;
                this.recalcularDerivados();
                this.aplicarDefaultsConfiguracao();

                // Se já existe PGN/lances (reload com partida em andamento), rola pro fim
                if ((estado.lances?.length ?? 0) > 0) {
                    this.solicitarScrollPgnParaFim();
                }
                // Inicia o relógio se a partida já estiver em andamento (ex: reload da página)
                if (estado.partidaEmAndamento) {
                    this.iniciarRelogio();
                }
            },
            error: (err) => { console.error('Erro ao carregar xadrez:', err); }
        });

        // Recebe atualizações em tempo real via WebSocket
        this.xadrezSubscription = this.websocketService.subscribe(this.stompClient, this.topic + '/xadrez', (msg: XadrezResponse) => {
            // Verifica se agora é minha vez (significa que o oponente acabou de jogar)
            const agoraEhMinhaVez = msg.partidaEmAndamento && (
                msg.vezDasBrancas
                    ? this.username === msg.usernameBrancas
                    : this.username === msg.usernamePretas
            );

            const lancesNovos = (msg.lances?.length ?? 0) !== (this.estado?.lances?.length ?? 0);
            // Qualquer mensagem confirmada do servidor é mais atual do que meu
            // palpite otimista — se o lance realmente aconteceu, a posição
            // confirmada já mostra a mesma coisa; se não aconteceu (corrida rara
            // com outro evento), ela mostra a verdade em vez do meu palpite.
            this.limparLanceOtimista();
            this.estado = msg;
            this.enviandoLance = false;

            // Quem estava revendo o passado continua onde estava; quem estava ao
            // vivo continua ao vivo. É o mesmo critério do chess.com.
            if (msg.evento === 'PARTIDA_INICIADA' || msg.evento === 'FIM') {
                this.plyVisualizado = null;
            }
            this.recalcularDerivados();

            if (msg.preLancesCancelados) {
                this.mostrarAvisoPreLanceCancelado();
            }

            if (msg.evento === 'LANCE' && lancesNovos) {
                this.solicitarScrollPgnParaFim();
            }

            // Toca som quando o oponente faz um lance (agora é minha vez após o lance dele)
            if (msg.evento === 'LANCE' && agoraEhMinhaVez) {
                this.tocarSomNotificacao();
            }

            // Limpa erro e input apenas em eventos específicos e quando for minha vez
            if (msg.evento === 'LANCE' && agoraEhMinhaVez) {
                this.erroLance = null;
                this.avisoLance = null;
                // Não limpa o input para permitir que o jogador prepare o próximo lance
            }

            if (msg.evento === 'FIM' || msg.evento === 'PARTIDA_INICIADA') {
                this.erroLance = null;
                this.avisoLance = null;
                this.sanInput = '';
            }

            if (msg.evento === 'FIM') {
                this.historicoPagina = 1; // volta para a primeira página (mais recente) ao terminar partida
                this.pararRelogio();
            }
            if (msg.evento === 'LANCE_ILEGAL') {
                // Verifica se o lance ilegal foi feito por mim (a vez não muda após lance ilegal)
                const lanceIlegalFoiMeu = msg.vezDasBrancas
                    ? this.username === msg.usernameBrancas
                    : this.username === msg.usernamePretas;
                if (lanceIlegalFoiMeu) {
                    this.erroLance = 'Lance ilegal na posição atual. +1 lance ilegal contabilizado.';
                    this.avisoLance = null;
                    this.sanInput = '';
                }
            }

            // Inicia/atualiza o relógio quando há um lance ou partida iniciada
            if (msg.evento === 'LANCE' || msg.evento === 'PARTIDA_INICIADA') {
                this.iniciarRelogio();
            }

            // Se a partida não está em andamento, atualiza defaults (sem sobrescrever escolhas manuais)
            if (!this.estado.partidaEmAndamento) {
                this.aplicarDefaultsConfiguracao();
            }
        });

        // Subscreve no tópico de erros WebSocket para capturar mensagens de aviso
        this.erroSubscription = this.websocketService.subscribe(
            this.stompClient,
            `/topic/${this.username}/erro`,
            (err: any) => {
                // O servidor recusou o lance que eu já tinha certeza que ia dar
                // certo (desync de rede — o tabuleiro estava mostrando algo
                // diferente do que o servidor via). Sem toast, sem banner: a
                // peça só volta pro lugar de verdade, como um pré-lance que não
                // colou.
                if (this.lanceOtimista) {
                    this.limparLanceOtimista();
                    this.recalcularDerivados();
                }

                if (err?.error) {
                    const msg = err.error as string;
                    // Verifica se é um erro de notação inválida ou caracteres inválidos (não contabilizado)
                    const ehNotacaoInvalida = msg.toLowerCase().includes('notação inválida')
                        || msg.toLowerCase().includes('caracteres inválidos');
                    if (ehNotacaoInvalida) {
                        this.avisoLance = this.normalizarAvisoNotacao(msg);
                        this.erroLance = null;
                        this.enviandoLance = false;
                    }
                }
            },
            { handleErrorsGlobally: false }
        );
    }

    ngOnDestroy(): void {
        this.pararRelogio();
        clearTimeout(this.timerAvisoPreLance);
        clearTimeout(this.timeoutLanceOtimista);
        this.xadrezSubscription?.unsubscribe?.();
        this.erroSubscription?.unsubscribe?.();
        this.xadrezSubscription = null;
        this.erroSubscription = null;
    }

    // =========================================================================
    // Modo visual
    // =========================================================================

    get modoVisual(): boolean {
        return this.estado?.modoVisual === true;
    }

    /** Quantos lances estão sendo exibidos. */
    get ply(): number {
        return Math.min(this.plyVisualizado ?? this.partida.totalLances, this.partida.totalLances);
    }

    get vendoHistorico(): boolean {
        return this.ply < this.partida.totalLances;
    }

    get minhaCor(): Cor | null {
        if (this.meuLado === 'BRANCAS') return 'w';
        if (this.meuLado === 'PRETAS') return 'b';
        return null;
    }

    get orientacao(): Cor {
        return this.orientacaoManual ?? this.minhaCor ?? 'w';
    }

    girarTabuleiro(): void {
        this.orientacaoManual = this.orientacao === 'w' ? 'b' : 'w';
    }

    /**
     * Recalcula tudo o que o tabuleiro consome a partir do estado do servidor.
     *
     * Reconstruir a partida inteira aqui, em vez de aplicar o último lance sobre
     * o que já estava desenhado, é o que impede a tela de divergir do servidor:
     * um lance perdido ou repetido pelo WebSocket se corrige sozinho na próxima
     * mensagem, em vez de deixar uma peça no lugar errado até o fim da partida.
     */
    private recalcularDerivados(): void {
        this.partida = PartidaTabuleiro.de(this.estado?.lances ?? [], this.estado?.notacao ?? 'INGLESA');

        const ply = this.ply;
        const emAndamento = !!this.estado?.partidaEmAndamento;
        const souJogador = this.minhaCor !== null;

        // Meu próprio lance, mandado mas ainda não confirmado: mostra ele já
        // feito, sem esperar a rede. Só vale enquanto se está olhando a posição
        // AO VIVO — se o jogador foi rever o histórico nesse meio-tempo, o
        // overlay continua guardado (ver limparLanceOtimista), só não aparece
        // aqui até ele voltar pro presente.
        if (this.lanceOtimista && !this.vendoHistorico) {
            this.fenVisivel = this.lanceOtimista.fen;
            this.ultimoLanceVisivel = { from: this.lanceOtimista.from, to: this.lanceOtimista.to };
            this.casaXeque = casaDoReiEmXequeDeFen(this.lanceOtimista.fen);
            // Já joguei; não é a vez de jogar de novo nem de pré-lançar.
            this.destinosLegais = new Map();
            this.fila = null;
            return;
        }

        this.fenVisivel = this.partida.fenNoLance(ply);

        const lance = this.partida.lanceNoLance(ply);
        this.ultimoLanceVisivel = lance ? { from: lance.from, to: lance.to } : null;

        // O xeque descreve a posição EXIBIDA; ao vivo, vem da partida atual.
        this.casaXeque = this.vendoHistorico
            ? (lance?.xeque ? this.casaDoReiEm(ply) : null)
            : this.partida.casaDoReiEmXeque;

        // Só entrega lances legais quando o jogador pode mesmo jogar: o tabuleiro
        // usa "a lista está vazia" como sinal de somente-leitura.
        this.destinosLegais = (emAndamento && souJogador && this.minhaVez && !this.vendoHistorico)
            ? this.partida.destinosLegaisPorOrigem()
            : new Map();

        // A fila só existe enquanto é a vez do adversário.
        this.fila = (emAndamento && souJogador && !this.minhaVez && !this.vendoHistorico)
            ? FilaPreLances.restaurar(this.partida.fenAtual, this.minhaCor!, this.estado?.meusPreLances ?? [])
            : null;

        // Enquanto há pré-lances enfileirados, o tabuleiro mostra a posição
        // PROJETADA (como se todos já tivessem sido jogados) — é a peça já
        // aparecendo no destino final, e não só a casa de origem destacada.
        if (this.fila && !this.fila.vazia) {
            this.fenVisivel = ocupacaoParaFenPecas(this.fila.ocupacaoProjetada) + ' w - - 0 1';
            // Essa posição é uma hipótese geométrica, não uma sequência de
            // lances validada: xeque nela seria ruído, não informação.
            this.casaXeque = null;
        }
    }

    private casaDoReiEm(ply: number): Casa | null {
        const parcial = PartidaTabuleiro.de(
            (this.estado?.lances ?? []).slice(0, ply), this.estado?.notacao ?? 'INGLESA');
        return parcial.casaDoReiEmXeque;
    }

    // ── Lances vindos do tabuleiro ──

    onLanceDoTabuleiro(lance: LanceEscolhido): void {
        // `this.lanceOtimista` bloqueia reenvio: com o primeiro lance já em
        // trânsito, um segundo clique não pode disparar outro antes de saber se
        // o primeiro colou.
        if (!this.minhaVez || this.vendoHistorico || this.lanceOtimista) return;
        this.erroLance = null;

        const fen = this.partida.tentarLanceOtimista(lance.from, lance.to, lance.promocao);
        if (fen) {
            this.lanceOtimista = { fen, from: lance.from, to: lance.to };
            this.recalcularDerivados();
            this.armarTimeoutLanceOtimista();
        }

        this.websocketService.sendMessage(
            this.stompClient,
            this.app + '/xadrez/lance',
            JSON.stringify({ from: lance.from, to: lance.to, promocao: lance.promocao ?? null })
        );
    }

    /**
     * Descarta o overlay otimista, sem recalcular nada — quem chama decide se
     * (e quando) chamar `recalcularDerivados()` depois. Separado para o caso
     * mais comum (uma mensagem confirmada acabou de chegar) poder reusar o
     * `recalcularDerivados()` que já ia rodar de qualquer jeito, em vez de
     * calcular tudo duas vezes.
     */
    private limparLanceOtimista(): void {
        this.lanceOtimista = null;
        clearTimeout(this.timeoutLanceOtimista);
        this.timeoutLanceOtimista = null;
    }

    private armarTimeoutLanceOtimista(): void {
        clearTimeout(this.timeoutLanceOtimista);
        this.timeoutLanceOtimista = setTimeout(() => {
            // Se ainda está aqui depois desse tempo todo, a resposta se perdeu —
            // melhor voltar pro estado confirmado do que fingir pra sempre que
            // aquele lance aconteceu.
            this.limparLanceOtimista();
            this.recalcularDerivados();
        }, 8000);
    }

    onPreLanceDoTabuleiro(lance: LanceEscolhido): void {
        if (!this.fila) return;
        const nova = this.fila.enfileirar(lance);
        // `enfileirar` devolve a mesma instância quando recusa o pedido.
        if (nova === this.fila) return;

        // Otimista: a fila aparece na tela antes da confirmação do servidor, que
        // é justamente o ponto do pré-lance — nada deve esperar a rede.
        this.fila = nova;
        this.enviarFilaDePreLances();
    }

    onCancelarPreLances(): void {
        if (!this.fila || this.fila.vazia) return;
        this.fila = this.fila.limpar();
        this.websocketService.sendMessage(
            this.stompClient, this.app + '/xadrez/cancelar-pre-lances', '');
    }

    private enviarFilaDePreLances(): void {
        const itens = (this.fila?.itens ?? []).map(p => ({
            from: p.from, to: p.to, promocao: p.promocao ?? null,
        }));
        // Manda a fila INTEIRA, e não o acréscimo: assim um pacote repetido ou
        // fora de ordem não consegue embaralhar a fila do lado do servidor.
        this.websocketService.sendMessage(
            this.stompClient, this.app + '/xadrez/pre-lances', JSON.stringify({ fila: itens }));
    }

    private mostrarAvisoPreLanceCancelado(): void {
        this.avisoPreLanceCancelado = true;
        clearTimeout(this.timerAvisoPreLance);
        this.timerAvisoPreLance = setTimeout(() => this.avisoPreLanceCancelado = false, 4000);
    }

    onTamanhoTabuleiro(tamanho: number): void {
        this.tamanhoTabuleiro = tamanho;
        this.authService.saveStorage(CHAVE_TAMANHO_TABULEIRO, String(tamanho));
    }

    // ── Navegação pelos lances ──

    irParaPly(n: number): void {
        const alvo = Math.max(0, Math.min(this.partida.totalLances, n));
        // `null` quando chega ao fim: assim um lance novo do adversário puxa quem
        // está ao vivo junto, em vez de deixá-lo preso num ply antigo.
        this.plyVisualizado = alvo >= this.partida.totalLances ? null : alvo;
        this.recalcularDerivados();
    }

    irParaPrimeiro(): void { this.irParaPly(0); }
    irParaAnterior(): void { this.irParaPly(this.ply - 1); }
    irParaProximo(): void { this.irParaPly(this.ply + 1); }
    irParaUltimo(): void { this.irParaPly(this.partida.totalLances); }

    @HostListener('window:keydown', ['$event'])
    onTeclado(evento: KeyboardEvent): void {
        if (!this.modoVisual) return;
        if (evento.ctrlKey || evento.metaKey || evento.altKey) return;

        // Não sequestrar as setas de quem está digitando (o chat fica ao lado).
        const alvo = evento.target as HTMLElement | null;
        if (alvo && (alvo.isContentEditable
            || ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName))) return;

        switch (evento.key) {
            case 'ArrowLeft': evento.preventDefault(); this.irParaAnterior(); break;
            case 'ArrowRight': evento.preventDefault(); this.irParaProximo(); break;
            case 'Home': evento.preventDefault(); this.irParaPrimeiro(); break;
            case 'End': evento.preventDefault(); this.irParaUltimo(); break;
        }
    }

    // ── Material capturado ──

    glifo(peca: TipoPeca): string {
        return GLIFOS[peca];
    }

    /** Peças que este lado capturou, da mais valiosa para a menos. */
    capturadasPor(cor: Cor): TipoPeca[] {
        const material = this.partida.materialNoLance(this.ply);
        const pecas = cor === 'w' ? material.capturadasPelasBrancas : material.capturadasPelasPretas;
        return [...pecas].sort((a, b) => VALOR_PECA[b] - VALOR_PECA[a]);
    }

    /** Vantagem material deste lado, ou 0 quando não está na frente. */
    vantagemDe(cor: Cor): number {
        const saldo = this.partida.materialNoLance(this.ply).saldo;
        const meu = cor === 'w' ? saldo : -saldo;
        return meu > 0 ? meu : 0;
    }

    // =========================================================================

    get jogadores(): string[] {
        return [this.jogadorDono, ...this.outrosJogadores];
    }

    get ehDono(): boolean {
        return this.username === this.jogadorDono;
    }

    get minhaVez(): boolean {
        if (!this.estado?.partidaEmAndamento) return false;
        const vezBrancas = this.estado.vezDasBrancas;
        return vezBrancas
            ? this.username === this.estado.usernameBrancas
            : this.username === this.estado.usernamePretas;
    }

    get meuLado(): string | null {
        if (!this.estado) return null;
        if (this.username === this.estado.usernameBrancas) return 'BRANCAS';
        if (this.username === this.estado.usernamePretas) return 'PRETAS';
        return null;
    }

    get pgnFormatado(): string[] {
        const lances = this.estado?.lances ?? [];
        const linhas: string[] = [];
        for (let i = 0; i < lances.length; i += 2) {
            const num = i / 2 + 1;
            const brancas = lances[i];
            const pretas = lances[i + 1] ?? '';
            linhas.push(`${num}. ${brancas}${pretas ? ' ' + pretas : ''}`);
        }
        return linhas;
    }

    get resultadoTexto(): string {
        if (!this.estado?.resultado || this.estado.resultado === 'EM_ANDAMENTO') return '';
        const map: Record<string, string> = {
            VITORIA_BRANCAS: '⬜ Brancas vencem',
            VITORIA_PRETAS: '⬛ Pretas vencem',
            EMPATE: '½-½ Empate',
        };
        const motivos: Record<string, string> = {
            XEQUE_MATE: 'por xeque-mate',
            DESISTENCIA: 'por desistência',
            AFOGAMENTO: 'por afogamento',
            ACORDO_MUTUO: 'por acordo mútuo',
            REPETICAO_TRIPLA: 'por repetição tripla',
            CINQUENTA_LANCES: 'pela regra dos 50 lances',
            MATERIAL_INSUFICIENTE: 'por material insuficiente',
            TEMPO_ESGOTADO: 'por tempo esgotado',
            TEMPO_ESGOTADO_MATERIAL_INSUFICIENTE: 'por tempo esgotado com material insuficiente',
        };
        const r = map[this.estado.resultado] ?? this.estado.resultado;
        const m = this.estado.motivo ? ` ${motivos[this.estado.motivo] ?? this.estado.motivo}` : '';
        return r + m;
    }

    // --- Validação de input ---
    onSanInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const valor = input.value;

        // Escolhe o regex baseado na notação configurada
        const regex = this.estado?.notacao === 'PORTUGUESA'
            ? SAN_CHARS_REGEX_PORTUGUESA
            : SAN_CHARS_REGEX_INGLESA;

        const caracteresPermitidos = this.estado?.notacao === 'PORTUGUESA'
            ? /[^a-hRDTBCO1-8=+#x\-!?]/g
            : /[^a-hKQRBNO1-8=+#x\-!?]/g;

        if (!regex.test(valor)) {
            input.value = valor.replace(caracteresPermitidos, '');
            this.sanInput = input.value;
        }
    }

    // --- Ações ---
    enviarLance(): void {
        if (!this.sanInput.trim() || this.enviandoLance || !this.minhaVez) return;
        this.enviandoLance = true;
        this.erroLance = null;
        this.websocketService.sendMessage(
            this.stompClient,
            this.app + '/xadrez/lance',
            JSON.stringify({ san: this.sanInput.trim() })
        );
        // Limpa o input imediatamente após enviar
        this.sanInput = '';
    }

    configurarEIniciar(): void {
        if (!this.podeIniciarPartida) return;
        this.websocketService.sendMessage(
            this.stompClient,
            this.app + '/xadrez/configurar-e-iniciar',
            JSON.stringify({
                usernameBrancas: this.configurandoBrancas,
                usernamePretas: this.configurandoPretas,
                notacao: this.configurandoNotacao,
                modoVisual: this.configurandoModoVisual,
                tempoInicialBrancasMinutos: this.tempoInfinito ? null : this.tempoBrancasMinutos,
                tempoInicialBrancasSegundos: this.tempoInfinito ? null : this.tempoBrancasSegundos,
                incrementoBrancasSegundos: this.tempoInfinito ? null : this.incrementoBrancas,
                tempoInicialPretasMinutos: this.tempoInfinito ? null : this.tempoPretasMinutos,
                tempoInicialPretasSegundos: this.tempoInfinito ? null : this.tempoPretasSegundos,
                incrementoPretasSegundos: this.tempoInfinito ? null : this.incrementoPretas,
            })
        );
    }

    onTempoInfinitoChange(): void {
        if (this.tempoInfinito) {
            // Limpa os campos quando marca tempo infinito
            this.tempoBrancasMinutos = null;
            this.tempoBrancasSegundos = null;
            this.incrementoBrancas = null;
            this.tempoPretasMinutos = null;
            this.tempoPretasSegundos = null;
            this.incrementoPretas = null;
        }
    }

    copiarTempoDasBrancas(): void {
        this.onTempoManualChange();
        this.tempoPretasMinutos = this.tempoBrancasMinutos;
        this.tempoPretasSegundos = this.tempoBrancasSegundos;
        this.incrementoPretas = this.incrementoBrancas;
    }

    configurar(): void {
        this.websocketService.sendMessage(
            this.stompClient,
            this.app + '/xadrez/configurar',
            JSON.stringify({
                usernameBrancas: this.configurandoBrancas,
                usernamePretas: this.configurandoPretas,
                notacao: this.configurandoNotacao,
                modoVisual: this.configurandoModoVisual,
            })
        );
    }

    iniciarPartida(): void {
        this.websocketService.sendMessage(this.stompClient, this.app + '/xadrez/iniciar', '');
    }

    desistir(): void {
        this.modalDesistir = false;
        this.websocketService.sendMessage(this.stompClient, this.app + '/xadrez/desistir', '');
    }

    proporEmpate(): void {
        this.modalEmpate = false;
        this.websocketService.sendMessage(this.stompClient, this.app + '/xadrez/propor-empate', '');
    }

    responderEmpate(aceitar: boolean): void {
        this.websocketService.sendMessage(
            this.stompClient,
            this.app + '/xadrez/responder-empate',
            JSON.stringify({ aceitar })
        );
    }

    copiarPgn(partida: PartidaXadrezResumo): void {
        navigator.clipboard.writeText(partida.pgn).then(() => {
            this.partidaCopiada = partida.id;
            setTimeout(() => this.partidaCopiada = null, 2000);
        });
    }

    onKeyEnter(event: KeyboardEvent): void {
        if (event.key === 'Enter') this.enviarLance();
    }

    private tocarSomNotificacao(): void {
        if (this.notificacoesSonorasAtivadas && this.audioNotificacao) {
            this.audioNotificacao.currentTime = 0;
            this.audioNotificacao.play().catch(err => {
                console.warn('Não foi possível tocar o som de notificação:', err);
            });
        }
    }

    formatarTempo(segundos: number | null): string {
        if (segundos === null) return '∞';
        const min = Math.floor(segundos / 60);
        const seg = Math.floor(segundos % 60);
        return `${min}:${seg.toString().padStart(2, '0')}`;
    }

    iniciarRelogio(): void {
        this.pararRelogio(); // Para qualquer relógio anterior

        if (!this.estado?.partidaEmAndamento) return;
        if (this.estado.tempoRestanteBrancas === null && this.estado.tempoRestantePretas === null) return;

        // Atualiza o relógio a cada 100ms para maior precisão
        this.intervalRelogio = setInterval(() => {
            if (!this.estado?.partidaEmAndamento) {
                this.pararRelogio();
                return;
            }

            // Recalcula o tempo baseado no timestamp do backend
            const agora = Date.now();
            const timestampUltimoLance = this.estado.timestampUltimoLance ?? agora;
            const tempoDecorrido = (agora - timestampUltimoLance) / 1000; // em segundos

            // Atualiza o tempo do jogador atual baseado no tempo do backend
            if (this.estado.vezDasBrancas && this.estado.tempoRestanteBrancas !== null) {
                this.tempoRestanteBrancasAtual = Math.max(0, this.estado.tempoRestanteBrancas - tempoDecorrido);
                this.tempoRestantePretasAtual = this.estado.tempoRestantePretas;
            } else if (!this.estado.vezDasBrancas && this.estado.tempoRestantePretas !== null) {
                this.tempoRestantePretasAtual = Math.max(0, this.estado.tempoRestantePretas - tempoDecorrido);
                this.tempoRestanteBrancasAtual = this.estado.tempoRestanteBrancas;
            } else {
                this.tempoRestanteBrancasAtual = this.estado.tempoRestanteBrancas;
                this.tempoRestantePretasAtual = this.estado.tempoRestantePretas;
            }
        }, 100);
    }

    pararRelogio(): void {
        if (this.intervalRelogio) {
            clearInterval(this.intervalRelogio);
            this.intervalRelogio = null;
        }
    }

    abrirModalInfo(partida: PartidaXadrezResumo): void {
        this.partidaInfoSelecionada = partida;
        this.modalInfo = true;
    }

    fecharModalInfo(): void {
        this.modalInfo = false;
        this.partidaInfoSelecionada = null;
    }

    formatarTempoInfo(segundos: number | null): string {
        if (segundos === null) return 'Infinito';
        const min = Math.floor(segundos / 60);
        const seg = Math.floor(segundos % 60);
        if (min > 0 && seg > 0) {
            return `${min} min ${seg} seg`;
        } else if (min > 0) {
            return `${min} min`;
        } else {
            return `${seg} seg`;
        }
    }

    formatarIncrementoInfo(segundos: number | null): string {
        if (segundos === null || segundos === 0) return 'Sem incremento';
        return `+${segundos} seg/lance`;
    }
}
