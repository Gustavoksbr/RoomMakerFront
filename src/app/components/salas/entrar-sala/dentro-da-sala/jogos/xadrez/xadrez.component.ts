import { Component, Input, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { WebSocketService } from '../../../../../../services/websocket/websocket.service';
import { AuthService } from '../../../../../../services/auth/auth.service';
import { XadrezService } from '../../../../../../services/xadrez/xadrez.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { XadrezResponse, PartidaXadrezResumo } from '../../../../../../models/xadrez/XadrezResponse';
import { NoAutocompleteDirective } from '../../../../../../diretivas/no-autocomplete/no-autocomplete.directive';

// Regex para bloquear caracteres impossíveis em SAN de xadrez
// Permite: a-h, 1-8, K Q R B N O = + # x - ! ?
const SAN_CHARS_REGEX = /^[a-hKQRBNO1-8=+#x\-!?]*$/;

@Component({
    selector: 'app-xadrez',
    standalone: true,
    imports: [FormsModule, NgIf, NgClass, NgFor, NoAutocompleteDirective],
    templateUrl: './xadrez.component.html',
    styleUrl: './xadrez.component.scss'
})
export class XadrezComponent implements OnInit {
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

    // configuração (só dono) — notação sempre INGLESA até implementar a portuguesa
    configurandoBrancas: string = '';
    configurandoPretas: string = '';
    readonly configurandoNotacao: 'PORTUGUESA' | 'INGLESA' = 'INGLESA';

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

    constructor(private websocketService: WebSocketService, private authService: AuthService, private xadrezService: XadrezService) {
        this.username = authService.getStorage('username')!;
    }

    ngOnInit(): void {
        // Carrega estado inicial via HTTP
        this.xadrezService.mostrar(this.jogadorDono, this.jogadorNomeSala).subscribe({
            next: (estado) => { this.estado = estado; },
            error: (err) => { console.error('Erro ao carregar xadrez:', err); }
        });

        // Recebe atualizações em tempo real via WebSocket
        this.websocketService.subscribe(this.stompClient, this.topic + '/xadrez', (msg: XadrezResponse) => {
            this.estado = msg;
            this.enviandoLance = false;
            if (msg.evento === 'LANCE' || msg.evento === 'FIM' || msg.evento === 'PARTIDA_INICIADA') {
                this.erroLance = null;
                this.sanInput = '';
            }
            if (msg.evento === 'FIM') {
                this.historicoPagina = 1; // volta para a primeira página (mais recente) ao terminar partida
            }
            if (msg.evento === 'LANCE_ILEGAL') {
                this.erroLance = 'Lance ilegal na posição atual. +1 lance ilegal contabilizado.';
                this.sanInput = '';
            }
        });
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
        if (!SAN_CHARS_REGEX.test(valor)) {
            input.value = valor.replace(/[^a-hKQRBNO1-8=+#x\-!?]/g, '');
            this.sanInput = input.value;
        }
    }

    // --- Ações ---
    enviarLance(): void {
        if (!this.sanInput.trim() || this.enviandoLance) return;
        this.enviandoLance = true;
        this.erroLance = null;
        this.websocketService.sendMessage(
            this.stompClient,
            this.app + '/xadrez/lance',
            JSON.stringify({ san: this.sanInput.trim() })
        );
    }

    configurarEIniciar(): void {
        this.websocketService.sendMessage(
            this.stompClient,
            this.app + '/xadrez/configurar-e-iniciar',
            JSON.stringify({
                usernameBrancas: this.configurandoBrancas,
                usernamePretas: this.configurandoPretas,
                notacao: this.configurandoNotacao,
            })
        );
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
}
