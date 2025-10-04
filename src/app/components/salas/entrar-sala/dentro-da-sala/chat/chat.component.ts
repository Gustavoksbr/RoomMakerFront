import {Component, Input, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener} from '@angular/core';
import {WebSocketService} from '../../../../../services/websocket/websocket.service';
import {MessageResponseWs} from './MessageResponseWs';
import {MessageRequestWs} from './MessageRequestWs';
import {FormsModule} from '@angular/forms';
import {Client} from '@stomp/stompjs';
import {NgClass, NgIf, NgOptimizedImage} from '@angular/common';
import {AuthService} from '../../../../../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgClass,
    NgOptimizedImage
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  @Input() public app: string = '';
  @Input() public topic: string = '';
  @Input() public stompClient: Client= new Client();


  public chat: MessageResponseWs[] = [];
public enviandoMensagem: boolean = false;
  public message: MessageRequestWs = {
    message: '',
    to: null
  };

  public procurarRespondido(ordem: number): MessageResponseWs | null  {
    let mensagemRespondida = this.chat.find(mensagem => mensagem.ordem == ordem);
    if(mensagemRespondida != null) {
      return mensagemRespondida;
    }
    return null;
  }
public respondendoAUsername : string | null = null;
  public respondendoAMensagem : MessageResponseWs | null = null;
public responderMensagem(mensagem: MessageResponseWs): void{
  // let mensagemHtml = document.getElementById("mensagem-" + mensagem.ordem)!;
  this.message.to = mensagem.ordem;
  this.respondendoAUsername = mensagem.from;
  this.respondendoAMensagem = mensagem;
  this.mostrarOpcoes(mensagem.ordem);
}
public verificarSeMensagemAnteriorEhDoMesmoUsuario(mensagem: MessageResponseWs): number{
  if(mensagem.ordem == 1){
    return 0;
  }
  let mensagemEncontrada = this.chat.find(mensagemEncontrada => mensagemEncontrada.ordem == mensagem.ordem - 1);
  if(mensagemEncontrada != null){
    if(mensagemEncontrada.from == mensagem.from){
    return 1;
    }
  }
  return 0;
}

public mensagemAnterior : MessageResponseWs | null = null;
public cancelarResposta(): void{
  this.message.to = null;
  this.respondendoAUsername = null;
  this.respondendoAMensagem = null;
}
  public transformarData(data: string): string {
    let dataFormatada = data.substring(0, 10);
    let hora = data.substring(11, 19);
    return dataFormatada + " às " + hora;
  }
public opcoesMostradas: number | null = null;
public mostrarOpcoes(ordem:number): void {
  if(this.opcoesMostradas == null || this.opcoesMostradas != ordem){
    this.opcoesMostradas = ordem;
  }else{
      this.opcoesMostradas = null;
    }

}
  public getNomeUsuario:String = "";


  public sendMessage() {
    this.enviandoMensagem = true;
  setTimeout(() => {
    console.log("Enviando mensagem: " + this.message.message);

    // console.log("com destination: " + this.app + "/chat/message");
    this.websocketService.sendMessage(this.stompClient, this.app + "/chat/message", JSON.stringify(this.message));
    this.message.message = '';
    setTimeout(() => this.scrollToBottom(), 1000);
    this.enviandoMensagem = false;
    if(this.message.to != null) {
      this.cancelarResposta();
    }
    }, 1000);

  }
  scrollToBottom() {

    const tableContainer = document.getElementsByClassName('chat-perso')[0];
    let alturaMaxima;
    if(tableContainer.scrollHeight!=null) {
      alturaMaxima = tableContainer.scrollHeight;
      tableContainer.scrollTop = alturaMaxima+9000000;
    } else{
      tableContainer.scrollTop = 9999999999;
    }

    // console.log("tableContainer.scrollHeight: " + tableContainer.scrollHeight);
    // tableContainer.scrollTop = tableContainer.scrollHeight+9000000;

  }
  goToMessage(ordem: number): void {
    this.opcoesMostradas = null;
    let mensagem = document.getElementById("mensagem-" + ordem);

    if (mensagem) {
      mensagem.scrollIntoView({ behavior: 'smooth', block: 'center' });

      mensagem.classList.add("highlight");
      setTimeout(() => {
        mensagem.classList.remove("highlight");
          mensagem.classList.add("highlight2");
          setTimeout(() => {
            mensagem.classList.remove("highlight2");
          }, 700);
      }, 1300);
    }

  }
  constructor(private websocketService: WebSocketService, private authService: AuthService,private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {

    this.websocketService.subscribe(this.stompClient, this.topic + "/chat", (msg: any) => {
      if(msg.usernameDono==null){
        if (msg.message && msg.message.trim() !== '') {
          this.mensagemAnterior = null;
          this.chat.push(msg);
        } else {
        }
      }else{
        this.chat = msg.messages;
        setTimeout(() => this.scrollToBottom(), 10);
      }
    });
    this.websocketService.sendMessage(this.stompClient, this.app + "/chat");
    this.getNomeUsuario = this.authService.getStorage("username")!;
    document.addEventListener("click", (event) => {
      if (event.target != null) {
        let target = event.target as HTMLElement;
        if (!target.classList.contains("seta-para-cima") && !target.classList.contains("opcoes") && !target.classList.contains("opcoes-mostradas")) {
          this.opcoesMostradas = null;
        }
      }});
  }

}
