import {Component, OnInit} from '@angular/core';
import {HomeComponent} from '../../home/home.component';
import {NavbarComponent} from '../../navbar/navbar.component';
import {PaginaAtual} from '../../navbar/PaginaAtual';
import {SalasService} from '../../../services/salas/salas.service';
import {Router} from '@angular/router';
import {AuthService} from '../../../services/auth.service';
import {SalaResponse} from '../../../models/salas/response/SalaResponse';
import {ListaSalasComponent} from '../shared/lista-salas/lista-salas.component';

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
export class SuasSalasComponent implements OnInit {
private username: string = '';
public ListaSalasDono: SalaResponse[] = [];
public ListaSalasParticipante: SalaResponse[] = [];
public carregandoDono: boolean = false;
public carregandoParticipante: boolean = false;
  constructor(private service: SalasService, private router: Router, private authService: AuthService) {
    this.username = this.authService.getStorage("username")!;
  }
  ngOnInit() {
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
  protected readonly PaginaAtual = PaginaAtual;
}
