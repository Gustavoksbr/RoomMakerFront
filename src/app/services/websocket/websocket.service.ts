// Serviço WebSocket para Angular
import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import {AuthService} from '../auth.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient: Client;
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
    this.stompClient = new Client({

      brokerURL: 'ws://localhost:8080/socket',
    });
  }
private convertToObject(message: any): any {
  console.log('z  message: ' + message);
  console.log('z  message.body: ' + message.body);
  console.log('z  JSON.parse(message.body): ' + JSON.parse(message.body));
  return JSON.parse(message.body);
}
  connect(
    onConnectCallback: (frame: any) => void, //define quando a conexao é estabelecida
    topic: string, //define o topico com url
    onMessageCallback: (message: any) => void)//o q fazer sempre que receber uma mensagem
  {
    this.stompClient.configure({
      connectHeaders: {Authorization: `Bearer ${this.authService.getToken()}`},
      brokerURL: 'ws://localhost:8080/socket',
    });
    this.stompClient.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      onConnectCallback(frame);
      this.stompClient.subscribe(topic, (messageBeforeConvertionToType) =>
        onMessageCallback(this.convertToObject(messageBeforeConvertionToType)),
        {Authorization: `Bearer ${this.authService.getToken()}`});
    };

    this.stompClient.onWebSocketError = (error) => console.error('Error with websocket', error);
    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.stompClient.activate();
  }

  disconnect() {
    this.stompClient.deactivate();
    console.log('Disconnected');
  }

  sendMessage(destination: string, body: any) {
    // this.stompClient.configure({ connectHeaders: {} });
    console.log("body: " + body);
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({ destination, body, headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
    }
  }
}

