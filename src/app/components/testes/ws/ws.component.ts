// app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from '../../../services/websocket/websocket.service';
import {FormsModule} from "@angular/forms";
import {NgForOf, NgIf} from '@angular/common';
import { Subject } from 'rxjs';
import {WsTeste} from '../../../models/mensagens/WsTeste';
import {AuthService} from '../../../services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf
  ],
  templateUrl: './ws.component.html',
  styleUrls: ['./ws.component.scss']
})

export class WsComponent {
  connected = false;

  messages: any[] = [];
  private username: string = "";
  private topic = '/topic/sala/zzzz';
  private destination = '/app/sala/zzzz';

  private webSocketService: WebSocketService;
  private authService;

  constructor(webSocketService: WebSocketService,authService:AuthService) {
    this.webSocketService = webSocketService;
    this.authService = authService;
    this.username = this.authService.getStorage("username")!;
  }
  connect() {
    this.webSocketService.connect(
      () => this.connected = true,
      this.topic,
      (message: any) => {
        this.messages.push(message)
      }
    );
  }
  disconnect() {
    this.webSocketService.disconnect();
    this.connected = false;
  }
  // sendMessage() {
  //     this.webSocketService.sendMessage(this.destination, {content: 'blablabla!'});
  // }

  // private setConnected(connected: boolean) {
  //   this.connected = connected;
  //   if (!connected) {
  //     this.messages = [];
  //   }
  // }
  // private showMessage(message: string) {
  //   this.messages.push(message);
  //   console.log("Mensagem: " + message);
  //   console.log("todas as mensagens: " + this.messages);
  // }



}
