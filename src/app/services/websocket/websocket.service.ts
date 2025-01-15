// Serviço WebSocket para Angular
import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import {AuthService} from '../auth.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  // public stompClient: Client;
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }
  private convertToObject(message: any): any {
    console.log('z  message: ' + message);
    console.log('z  message.body: ' + message.body);
    console.log('z  JSON.parse(message.body): ' + JSON.parse(message.body));
    return JSON.parse(message.body);
  }
  connect(
    stompClient : Client,
    onConnectCallback: (frame: any) => void, //define quando a conexao é estabelecida
    topic: string, //define o topico com url
    onMessageCallback: (message: any) => void)//o q fazer sempre que receber uma mensagem
  {
    stompClient.configure({
      connectHeaders: {Authorization: `Bearer ${this.authService.getToken()}`},
      brokerURL: 'ws://localhost:8080/socket',
    });
    stompClient.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      onConnectCallback(frame);
      stompClient.subscribe(topic, (messageBeforeConvertionToType) =>
          onMessageCallback(this.convertToObject(messageBeforeConvertionToType)),
        {Authorization: `Bearer ${this.authService.getToken()}`});
    //   stompClient.subscribe(topic+"/chat", (messageBeforeConvertionToType) =>
    //       onMessageCallback(this.convertToObject(messageBeforeConvertionToType)),
    //     {Authorization: `Bearer ${this.authService.getToken()}`});
     };

    stompClient.onWebSocketError = (error) => console.error('Error with websocket', error);
    stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    stompClient.activate();
    return stompClient;
  }
subscribe(stompClient : Client, topic: string, onMessageCallback: (message: any) => void) {
    console.log("stompCliente is connected: " + stompClient.connected);
    stompClient.subscribe(topic, (messageBeforeConvertionToType) =>
        onMessageCallback(this.convertToObject(messageBeforeConvertionToType)),
      {Authorization: `Bearer ${this.authService.getToken()}`});
}
  disconnect(stompClient : Client) {
    stompClient.deactivate();
    console.log('Disconnected');
  }

  sendMessage(stompClient : Client,destination: string, body: any='') {
    // this.stompClient.configure({ connectHeaders: {} });
    console.log("body: " + body);
    if (stompClient && stompClient.connected) {
      stompClient.publish({ destination, body, headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
    }
  }
}
