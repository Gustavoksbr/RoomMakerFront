import {Component, Input, OnInit} from '@angular/core';
import {Client} from '@stomp/stompjs';
import {WebSocketService} from '../../../../../../services/websocket/websocket.service';
import {AuthService} from '../../../../../../services/auth/auth.service';
import {WhoIsTheImpostorResponse} from './who-is-the-impostor';
import {NgClass, NgIf, NgOptimizedImage} from '@angular/common';
import {Card, CardMap, CardMapToPortuguese} from './Card';

@Component({
  selector: 'app-who-is-the-impostor',
  standalone: true,
  imports: [
    NgClass,
    NgOptimizedImage,
    NgIf
  ],
  templateUrl: './who-is-the-impostor.component.html',
  styleUrl: './who-is-the-impostor.component.scss'
})
export class WhoIsTheImpostorComponent implements OnInit {
  @Input() public app: string = '';
  @Input() public topic: string = '';
  @Input() public stompClient: Client= new Client();
  @Input() public jogadorDono: string = '';
  @Input() public outrosJogadores: string[] = [];

  public username = "";
  public urlBaseDasCartas = "https://www.deckshop.pro/img/card_ed/";
  public mostrarCartaAtual : boolean = false;
  public whoIsTheImpostor: WhoIsTheImpostorResponse = {
    partidaSendoJogada: null,
    impostorDaPartidaPassada: null,
    cartaDaPartidaPassada: null,
    estaNaPartida: null,
    isImpostor: null,
    carta: Card.MIRROR
  }
  public estaAbertoModalIniciarPartida: boolean = false;
  public estaAbertoModalTerminarPartida: boolean = false;

  public abrirModalIniciarPartida(): void {
    this.estaAbertoModalIniciarPartida = true;
  }
  public fecharModalIniciarPartida(): void {
    this.estaAbertoModalIniciarPartida = false;
  }
  public abrirModalTerminarPartida(): void {
    this.estaAbertoModalTerminarPartida = true;
  }
  public fecharModalTerminarPartida(): void {
    this.estaAbertoModalTerminarPartida = false;
  }
public iniciarPartida(): void{
  this.websocketService.sendMessage(this.stompClient, this.app+"/whoistheimpostor/comecar", {});
  this.fecharModalIniciarPartida();
}
  public terminarPartida(): void{
    this.websocketService.sendMessage(this.stompClient, this.app+"/whoistheimpostor/terminar", {});
    this.fecharModalTerminarPartida();
  }
  constructor(private websocketService: WebSocketService, private authService: AuthService) {
  }
  public mostrarEsconderCarta(): void{
    this.mostrarCartaAtual = !this.mostrarCartaAtual;
  }
  public get cardName(): string {
    return CardMap[this.whoIsTheImpostor.carta];
  }

  public get cardPassadaName(): string {
    return CardMap[this.whoIsTheImpostor.cartaDaPartidaPassada!];
  }

  public get cardNamePortuguese(): string {
    return CardMapToPortuguese[this.whoIsTheImpostor.carta];
  }
  public get cardPassadaNamePortuguese(): string {
    return CardMapToPortuguese[this.whoIsTheImpostor.cartaDaPartidaPassada!];
  }
  // public cardNames: string[] = Object.values(CardMap);

  ngOnInit(): void {
    this.username = this.authService.getStorage("username")!;
    this.websocketService.subscribe(this.stompClient, this.topic+"/whoistheimpostor", (msg:WhoIsTheImpostorResponse) => {
      this.mostrarCartaAtual = false;
      this.whoIsTheImpostor = msg;
    });
    this.websocketService.sendMessage(this.stompClient, this.app+"/whoistheimpostor/mostrar", {});
  }

  protected readonly Card = Card;
}
