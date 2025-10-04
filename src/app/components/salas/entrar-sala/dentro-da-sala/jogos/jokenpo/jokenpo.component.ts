import {Component, Input, OnInit} from '@angular/core';
import {Client} from '@stomp/stompjs';
import {WebSocketService} from '../../../../../../services/websocket/websocket.service';
import {AuthService} from '../../../../../../services/auth.service';
import {JokenpoResponse} from './JokenpoResponse';
import {JokenpoLance} from './JokenpoLance';
import {JokenpoStatus} from './JokenpoStatus';
import {JokenpoLanceRequest} from './JokenpoLanceRequest';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-jokenpo',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './jokenpo.component.html',
  styleUrl: './jokenpo.component.scss'
})
export class JokenpoComponent implements OnInit {
  @Input() public app: string = '';
  @Input() public topic: string = '';
  @Input() public stompClient: Client= new Client();
  @Input() public jogadorDono: string = '';
  @Input() public jogadorOponente: string = '';
  public username = "";
  public vitoriasDono = 0;
  public vitoriasOponente = 0;
  public empates = 0;

  public jokenpoAnterior : JokenpoResponse = {
    numero : 0,
    lanceDono: JokenpoLance.ESPERANDO ,
    lanceOponente: JokenpoLance.ESPERANDO,
    status: JokenpoStatus.WAITING
  }

  public jokenpo : JokenpoResponse = {
    numero : 0,
    lanceDono: JokenpoLance.ESPERANDO ,
    lanceOponente: JokenpoLance.ESPERANDO,
    status: JokenpoStatus.WAITING
  }
  public lanceRequest : JokenpoLanceRequest = {
    lance: JokenpoLance.ESPERANDO
  }

  private zerar(){
    this.jokenpoAnterior = this.jokenpo;
   this.jokenpo ={
     numero : 0,
     lanceDono: JokenpoLance.ESPERANDO ,
     lanceOponente: JokenpoLance.ESPERANDO,
     status: JokenpoStatus.WAITING
   }
   this.lanceRequest={
      lance: JokenpoLance.ESPERANDO
   }
}
private verificarResultado(jokenpo:JokenpoResponse){
  if (jokenpo.status == JokenpoStatus.DONO_WIN) {
    this.vitoriasDono++;

  } else if (jokenpo.status == JokenpoStatus.OPONENTE_WIN) {
    this.vitoriasOponente++;

  } else if (jokenpo.status == JokenpoStatus.DRAW) {
    this.empates++;

  }
}
  constructor(private websocketService: WebSocketService, private authService: AuthService) {
  }
  ngOnInit(): void {
    this.username= this.authService.getStorage("username")!
    this.websocketService.subscribe(this.stompClient, this.topic + "/jokenpo", (msg: any) => {
      if(msg.historico != null){
        this.vitoriasOponente = 0;
        this.vitoriasDono = 0;
        this.empates = 0;
        for(let i = 0; i < msg.historico.length; i++){
          this.verificarResultado(msg.historico[i]);
        }
      }else if(msg.status != null){
        this.jokenpo = msg;
        if(this.jokenpo.status == JokenpoStatus.DONO_WIN || this.jokenpo.status == JokenpoStatus.OPONENTE_WIN || this.jokenpo.status == JokenpoStatus.DRAW) {
          this.verificarResultado(this.jokenpo);
          this.zerar();
        }
      }
    });

    this.websocketService.sendMessage(this.stompClient, this.app + "/jokenpo", null);
  }

  public enviarLance(jokenpoLance: JokenpoLance) {
    this.lanceRequest.lance = jokenpoLance;
    this.websocketService.sendMessage(this.stompClient, this.app + "/jokenpo/lance", JSON.stringify(this.lanceRequest));
  }

  protected readonly JokenpoStatus = JokenpoStatus;
  protected readonly JokenpoLance = JokenpoLance;
}
