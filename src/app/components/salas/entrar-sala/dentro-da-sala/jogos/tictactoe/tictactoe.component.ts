import {Component, Input, OnInit} from '@angular/core';
import {Client} from '@stomp/stompjs';
import {WebSocketService} from '../../../../../../services/websocket/websocket.service';
import {TicTacToeResponse} from './TicTacToeResponse';
import {TicTacToeStatus} from './TicTacToeStatus';
import {TicTacToeLanceRequest} from './TicTacToeLanceRequest';
import {AuthService} from '../../../../../../services/auth.service';
import {JokenpoStatus} from '../jokenpo/JokenpoStatus';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-tictactoe',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './tictactoe.component.html',
  styleUrl: './tictactoe.component.scss'
})
export class TictactoeComponentimplements implements OnInit {
@Input() public app: string = '';
@Input() public topic: string = '';
@Input() public stompClient: Client= new Client();
@Input() public jogadorDono: string = '';
@Input() public jogadorOponente: string = '';

public tictactoeAnterior : TicTacToeResponse = {
  x:'',
  o:'',
  posicao:'_________',
  status:TicTacToeStatus.WAITING
}

public tictactoe : TicTacToeResponse = {
  x:'',
  o:'',
  posicao:'_________',
  status:TicTacToeStatus.WAITING
}
public ticTacToeComecarRequest= {
  jogador1: 'zxc',
  jogador2: 'asd'
};
public verificarStatus(){
  switch (this.tictactoe.status) {
    case TicTacToeStatus.x_WIN:
      return "X ganhou";
    case TicTacToeStatus.o_WIN:
      return "O ganhou";
    case TicTacToeStatus.DRAW:
      return "Empate";
    case TicTacToeStatus.WAITING:
      return "Aguardando";
    case TicTacToeStatus.x_TURN:
      if(this.username == this.tictactoe.x  )
      {
        return "Sua vez";
      }
      return "Vez de X";
    case TicTacToeStatus.o_TURN:
      if(this.username == this.tictactoe.o  )
      {
        return "Sua vez";
      }
      return "Vez de O";
  }
}
public username = "";
public vitoriasDono = 0;
public vitoriasOponente = 0;
public empates = 0;
  constructor(private websocketService: WebSocketService, private authService: AuthService) {
  }
  private zerar(){
    this.tictactoeAnterior = this.tictactoe;
    this.tictactoe ={
      x:'',
      o:'',
      posicao:'_________',
      status:TicTacToeStatus.WAITING
    }
  }
  ngOnInit(): void {
    this.username= this.authService.getStorage("username")!
    this.websocketService.subscribe(this.stompClient, this.topic + "/tictactoe", (msg: TicTacToeResponse) => {
        console.log("recebeu mensagem do tictactoe:" + msg);
        this.tictactoe = msg;
        if(this.tictactoe.status == TicTacToeStatus.DRAW || this.tictactoe.status == TicTacToeStatus.x_WIN || this.tictactoe.status == TicTacToeStatus.o_WIN) {
          // this.tictactoeAnterior = msg;
          if (this.tictactoe.status == TicTacToeStatus.x_WIN ||  this.tictactoe.status == TicTacToeStatus.o_WIN) {
            const vencedor = this.tictactoe.status == TicTacToeStatus.x_WIN ? this.tictactoe.x : this.tictactoe.o;
            if (vencedor == this.jogadorDono) {
              this.vitoriasDono++;
            } else {
              this.vitoriasOponente++;
            }
          }
          else if(this.tictactoe.status == TicTacToeStatus.DRAW){
            this.empates++;
          }
          this.zerar();
          // this.tictactoe.status = TicTacToeStatus.WAITING;
          // this.tictactoe.x = '';
          // this.tictactoe.o = '';
          // this.tictactoe.posicao = '_________';
          // this.websocketService.sendMessage(this.stompClient,this.app+"/tictactoe",JSON.stringify(this.ticTacToeComecarRequest));
          this.websocketService.sendMessage(this.stompClient,this.app+"/tictactoe",null);
        }
    });
    //this.websocketService.sendMessage(this.stompClient,this.app+"/tictactoe",JSON.stringify(this.ticTacToeComecarRequest));
    this.websocketService.sendMessage(this.stompClient,this.app+"/tictactoe",null);
  }

  verificarVez(){
    if(this.tictactoe.status == TicTacToeStatus.x_TURN){
      if(this.username != this.tictactoe.x){
        console.log("não é sua vez");
        return false;

      }
    }else if(this.tictactoe.status == TicTacToeStatus.o_TURN){
      if(this.username != this.tictactoe.o){
        console.log("não é sua vez");
        return false;
      }
    }
    console.log("é sua vez");
    return true;
  }
  enviarLance(posicao:number){
    if(this.verificarVez()) {
      const lance: TicTacToeLanceRequest = {
        lance: posicao
      }
      console.log("tictactoe anterior:" + this.tictactoeAnterior.posicao);
      this.websocketService.sendMessage(this.stompClient, this.app + "/tictactoe/lance", JSON.stringify(lance));
    }
  }

  protected readonly JokenpoStatus = JokenpoStatus;
  protected readonly TicTacToeStatus = TicTacToeStatus;
}
