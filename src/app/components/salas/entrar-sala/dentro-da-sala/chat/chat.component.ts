import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {WebSocketService} from '../../../../../services/websocket/websocket.service';
import {MessageResponseWs} from './MessageResponseWs';
import {MessageRequestWs} from './MessageRequestWs';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() public app: string = '';
  @Input() public topic: string = '';
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
    console.log("o pai enviou o app: " + this.app);
    console.log("o pai enviou o topic: " + this.topic);
    this.websocketService.connect(
      () => {
        console.log("Conectado ao websocket do chat")
      },
      this.topic + "/chat",
      (msg: MessageResponseWs) => {
        console.log("recebeu mensagem do chat:" + msg);
        console.log("a mensagem é:" + msg.message);
        console.log("do usuário:" + msg.from);
        this.chat.push(msg);
      });
  }

  public sendMessage() {
    console.log("Enviando mensagem: " + this.message.message);
    console.log("com destination: " + this.app + "/chat");
    this.websocketService.sendMessage(this.app + "/chat", JSON.stringify(this.message));
  }

  ngOnDestroy(): void {
    this.websocketService.disconnect();
  }
}
