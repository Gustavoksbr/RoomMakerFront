import {Card} from './Card';


export interface WhoIsTheImpostorResponse {
  partidaSendoJogada: boolean | null;

  // partida passada
  impostorDaPartidaPassada: string | null;
  cartaDaPartidaPassada: Card | null;

  // partida atual
  estaNaPartida: boolean | null;
  isImpostor: boolean | null;
  carta: Card;
}
