import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {SalaResponse} from '../../../../models/salas/response/SalaResponse';
import {WebSocketService} from '../../../../services/websocket/websocket.service';
import {AuthService} from '../../../../services/auth/auth.service';
import {SalasService} from '../../../../services/salas/salas.service';
import {ChatComponent} from './chat/chat.component';
import {Client} from '@stomp/stompjs';
import {TictactoeComponentimplements} from './jogos/tictactoe/tictactoe.component';
import {JokenpoComponent} from './jogos/jokenpo/jokenpo.component';
import {Router} from '@angular/router';
import {NgIf} from '@angular/common';
import {WhoIsTheImpostorComponent} from './jogos/who-is-the-impostor/who-is-the-impostor.component';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-dentro-da-sala',
  standalone: true,
  imports: [
    ChatComponent,
    TictactoeComponentimplements,
    JokenpoComponent,
    NgIf,
    WhoIsTheImpostorComponent,
    FormsModule
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
  protected username : string = '';
  protected topic : string = '';
  protected app : string = '';
  public stompClient : Client = new Client();
  public participanteASerRemovido : string | null = null;

  public abrirModalRemoverParticipante(participante : string) {
    this.participanteASerRemovido = participante;
  }

  public fecharModalRemoverParticipante() {
    this.participanteASerRemovido = null;
  }

  public removerParticipante() {
    if (this.participanteASerRemovido==null) {
      return
    }
    this.salaService.sairDaSala(this.sala.usernameDono,this.sala.nome,this.participanteASerRemovido).subscribe((sala :  any)=>{
      console.log("removido participante: " + this.participanteASerRemovido);
      this.fecharModalRemoverParticipante();
    });
  }

  @Output() enviarParticipantes = new EventEmitter<string[]>();
  sairSala(){
    this.salaService.sairDaSala(this.sala.usernameDono,this.sala.nome,this.username).subscribe((sala :  any)=>{
      console.log("você saiu da sala");
    });
  }
  constructor(private websocketService : WebSocketService, private authService : AuthService, private salaService : SalasService,private router : Router) {
    this.username = authService.getStorage("username")!;
  }
  deletarSala(){
    this.router.navigate(['/salas']);
    this.salaService.deletarSala(this.sala.usernameDono,this.sala.nome).subscribe((sala : any)=>{
      console.log("sala deletada");
    });
  }
  ngOnInit(): void {
    this.topic = `/topic/sala/${this.sala.usernameDono}/${this.sala.nome}/${this.username}`;
    this.app = `/app/sala/${this.sala.usernameDono}/${this.sala.nome}/${this.username}`;

    let topicForThis = this.topic + "/sala";
    this.stompClient = this.websocketService.connect(
      this.stompClient,
      () => {
      },
      topicForThis,
      (msg : string[]) => {
        this.sala.usernameParticipantes = msg;
        this.enviarParticipantes.emit(msg);
        if(this.username!== this.sala.usernameDono && (!msg.includes(this.username))){
          this.router.navigate(['/salas']);
        }
      });
  }

  ngOnDestroy(): void {
    this.websocketService.disconnect(this.stompClient);
  }
  isModalOpen = false;
  abrirModal() {
    this.isModalOpen = true;
  }

  fecharModal() {
    this.isModalOpen = false;
  }

}
