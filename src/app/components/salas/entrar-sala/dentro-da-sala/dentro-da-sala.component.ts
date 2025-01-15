import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {SalaResponse} from '../../../../models/salas/response/SalaResponse';
import {WebSocketService} from '../../../../services/websocket/websocket.service';
import {AuthService} from '../../../../services/auth.service';
import {SalasService} from '../../../../services/salas/salas.service';
import {ChatComponent} from './chat/chat.component';

@Component({
  selector: 'app-dentro-da-sala',
  standalone: true,
  imports: [
    ChatComponent
  ],
  templateUrl: './dentro-da-sala.component.html',
  styleUrl: './dentro-da-sala.component.scss'
})
export class DentroDaSalaComponent implements OnInit, OnDestroy {
  @Input() public sala : SalaResponse = {
    id: '',
    usernameDono: '',
    nome: '',
    categoria: '',
    qtdCapacidade: 0,
    disponivel: false,
    publica: false,
    usernameParticipantes: []
  }
  private username : string = '';
  protected topic : string = '';
  protected app : string = '';
  public jogos : string[] = ['chat','tictactoe','forca','coup','xadrez'];
  @Output() enviarParticipantes = new EventEmitter<string[]>();

  sairSala(){
    this.salaService.sairDaSala(this.sala.usernameDono,this.sala.nome,this.username).subscribe((sala :  any)=>{
      console.log("saiu da sala");
    });
  }
  constructor(private websocketService : WebSocketService, private authService : AuthService, private salaService : SalasService) {
    this.username = authService.getStorage("username")!;
  }

  ngOnInit(): void {
    this.topic = `/topic/sala/${this.sala.usernameDono}/${this.sala.nome}/${this.username}`;
    console.log("u topicoococc: " +this.topic);
    this.app = `/app/sala/${this.sala.usernameDono}/${this.sala.nome}/${this.username}`;
    console.log("u app: " +this.app);

    let topicForThis = this.topic + "/sala";
    console.log("topicForThis: " + topicForThis);
    this.websocketService.connect(
      () => {console.log("Conectado ao websocket da sala")},
      topicForThis,
      (msg : string[]) => {
        console.log("recebeu mensagem:"+msg);
        this.sala.usernameParticipantes = msg;
        this.enviarParticipantes.emit(msg);
      });
    console.log("oi");
  }

  ngOnDestroy(): void {
    this.websocketService.disconnect();
  }


}




















































