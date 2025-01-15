import {Component, Input, OnInit} from '@angular/core';

import {FormsModule} from '@angular/forms';
import {MessageResponseWs} from '../../salas/entrar-sala/dentro-da-sala/chat/MessageResponseWs';
import {MessageRequestWs} from '../../salas/entrar-sala/dentro-da-sala/chat/MessageRequestWs';
import {WebSocketService} from '../../../services/websocket/websocket.service';
import {HomeComponent} from '../../home/home.component';

@Component({
  selector: 'app-chat-teste',
  standalone: true,
  imports: [
    FormsModule,
    HomeComponent
  ],
  templateUrl: './chat-teste.component.html'
})
export class ChatTesteComponent implements OnInit {
  public app: string = '/app/sala/gustavo/abc/gustavo/chat';
 public topic: string = '/topic/sala/gustavo/abc/gustavo/chat';
  public chat: MessageResponseWs[] = [
    { message: 'Hello!', from: 'User1' },
    { message: 'How are you?', from: 'User2' },
    { message: 'I am fine, thanks!', from: 'User3' },
    { message: 'What about you?', from: 'User4' },
    { message: 'I am good too!', from: 'User5' },
    { message: 'What are you doing?', from: 'User6' },
    { message: 'Just working on a project.', from: 'User7' },
    { message: 'Sounds interesting!', from: 'User8' },
    { message: 'Yes, it is.', from: 'User9' },
    { message: 'Good luck with your project!', from: 'User10' }
  ];
  public message: MessageRequestWs = {
    message: ''};

  constructor(private websocketService: WebSocketService) {
  }

  ngOnInit(): void {
    this.websocketService.connect(
      () => {
        console.log("Conectado ao websocket")
      },
      this.topic,
      (msg: MessageResponseWs) => {
        console.log("recebeu mensagem do chat:" + msg);
        console.log("a mensagem é:" + msg.message);
        console.log("do usuário:" + msg.from);
        this.chat.push(msg);
      });
  }

  public sendMessage() {
    console.log("Enviando mensagem: " + this.message.message);
    console.log("com destination: " + this.app);
    this.websocketService.sendMessage(this.app, JSON.stringify(this.message));
  }
}
