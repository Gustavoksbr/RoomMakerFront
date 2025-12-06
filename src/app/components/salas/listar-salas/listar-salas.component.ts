import {Component, OnInit, Pipe} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {SalaResponse} from '../../../models/salas/response/SalaResponse';
import {SalasService} from '../../../services/salas/salas.service';
import {SalaComponent} from '../sala/sala.component';
import {HomeComponent} from '../../home/home.component';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../../services/auth/auth.service';
import {NavbarComponent} from '../../navbar/navbar.component';
import {PaginaAtual} from '../../navbar/PaginaAtual';
import {ListaSalasComponent} from '../shared/lista-salas/lista-salas.component';
import {ModalComponent} from '../../geral/modal/modal.component';
import {categoriaMap} from '../../../models/salas/domain/Sala';

@Component({
  selector: 'app-listar-salas',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, SalaComponent, HomeComponent, NgClass, FormsModule, NavbarComponent, ListaSalasComponent,ModalComponent],
  templateUrl: './listar-salas.component.html',
  styleUrl: './listar-salas.component.scss'
})
export class ListarSalasComponent implements OnInit {
  ListaSalas: SalaResponse[] = [];
  ListaSalasCompartilhada : SalaResponse[] = [];

  searchUsernameDono: string = '';
  searchNomeSala: string = '';
  searchCategoria: string = '';
  username: string ="";

  carregando: boolean = false;

  // showParticipantsPopup: boolean = false;
  // participants: string[] = [];
  // searchEspecifico: string = '';
 constructor(private service: SalasService) {
    this.username = localStorage.getItem('username')!;
 }

ngOnInit() {
   this.carregando = true;
  this.service.listar().subscribe((salas: any) => {
    this.carregando = false;
    this.ListaSalas = salas;
    this.ListaSalasCompartilhada = salas;
  });
}
search(): void {
  this.carregando = true;
  this.service.listarEspecifico(this.searchUsernameDono,this.searchNomeSala,this.searchCategoria).subscribe((salas) => {
    this.carregando = false;
    this.ListaSalas = salas;
  });
}
limpar(): void {
  this.searchUsernameDono = '';
  this.searchNomeSala = '';
  this.searchCategoria = '';
  // this.searchEspecifico = '';
  this.service.listar().subscribe((salas:any) => {
    this.ListaSalas = salas;
  });
}

  // toggleParticipants(sala?: SalaResponse): void {
  //   if (sala) {
  //     this.participants = [sala.usernameDono, ...sala.usernameParticipantes];
  //   }
  //   this.showParticipantsPopup = !this.showParticipantsPopup;
  // }

  protected readonly PaginaAtual = PaginaAtual;
  protected readonly categoriaMap = categoriaMap;
}
