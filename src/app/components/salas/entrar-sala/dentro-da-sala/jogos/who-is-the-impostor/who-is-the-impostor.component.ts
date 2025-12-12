import {Component, Input, OnInit} from '@angular/core';
import {Client} from '@stomp/stompjs';
import {WebSocketService} from '../../../../../../services/websocket/websocket.service';
import {AuthService} from '../../../../../../services/auth/auth.service';
import {VotosPorVotadoRow, WhoIsTheImpostorResponse} from './who-is-the-impostor';
import { NgClass, NgIf, NgOptimizedImage} from '@angular/common';
import {Card, CardMap, CardMapToPortuguese} from './Card';
import confetti from 'canvas-confetti';


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

    // partida passada
    impostorDaPartidaPassada: null,
    cartaDaPartidaPassada: null,
    votosPorVotadosDaPartidaPassada: null,
    jogadoresDaPartidaPassada : null,

    // partida atual
    estaNaPartida: null,
    isImpostor: null,
    carta: Card.MIRROR,
    jogadoresNaPartida: null,
    quantidadeVotos: null,
    votado: null

  }
  public terminoBrusco: boolean = false;
  public impostorVenceu: boolean | null = null;
  public votoSelecionado: string = "";

  public selecionarVoto(jogador: string): void{
    if(this.votoSelecionado==jogador){
      this.votoSelecionado = "";
      return;
    }
    this.votoSelecionado = jogador;
  }
  public votar(){
    this.websocketService.sendMessage(this.stompClient, this.app+"/whoistheimpostor/votar", JSON.stringify(this.votoSelecionado));
    this.votoSelecionado = "";
  }
  public cancelarVoto(){
    this.websocketService.sendMessage(this.stompClient, this.app+"/whoistheimpostor/cancelarVoto", {});
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

  ngOnInit(): void {
    this.username = this.authService.getStorage("username")!;
    this.websocketService.subscribe(this.stompClient, this.topic+"/whoistheimpostor", (msg:WhoIsTheImpostorResponse) => {
      this.whoIsTheImpostor = msg;
      if(msg.partidaSendoJogada==false){
        this.mostrarCartaAtual = false;
        this.processarVotosEDeterminarResultado(this.whoIsTheImpostor.votosPorVotadosDaPartidaPassada);      }
    });
    this.websocketService.sendMessage(this.stompClient, this.app+"/whoistheimpostor/mostrar", {});
  }

  protected readonly Card = Card;
  protected readonly JSON = JSON;

  //tabela votos
  public votosDaPartidaPassadaFormatados: VotosPorVotadoRow[] | null = null;
  public processarVotosEDeterminarResultado(dataMap: Record<string, string[]> | null): void {
    const impostor = this.whoIsTheImpostor.impostorDaPartidaPassada;

    // Verifica se os dados necessários estão disponíveis para evitar erros
    if (dataMap === null || !impostor) {
      this.votosDaPartidaPassadaFormatados = null;
      this.impostorVenceu = null;
      return;
    }

    // 1. Geração e Ordenação da Tabela
    const tableData: VotosPorVotadoRow[] = [];


    Object.entries(dataMap).forEach(([votado, listaDeVotos]) => {
      const votantesUnicos = Array.from(new Set(listaDeVotos));

      tableData.push({
        Chave: votado,
        'Quantidade de Votos': listaDeVotos.length,
        'Lista de Votos': votantesUnicos.join(', '),
      });
    });

    // Ordenar do mais votado para o menos votado (Decrescente)
    tableData.sort((a, b) => b['Quantidade de Votos'] - a['Quantidade de Votos']);

    this.votosDaPartidaPassadaFormatados = tableData;

    // 2. Determinação da Vitória do Impostor

    const listaDeVotos = Object.values(dataMap).flat();

    // Condição de Término Brusco:
    if (listaDeVotos.length < this.whoIsTheImpostor.jogadoresDaPartidaPassada!.length) {
      this.terminoBrusco = true;
      return;
    }
    // O mais votado é sempre o primeiro, pois o array está ordenado
    const maxVotes = tableData[0]['Quantidade de Votos'];

    // Encontra todos os jogadores com o número máximo de votos
    const maisVotados = tableData.filter(
      row => row['Quantidade de Votos'] === maxVotes
    );

    const impostorEstaEntreMaisVotados = maisVotados.some(row => row.Chave === impostor);

    // Condição de DERROTA do Impostor:
    // O Impostor foi o único a receber a quantidade máxima de votos.
    const impostorFoiSoloMaisVotado = impostorEstaEntreMaisVotados && maisVotados.length === 1;

    if (impostorFoiSoloMaisVotado) {
      this.impostorVenceu = false;
    } else {
      // Impostor vence: Ou houve empate no voto máximo, ou não foi o mais votado.
      this.impostorVenceu = true;
    }
    if (this.whoIsTheImpostor.jogadoresDaPartidaPassada?.includes(this.username) ) {
      if (this.impostorVenceu && this.whoIsTheImpostor.impostorDaPartidaPassada == this.username) {
        this.celebrate();
      } else if (!this.impostorVenceu && this.whoIsTheImpostor.impostorDaPartidaPassada != this.username) {
        this.celebrate();
      }
    }
  }

  celebrate() {
    const duration = 3000;

    confetti({
      particleCount: 150,
      spread: 180,
      origin: { y: 0.6 },
      colors: ['#FF4500', '#008080', '#FFD700'],
    });

    setTimeout(() => confetti.reset(), duration);
  }
}
