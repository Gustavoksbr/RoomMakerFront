// Serviço WebSocket para Angular
import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import {AuthService} from '../auth.service';
import {GlobalErrorHandler} from '../../providers/exceptions/GlobalErrorHandler';
import {ErrorHandlerPersonalizado} from '../../components/home/ErrorHandlerPersonalizado';
import {ErrorPersonalizado} from '../../components/home/ErrorHandlerPersonalizado';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  // public stompClient: Client;
  private authService: AuthService;

  constructor(authService: AuthService,private globalErrorHandler: GlobalErrorHandler) {
    this.authService = authService;
  }
  private convertToObject(message: any,topic:string): any {
    let parsed;
    try {
      parsed = JSON.parse(message.body);
    } catch (error) {
      console.error('Failha to parse message body as JSON:', error);
      return null;
    }
    const erroInterface : ErrorPersonalizado={
      status: message.body.status,
      error: message.body.error
    }
    if(parsed.error){
      console.log("nao e nulo");
      this.globalErrorHandler.handleError(parsed);

    }
    console.log('z  message: ' + message);
    console.log('z no topico ('+topic+') message.body: ' + message.body);
    console.log('z  JSON.parse(message.body): ' + JSON.parse(message.body));
    console.log('z  JSON.strinfy(message.body): ' + JSON.stringify(message.body));

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
          onMessageCallback(this.convertToObject(messageBeforeConvertionToType,topic)),
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
        onMessageCallback(this.convertToObject(messageBeforeConvertionToType,topic)),
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

  //testes para hacker
  connectHacker(
    stompClient : Client)//o q fazer sempre que receber uma mensagem
  {
    stompClient.configure({
      brokerURL: 'ws://localhost:8080/socket',
    });
    stompClient.onConnect = (frame) => {
      console.log('Connected via hack: ' + frame);
    };

    stompClient.activate();
    return stompClient;
  }
  unsubscribe(stompClient : Client, topic: string) {
    stompClient.unsubscribe(topic);
  }

}
