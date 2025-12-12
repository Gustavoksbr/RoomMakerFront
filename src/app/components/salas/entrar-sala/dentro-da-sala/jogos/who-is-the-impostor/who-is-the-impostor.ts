import {Card} from './Card';


export interface WhoIsTheImpostorResponse {
  partidaSendoJogada: boolean | null;

  // partida passada
  impostorDaPartidaPassada: string | null;
  cartaDaPartidaPassada: Card | null;
  votosPorVotadosDaPartidaPassada: Record<string, string[]> | null;
  jogadoresDaPartidaPassada : string[] | null;

  // partida atual
  estaNaPartida: boolean | null;
  isImpostor: boolean | null;
  carta: Card;
  jogadoresNaPartida: string[] | null;
  quantidadeVotos : number | null;
  votado: string | null;
}
export interface VotosPorVotadoRow {
  Chave: string; // O jogador que recebeu os votos
  'Quantidade de Votos': number;
  'Lista de Votos': string; // Os jogadores que votaram nele
}
