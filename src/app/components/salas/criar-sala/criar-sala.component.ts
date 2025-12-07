import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {CriarSalaRequest} from '../../../models/salas/request/CriarSalaRequest';
import {SalasService} from '../../../services/salas/salas.service';
import {AuthService} from '../../../services/auth/auth.service';
import {HomeComponent} from '../../home/home.component';
import {NavbarComponent} from '../../navbar/navbar.component';
import {PaginaAtual} from '../../navbar/PaginaAtual';
import {GlobalSuccess} from '../../../providers/sucesso/GlobalSuccess';
import {categoriaMap} from '../../../models/salas/domain/Sala';
import {OnlyAlphanumericDirective} from '../../../diretivas/only-alphanumeric/only-alphanumeric.divective';
import {TogglePasswordDirective} from '../../../diretivas/only-alphanumeric/toggle-password.directive';

@Component({
  selector: 'app-criar-sala',
  standalone: true,
  imports: [FormsModule, CommonModule, HomeComponent, NavbarComponent, OnlyAlphanumericDirective, TogglePasswordDirective],
  templateUrl: './criar-sala.component.html',
  styleUrl: './criar-sala.component.scss'
})
export class CriarSalaComponent {
  private username: string = '';
  sala: CriarSalaRequest = {
    nome: '',
    senha: '',
    categoria: 'chat',
    qtdCapacidade: 2
  }
  public publica :boolean = false;
  public tentandoCriar :boolean = false;
  public soPodeDois() :boolean {
    return this.sala.categoria == "tictactoe" || this.sala.categoria == "jokenpo";
  }
  public noMinimoTres() :boolean {
    return this.sala.categoria == "whoistheimpostor";

  }
  onCategoriaChange() {
    if (this.soPodeDois()) { // tictactoe or jokenpo
      this.sala.qtdCapacidade = 2;
    }else if (this.noMinimoTres()) { //who is the impostor
      if (this.sala.qtdCapacidade < 3) {
        this.sala.qtdCapacidade = 3;
      }
    }else { //chat
      if (this.sala.qtdCapacidade < 2) {
        this.sala.qtdCapacidade = 2;
      }
    }
  }


  constructor(private service: SalasService, private router: Router, private authService: AuthService,private successHandler: GlobalSuccess) {
    this.username = this.authService.getStorage("username")!;
  }

  criarSalaRequest() {
    this.tentandoCriar = true;
    this.service.criar(this.sala).subscribe({
      next: (response: any) => {
        this.router.navigate([`/salas/${this.username}/${this.sala.nome}`]).then(() => {this.successHandler.handleSuccess('Sala criada com sucesso!')});
      },
        error: (err: any) => {
          this.tentandoCriar = false;
          throw err;
        },
    });
  }

cancelar() {
    this.sala = {
      nome: '',
      senha: '',
      categoria: '',
      qtdCapacidade: 2
    }
    this.publica = false;
  }
  protected readonly PaginaAtual = PaginaAtual;
  protected readonly categoriaMap = categoriaMap;
}
