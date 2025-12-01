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

@Component({
  selector: 'app-criar-sala',
  standalone: true,
  imports: [FormsModule, CommonModule, HomeComponent, NavbarComponent],
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
    if(this.sala.categoria=="tictactoe"|| this.sala.categoria=="jokenpo"){
      return true;
    }else{
      return false;
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
}
