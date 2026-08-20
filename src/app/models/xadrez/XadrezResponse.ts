import { PreLance } from '../../services/xadrez/pre-lance';

export interface XadrezResponse {
    usernameBrancas: string | null;
    usernamePretas: string | null;
    notacao: 'PORTUGUESA' | 'INGLESA' | null;
    /** true = tabuleiro com peças; false = às cegas, só notação. */
    modoVisual: boolean | null;

    partidaEmAndamento: boolean;
    partidaId: number | null;
    lances: string[];
    resultado: string | null; // EM_ANDAMENTO, VITORIA_BRANCAS, VITORIA_PRETAS, EMPATE
    motivo: string | null;    // XEQUE_MATE, DESISTENCIA, etc.
    propostaEmpate: string | null; // BRANCAS, PRETAS ou null
    lancesIlegaisBrancas: number;
    lancesIlegaisPretas: number;
    vezDasBrancas: boolean | null;

    /**
     * A fila de pré-lances de QUEM RECEBEU esta resposta. O servidor nunca manda
     * a do adversário — saber que o outro pré-lançou entregaria a resposta dele.
     */
    meusPreLances: PreLance[] | null;
    /** A minha fila foi descartada porque o primeiro pré-lance caiu ilegal. */
    preLancesCancelados: boolean | null;

    // Controle de tempo
    tempoInicialBrancas: number | null; // segundos (null = infinito)
    tempoInicialPretas: number | null;
    incrementoBrancas: number | null;
    incrementoPretas: number | null;
    tempoRestanteBrancas: number | null;
    tempoRestantePretas: number | null;
    timestampUltimoLance: number | null; // milissegundos

    evento: string | null; // LANCE, LANCE_ILEGAL, FIM, CONFIGURACAO_ALTERADA, etc.

    historico: PartidaXadrezResumo[];
}

export interface PartidaXadrezResumo {
    id: number;
    pgn: string;
    lances: string[];
    resultado: string;
    motivo: string | null;
    lancesIlegaisBrancas: number;
    lancesIlegaisPretas: number;
    usernameBrancas: string | null;
    usernamePretas: string | null;
    notacao: 'PORTUGUESA' | 'INGLESA' | null;
    /** Como esta partida foi jogada — o histórico não deve mentir sobre isso. */
    modoVisual: boolean | null;

    // Informações de tempo
    tempoInicialBrancas: number | null;
    tempoInicialPretas: number | null;
    incrementoBrancas: number | null;
    incrementoPretas: number | null;
}
