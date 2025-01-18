import {TicTacToeStatus} from './TicTacToeStatus';

export interface TicTacToeResponse{
  // jogadorDono: string;
  // jogadorOponente: string;
  x: string;
  o: string;
  posicao: string;
  status : TicTacToeStatus
}
