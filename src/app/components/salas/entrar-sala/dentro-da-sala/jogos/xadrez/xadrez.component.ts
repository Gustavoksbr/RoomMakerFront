import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { WebSocketService } from '../../../../../../services/websocket/websocket.service';
import { AuthService } from '../../../../../../services/auth/auth.service';
import { XadrezService } from '../../../../../../services/xadrez/xadrez.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { XadrezResponse, PartidaXadrezResumo } from '../../../../../../models/xadrez/XadrezResponse';
import { NoAutocompleteDirective } from '../../../../../../diretivas/no-autocomplete/no-autocomplete.directive';

// Regex para notação INGLESA: K Q R B N (Rei, Dama, Torre, Bispo, Cavalo)
const SAN_CHARS_REGEX_INGLESA = /^[a-hKQRBNO1-8=+#x\-!?]*$/;

// Regex para notação PORTUGUESA: R D T B C (Rei, Dama, Torre, Bispo, Cavalo)
const SAN_CHARS_REGEX_PORTUGUESA = /^[a-hRDTBCO1-8=+#x\-!?]*$/;

@Component({
    selector: 'app-xadrez',
    standalone: true,
    imports: [FormsModule, NgIf, NgClass, NgFor, NoAutocompleteDirective],
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

    // input de lance
    sanInput: string = '';
    enviandoLance: boolean = false;
    erroLance: string | null = null;
    avisoLance: string | null = null;

    // configuração (só dono) — notação pode ser escolhida
    configurandoBrancas: string = '';
    configurandoPretas: string = '';
    configurandoNotacao: 'PORTUGUESA' | 'INGLESA' = 'INGLESA';
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
        localStorage.setItem('xadrez_notificacoes_sonoras', JSON.stringify(value));
    }

    constructor(private websocketService: WebSocketService, private authService: AuthService, private xadrezService: XadrezService) {
        this.username = authService.getStorage('username')!;
        // Inicializa o áudio de notificação
        this.audioNotificacao = new Audio('notificacao.wav');

        // Carrega preferência de notificações do localStorage
        const notificacoesSalvas = localStorage.getItem('xadrez_notificacoes_sonoras');
        if (notificacoesSalvas !== null) {
            this._notificacoesSonorasAtivadas = JSON.parse(notificacoesSalvas);
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

            this.estado = msg;
            this.enviandoLance = false;

            if (msg.evento === 'LANCE') {
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
        this.xadrezSubscription?.unsubscribe?.();
        this.erroSubscription?.unsubscribe?.();
        this.xadrezSubscription = null;
        this.erroSubscription = null;
    }

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
        console.log('Tentando tocar notificação. Ativadas:', this.notificacoesSonorasAtivadas);
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
