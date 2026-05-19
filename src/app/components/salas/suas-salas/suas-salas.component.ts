import { Component, OnInit, OnDestroy } from '@angular/core';
import { HomeComponent } from '../../home/home.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { PaginaAtual } from '../../navbar/PaginaAtual';
import { SalasService } from '../../../services/salas/salas.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { SalaResponse } from '../../../models/salas/response/SalaResponse';
import { ListaSalasComponent } from '../shared/lista-salas/lista-salas.component';
import { WebSocketService } from '../../../services/websocket/websocket.service';
import { Client } from '@stomp/stompjs';

@Component({
  selector: 'app-suas-salas',
  standalone: true,
  imports: [
    HomeComponent,
    NavbarComponent,
    ListaSalasComponent
  ],
  templateUrl: './suas-salas.component.html',
  styleUrl: './suas-salas.component.scss'
})
export class SuasSalasComponent implements OnInit, OnDestroy {
  private username: string = '';
  public ListaSalasDono: SalaResponse[] = [];
  public ListaSalasParticipante: SalaResponse[] = [];
  public carregandoDono: boolean = false;
  public carregandoParticipante: boolean = false;
  public usuariosOnline: Set<string> = new Set();

  private stompClient: Client = new Client();

  constructor(
    private service: SalasService,
    private router: Router,
    private authService: AuthService,
    private websocketService: WebSocketService
  ) {
    this.username = this.authService.getStorage("username")!;
  }

  ngOnInit() {
    this.carregarSalas();
    this.conectarWebSocket();
  }

  ngOnDestroy() {
    this.websocketService.disconnect(this.stompClient);
  }

  carregarSalas() {
    this.carregandoDono = true;
    this.carregandoParticipante = true;

    this.service.listarPorUsernameDono(this.username).subscribe((salas) => {
      this.carregandoDono = false;
      this.ListaSalasDono = salas;
    });

    this.service.listarPorUsernameParticipante(this.username).subscribe((salas) => {
      this.carregandoParticipante = false;
      this.ListaSalasParticipante = salas;
    });
  }

  carregarUsuariosOnline() {
    this.service.getUsuariosOnline().subscribe({
      next: (usuarios: string[]) => {
        this.usuariosOnline = new Set(usuarios);
        console.log('👥 Usuários online carregados:', usuarios.length);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar usuários online:', error);
      }
    });
  }

  conectarWebSocket() {
    const topic = `/topic/user/${this.username}/salas/updates`;

    this.websocketService.connect(
      this.stompClient,
      (frame) => {
        console.log('✅ Conectado ao WebSocket de suas salas');

        // Carrega usuários online DEPOIS de conectar ao WebSocket
        // Aguarda 500ms para garantir que o backend registrou a conexão
        setTimeout(() => {
          this.carregarUsuariosOnline();
        }, 500);
      },
      topic,
      (message) => this.handleSalaUpdate(message)
    );
  }

  handleSalaUpdate(message: any) {
    console.log('📢 Atualização de sala recebida:', message);

    const sala = message.sala;
    const ehDono = sala.usernameDono === this.username;
    const ehParticipante = sala.usernameParticipantes.includes(this.username);

    switch (message.tipo) {
      case 'CRIADA':
        if (ehDono) {
          const existeDono = this.ListaSalasDono.find(s => s.id === sala.id);
          if (!existeDono) {
            this.ListaSalasDono.push(sala);
            console.log('✅ Nova sala adicionada (dono):', sala.nome);
          }
        }
        break;

      case 'DELETADA':
        const tamanhoAntesDono = this.ListaSalasDono.length;
        const tamanhoAntesPart = this.ListaSalasParticipante.length;

        this.ListaSalasDono = this.ListaSalasDono.filter(s => s.id !== sala.id);
        this.ListaSalasParticipante = this.ListaSalasParticipante.filter(s => s.id !== sala.id);

        if (this.ListaSalasDono.length < tamanhoAntesDono || this.ListaSalasParticipante.length < tamanhoAntesPart) {
          console.log('🗑️ Sala removida:', sala.nome);
        }
        break;

      case 'ATUALIZADA':
        // Atualiza em ListaSalasDono
        const indexDono = this.ListaSalasDono.findIndex(s => s.id === sala.id);
        if (indexDono !== -1) {
          if (ehDono) {
            this.ListaSalasDono[indexDono] = sala;
            console.log('🔄 Sala atualizada (dono):', sala.nome);
          } else {
            // Não é mais dono, remove
            this.ListaSalasDono.splice(indexDono, 1);
            console.log('➖ Removido de salas como dono:', sala.nome);
          }
        } else if (ehDono) {
          // Agora é dono, adiciona
          this.ListaSalasDono.push(sala);
          console.log('➕ Adicionado como dono:', sala.nome);
        }

        // Atualiza em ListaSalasParticipante
        const indexPart = this.ListaSalasParticipante.findIndex(s => s.id === sala.id);
        if (indexPart !== -1) {
          if (ehParticipante) {
            this.ListaSalasParticipante[indexPart] = sala;
            console.log('🔄 Sala atualizada (participante):', sala.nome);
          } else {
            // Não é mais participante, remove
            this.ListaSalasParticipante.splice(indexPart, 1);
            console.log('➖ Removido de salas como participante:', sala.nome);
          }
        } else if (ehParticipante) {
          // Agora é participante, adiciona
          this.ListaSalasParticipante.push(sala);
          console.log('➕ Adicionado como participante:', sala.nome);
        }
        break;
    }
  }

  protected readonly PaginaAtual = PaginaAtual;
}
