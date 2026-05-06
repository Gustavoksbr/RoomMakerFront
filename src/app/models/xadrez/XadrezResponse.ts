export interface XadrezResponse {
    usernameBrancas: string | null;
    usernamePretas: string | null;
    notacao: 'PORTUGUESA' | 'INGLESA' | null;

    partidaEmAndamento: boolean;
    partidaId: number | null;
    lances: string[];
    resultado: string | null; // EM_ANDAMENTO, VITORIA_BRANCAS, VITORIA_PRETAS, EMPATE
    motivo: string | null;    // XEQUE_MATE, DESISTENCIA, etc.
    propostaEmpate: string | null; // BRANCAS, PRETAS ou null
    lancesIlegaisBrancas: number;
    lancesIlegaisPretas: number;
    vezDasBrancas: boolean | null;

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

    // Informações de tempo
    tempoInicialBrancas: number | null;
    tempoInicialPretas: number | null;
    incrementoBrancas: number | null;
    incrementoPretas: number | null;
}
