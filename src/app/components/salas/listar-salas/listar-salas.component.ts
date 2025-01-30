import {Component, OnInit, Pipe} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {SalaResponse} from '../../../models/salas/response/SalaResponse';
import {SalasService} from '../../../services/salas/salas.service';
import {SalaComponent} from '../sala/sala.component';
import {HomeComponent} from '../../home/home.component';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../../services/auth.service';
import {NavbarComponent} from '../../navbar/navbar.component';
import {PaginaAtual} from '../../navbar/PaginaAtual';
import {ListaSalasComponent} from '../shared/lista-salas/lista-salas.component';

@Component({
  selector: 'app-listar-salas',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, SalaComponent, HomeComponent, NgClass, FormsModule, NavbarComponent, ListaSalasComponent],
  templateUrl: './listar-salas.component.html',
  styleUrl: './listar-salas.component.scss'
})
export class ListarSalasComponent implements OnInit {
  ListaSalas: SalaResponse[] = [];
  showParticipantsPopup: boolean = false;
  participants: string[] = [];
  searchUsernameDono: string = '';
  searchNomeSala: string = '';
  searchCategoria: string = '';
  searchEspecifico: string = '';
  username: string ="";
 constructor(private service: SalasService) {
    this.username = localStorage.getItem('username')!;
 }

ngOnInit() {
  this.service.listar().subscribe((salas: any) => {
    this.ListaSalas = salas;
    console.log(this.ListaSalas);
  });
}
search(): void {
  this.service.listarEspecifico(this.searchUsernameDono,this.searchNomeSala,this.searchCategoria).subscribe((salas) => {
    this.ListaSalas = salas;
  });
}
limpar(): void {
  this.searchUsernameDono = '';
  this.searchNomeSala = '';
  this.searchCategoria = '';
  this.searchEspecifico = '';
  this.service.listar().subscribe((salas:any) => {
    this.ListaSalas = salas;
  });
}

  toggleParticipants(sala?: SalaResponse): void {
    if (sala) {
      this.participants = [sala.usernameDono, ...sala.usernameParticipantes];
    }
    this.showParticipantsPopup = !this.showParticipantsPopup;
  }

  protected readonly PaginaAtual = PaginaAtual;
}
