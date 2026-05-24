import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { SalaResponse } from '../../../../models/salas/response/SalaResponse';
import { EntrarSalaRequest } from '../../../../models/salas/request/EntrarSalaRequest';
import { categoriaMap, formatarCapacidade } from '../../../../models/salas/domain/Sala';
import { TogglePasswordDirective } from '../../../../diretivas/only-alphanumeric/toggle-password.directive';
import { NoAutocompleteDirective } from '../../../../diretivas/no-autocomplete/no-autocomplete.directive';
import { AuthService } from '../../../../services/auth/auth.service';
import { AuthModalService } from '../../../../services/auth/auth-modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-fora-da-sala',
  standalone: true,
  imports: [
    FormsModule,
    TogglePasswordDirective,
    NoAutocompleteDirective
  ],
  templateUrl: './fora-da-sala.component.html',
  styleUrl: './fora-da-sala.component.scss'
})
export class ForaDaSalaComponent implements OnInit, OnDestroy {
  @Input() salaParaEntrar: SalaResponse = {
    id: '',
    usernameDono: '',
    nome: '',
    categoria: '',
    qtdCapacidade: 0,
    disponivel: false,
    publica: false,
    usernameParticipantes: []
  }
  // public tentandoEntrar :boolean = false;
  salaRequest: EntrarSalaRequest = {
    nome: '',
    usernameDono: '',
    senha: '',
  }
  errorMessage: string = '';

  @Output() enviarSala = new EventEmitter<EntrarSalaRequest>();
  @Output() enviarErro = new EventEmitter<string>();

  constructor(
    private authService: AuthService,
    private authModalService: AuthModalService
  ) {}

  private modalStateSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.modalStateSubscription = this.authModalService.state$.subscribe((state) => {
      // Após login bem sucedido, a modal fecha e o usuário já está logado.
      if (!state.open && this.authService.isLoggedIn()) {
        this.errorMessage = '';
      }
    });
  }

  ngOnDestroy(): void {
    this.modalStateSubscription?.unsubscribe();
    this.modalStateSubscription = null;
  }

  // futuramente seria bom implementar um carregando
  // public carregando: boolean = false;
  entrarSala() {
    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Faça login para entrar na sala.';
      this.authService.deleteStorage('redirectUrl');
      this.authModalService.openLogin();
      return;
    }

    // this.tentandoEntrar = true;
    // setTimeout(() => {
    this.errorMessage = '';
    this.salaRequest.nome = this.salaParaEntrar.nome;
    this.salaRequest.usernameDono = this.salaParaEntrar.usernameDono;
    this.enviarSala.emit(this.salaRequest);
    // }, 3000);
    //    this.tentandoEntrar = false;
  }

  setError(message: string) {
    this.errorMessage = message;
  }

  protected readonly categoriaMap = categoriaMap;
  protected readonly formatarCapacidade = formatarCapacidade;
}
