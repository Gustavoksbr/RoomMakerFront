// Serviço WebSocket para Angular
import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import type { StompSubscription } from '@stomp/stompjs';
import {AuthService} from '../auth/auth.service';
import {GlobalErrorHandler} from '../../providers/exceptions/GlobalErrorHandler';
import {API_CONFIG} from '../config/api.config';

/**
 * Mensagens de erro que NÃO devem virar um toast global, mesmo vindo do canal
 * genérico de erros (`/topic/{username}/erro`, compartilhado por todos os
 * jogos da sala).
 *
 * Função pura e exportada — sem isto, testar esta regra exigiria montar
 * `WebSocketService` inteiro com `AuthService` e `GlobalErrorHandler` (que por
 * sua vez arrastam `Router`, `HttpClient`, `Injector`...) só para checar um
 * `includes()` em string.
 */
export function deveSerSuprimidoGlobalmente(mensagem: string): boolean {
  const msg = mensagem.toLowerCase();

  // Erros de digitação/notação: o próprio jogo mostra aviso local (amarelo)
  if (msg.includes('notação inválida') || msg.includes('caracteres inválidos')) {
    return true;
  }

  // Lance ilegal no TABULEIRO VISUAL: só acontece por desync de rede (o
  // cliente só deixa arrastar pra casas que ele já validou como legais). O
  // próprio tabuleiro já reverte a peça sozinho — não precisa de um toast
  // alarmando um problema de timing como se fosse erro do jogador. O
  // marcador "(tabuleiro visual)" existe justamente para não calar a mesma
  // frase no modo às cegas, onde ela É um erro de verdade do jogador.
  if (msg.includes('lance ilegal na posição atual (tabuleiro visual)')) {
    return true;
  }

  return false;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  // public stompClient: Client;
  private authService: AuthService;

  constructor(authService: AuthService,private globalErrorHandler: GlobalErrorHandler) {
    this.authService = authService;
  }

  private shouldHandleErrorGlobally(parsed: any): boolean {
    const rawMessage =
      (typeof parsed?.error === 'string' ? parsed.error : parsed?.error?.message)
      ?? parsed?.message
      ?? '';

    return !deveSerSuprimidoGlobalmente(String(rawMessage));
  }

  private convertToObject(message: any, topic: string, handleErrorsGlobally: boolean = true): any {
    let parsed;
    try {
      parsed = JSON.parse(message.body);
    } catch (error) {
      console.error('Failha to parse message body as JSON:', error);
      return null;
    }
    if (handleErrorsGlobally && parsed.error) {
      if (this.shouldHandleErrorGlobally(parsed)) {
        this.globalErrorHandler.handleError(parsed);
      }

    }
    return parsed;
  }
  connect(
    stompClient : Client,
    onConnectCallback: (frame: any) => void, //define quando a conexao é estabelecida
    topic: string, //define o topico com url
    onMessageCallback: (message: any) => void)//o q fazer sempre que receber uma mensagem
  {
    stompClient.configure({
      connectHeaders: {Authorization: `Bearer ${this.authService.getToken()}`},
      brokerURL: API_CONFIG.BASE_URL+'/socket',
    });
    stompClient.onConnect = (frame) => {
      onConnectCallback(frame);
      stompClient.subscribe(topic, (messageBeforeConvertionToType) =>
          onMessageCallback(this.convertToObject(messageBeforeConvertionToType,topic, true)),
        {Authorization: `Bearer ${this.authService.getToken()}`});
     };

    stompClient.onWebSocketError = (error) => console.error('Error with websocket', error);
    stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    stompClient.activate();
    return stompClient;
  }
  subscribe(
    stompClient : Client,
    topic: string,
    onMessageCallback: (message: any) => void,
    options?: { handleErrorsGlobally?: boolean }
  ): StompSubscription {
    console.log("Subscribing to topic: " + topic);
    const handleErrorsGlobally = options?.handleErrorsGlobally ?? true;
    return stompClient.subscribe(topic, (messageBeforeConvertionToType) =>
        onMessageCallback(this.convertToObject(messageBeforeConvertionToType,topic, handleErrorsGlobally)),
      {Authorization: `Bearer ${this.authService.getToken()}`});
  }

  disconnect(stompClient : Client) {
    stompClient.deactivate();
  }

  sendMessage(stompClient : Client,destination: string, body: any='') {
    console.log("Sending message to destination: " + destination + " with body: " + body);
    if (stompClient && stompClient.connected) {
      stompClient.publish({ destination, body, headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
    }
  }


}
