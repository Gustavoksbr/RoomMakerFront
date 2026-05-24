import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { SalaResponse } from '../../../models/salas/response/SalaResponse';
import { SalasService } from '../../../services/salas/salas.service';
import { SalaComponent } from '../sala/sala.component';
import { HomeComponent } from '../../home/home.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { PaginaAtual } from '../../navbar/PaginaAtual';
import { ListaSalasComponent } from '../shared/lista-salas/lista-salas.component';
import { categoriaMap } from '../../../models/salas/domain/Sala';
import { NoAutocompleteDirective } from '../../../diretivas/no-autocomplete/no-autocomplete.directive';
import { WebSocketService } from '../../../services/websocket/websocket.service';
import { Client } from '@stomp/stompjs';

@Component({
  selector: 'app-listar-salas',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, SalaComponent, HomeComponent, NgClass, FormsModule, NavbarComponent, ListaSalasComponent, NoAutocompleteDirective],
  templateUrl: './listar-salas.component.html',
  styleUrl: './listar-salas.component.scss'
})
export class ListarSalasComponent implements OnInit, OnDestroy {
  ListaSalasCompleta: SalaResponse[] = []; // Lista completa sem filtro
  ListaSalas: SalaResponse[] = []; // Lista filtrada para exibição
  ListaSalasCompartilhada: SalaResponse[] = [];

  searchUsernameDono: string = '';
  searchNomeSala: string = '';
  searchCategoria: string = '';
  username: string = "";

  carregando: boolean = false;

  usuariosOnline: Set<string> = new Set();
  private stompClient: Client = new Client();

  constructor(
    private service: SalasService,
    private authService: AuthService,
    private websocketService: WebSocketService
  ) {
    this.username = this.authService.getStorage('username') ?? '';
  }

  ngOnInit() {
    this.carregarSalas();
    if (this.authService.isLoggedIn() && this.username) {
      this.conectarWebSocket();
    }
  }

  ngOnDestroy() {
    this.websocketService.disconnect(this.stompClient);
  }

  carregarSalas() {
    this.carregando = true;
    this.service.listar().subscribe((salas: any) => {
      this.carregando = false;
      this.ListaSalasCompleta = salas;
      this.aplicarFiltro();
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
    if (!this.authService.isLoggedIn() || !this.username) return;
    const topic = `/topic/user/${this.username}/salas/updates`;

    this.websocketService.connect(
      this.stompClient,
      (frame) => {
        console.log('✅ Conectado ao WebSocket de listagem de salas');

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

  /**
   * Verifica se uma sala passa pelo filtro atual
   */
  private salaPassaNoFiltro(sala: SalaResponse): boolean {
    const passaDono = !this.searchUsernameDono ||
      sala.usernameDono.toLowerCase().includes(this.searchUsernameDono.toLowerCase());

    const passaNome = !this.searchNomeSala ||
      sala.nome.toLowerCase().includes(this.searchNomeSala.toLowerCase());

    const passaCategoria = !this.searchCategoria ||
      sala.categoria.toLowerCase().includes(this.searchCategoria.toLowerCase());

    return passaDono && passaNome && passaCategoria;
  }

  /**
   * Aplica o filtro na lista completa
   */
  aplicarFiltro(): void {
    this.ListaSalas = this.ListaSalasCompleta.filter(sala => this.salaPassaNoFiltro(sala));
    this.ListaSalasCompartilhada = [...this.ListaSalas];
  }

  /**
   * Chamado quando o usuário digita nos campos de filtro
   */
  onFiltroChange(): void {
    this.aplicarFiltro();
  }

  handleSalaUpdate(message: any) {
    console.log('📢 Atualização de sala recebida:', message);

    switch (message.tipo) {
      case 'CRIADA':
        // Adiciona na lista completa se não existir
        const existeCriada = this.ListaSalasCompleta.find(s => s.id === message.sala.id);
        if (!existeCriada) {
          this.ListaSalasCompleta.push(message.sala);
          console.log('✅ Nova sala adicionada à lista completa:', message.sala.nome);

          // Adiciona na lista filtrada apenas se passar no filtro
          if (this.salaPassaNoFiltro(message.sala)) {
            this.ListaSalas.push(message.sala);
            this.ListaSalasCompartilhada = [...this.ListaSalas];
            console.log('✅ Nova sala adicionada à lista filtrada:', message.sala.nome);
          } else {
            console.log('⚠️ Sala não passa no filtro atual:', message.sala.nome);
          }
        }
        break;

      case 'DELETADA':
        // Remove da lista completa
        const tamanhoAntesCompleta = this.ListaSalasCompleta.length;
        this.ListaSalasCompleta = this.ListaSalasCompleta.filter(s => s.id !== message.sala.id);

        // Remove da lista filtrada
        const tamanhoAntesFiltrada = this.ListaSalas.length;
        this.ListaSalas = this.ListaSalas.filter(s => s.id !== message.sala.id);

        if (this.ListaSalasCompleta.length < tamanhoAntesCompleta) {
          console.log('🗑️ Sala removida:', message.sala.nome);
          this.ListaSalasCompartilhada = [...this.ListaSalas];
        }
        break;

      case 'ATUALIZADA':
        // Atualiza na lista completa
        const indexCompleta = this.ListaSalasCompleta.findIndex(s => s.id === message.sala.id);
        if (indexCompleta !== -1) {
          this.ListaSalasCompleta[indexCompleta] = message.sala;
        } else {
          this.ListaSalasCompleta.push(message.sala);
        }

        // Atualiza na lista filtrada
        const indexFiltrada = this.ListaSalas.findIndex(s => s.id === message.sala.id);
        const passaFiltro = this.salaPassaNoFiltro(message.sala);

        if (indexFiltrada !== -1) {
          if (passaFiltro) {
            // Sala existe e ainda passa no filtro - atualiza
            this.ListaSalas[indexFiltrada] = message.sala;
            console.log('🔄 Sala atualizada:', message.sala.nome);
          } else {
            // Sala existe mas não passa mais no filtro - remove
            this.ListaSalas.splice(indexFiltrada, 1);
            console.log('➖ Sala removida do filtro:', message.sala.nome);
          }
        } else if (passaFiltro) {
          // Sala não existe mas passa no filtro - adiciona
          this.ListaSalas.push(message.sala);
          console.log('➕ Sala adicionada ao filtro:', message.sala.nome);
        }

        this.ListaSalasCompartilhada = [...this.ListaSalas];
        break;
    }
  }

  limpar(): void {
    this.searchUsernameDono = '';
    this.searchNomeSala = '';
    this.searchCategoria = '';
    this.aplicarFiltro();
  }

  protected readonly PaginaAtual = PaginaAtual;
  protected readonly categoriaMap = categoriaMap;
}
