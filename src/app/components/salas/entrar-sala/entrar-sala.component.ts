import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {SalaComponent} from '../sala/sala.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {EntrarSalaRequest} from '../../../models/salas/request/EntrarSalaRequest';
import {SalasService} from '../../../services/salas/salas.service';
import {SalaResponse} from '../../../models/salas/response/SalaResponse';
import {AuthService} from '../../../services/auth.service';
import {io} from 'socket.io-client';
import {ForaDaSalaComponent} from './fora-da-sala/fora-da-sala.component';
import {DentroDaSalaComponent} from './dentro-da-sala/dentro-da-sala.component';
import {HomeComponent} from '../../home/home.component';
import {NavbarComponent} from '../../navbar/navbar.component';
import {PaginaAtual} from '../../navbar/PaginaAtual';

@Component({
  selector: 'app-entrar-sala',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    RouterLink,
    SalaComponent,
    ReactiveFormsModule,
    FormsModule,
    ForaDaSalaComponent,
    DentroDaSalaComponent,
    HomeComponent,
    NavbarComponent
  ],
  templateUrl: './entrar-sala.component.html',
  styleUrl: './entrar-sala.component.scss'
})
export class EntrarSalaComponent implements OnInit {

  sala: SalaResponse = {
    id: '',
    usernameDono: '',
    nome: '',
    categoria: '',
    qtdCapacidade: 0,
    disponivel: false,
    publica: false,
    usernameParticipantes: []
  }
  username: string = "";
  usernameDono: string | null = "";
  salaNome: string | null = "";
  public url: string = ''
  constructor(
    private authService: AuthService,
    private service:SalasService,
    private router:Router,
    private route:ActivatedRoute


  ) {}


  ngOnInit(): void {
   this.username = this.authService.getStorage("username")!;
;
   this.usernameDono  = this.route.snapshot.paramMap.get('usernameDono');
   this.salaNome =this.route.snapshot.paramMap.get('nomeSala');
    this.url = this.usernameDono! + "/" + this.salaNome!;
      console.log("dono é:"+this.usernameDono);
   console.log(this.username);
   this.service.buscarPorUsernameDonoESalaNome((this.usernameDono)!,(this.salaNome)!).subscribe((sala)=>{
   this.sala = sala;

    })
  }
  usuarioEstaNaSala(){
    return this.sala.usernameParticipantes.includes(this.username) || this.sala.usernameDono === this.username;
  }
  returnPaginaAtual(){
    if(this.usuarioEstaNaSala()){
      return PaginaAtual.SUAS_SALAS
    }
    return PaginaAtual.SALAS;
  }
  entrarSala(salaRequest:EntrarSalaRequest){
   this.service.entrarNaSala(salaRequest).subscribe((salaResponse: SalaResponse)=>{
     this.sala = salaResponse;
   });
    // this.router.navigate(['salas/{this.usernameDono}/{this.salaNome}']);
  }

  validarParticipantes(participantes:string[]){
    this.sala.usernameParticipantes = participantes;
  }
}
