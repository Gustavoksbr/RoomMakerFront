import { Component } from '@angular/core';

import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';
import {Greetings} from '../../../models/mensagens/WsTeste';
import {WebSocketService} from '../../../services/websocket/websocket.service';
import {MessageResponseWs} from '../../salas/entrar-sala/dentro-da-sala/chat/MessageResponseWs';
import {MessageRequestWs} from '../../salas/entrar-sala/dentro-da-sala/chat/MessageRequestWs';

@Component({
  selector: 'app-ws2',
  templateUrl: 'ws2.component.html',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf
  ],
  styleUrls: ['ws2.component.scss']
})
export class Ws2Component {

  connected = false;
  greetings: string[] = [];
  messageRequestWs : MessageRequestWs = {message: ''};

  private topic = '/topic/sala/a/b/c/c';
  private destination = '/app/sala/a/b/c/chat';

  constructor(private websocketService: WebSocketService) {}

  connect() {
    this.websocketService.connect(
      () => this.setConnected(true),
      this.topic,
      (message: MessageResponseWs) => {
        this.showGreeting(message);
        console.log("message"+message);
        console.log("message.content"+message.message);
        console.log("quem enviou foi"+message.from);
      }
    );
  }

  disconnect() {
    this.websocketService.disconnect();
    this.setConnected(false);
  }

  sendName() {
    console.log("Enviando mensagem: " + this.messageRequestWs.message);
    this.websocketService.sendMessage(this.destination, JSON.stringify(this.messageRequestWs)); // Certifique-se de usar JSON.stringify
  }


  private setConnected(connected: boolean) {
    this.connected = connected;
    if (!connected) {
      this.greetings = [];
    }
  }

  private showGreeting(message: MessageResponseWs) {
    console.log("print"+message.message);
    this.greetings.push(message.message);
  }


}
