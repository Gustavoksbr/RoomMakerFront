import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {EntrarSalaRequest} from '../../../models/salas/request/EntrarSalaRequest';
import {SalasService} from '../../../services/salas/salas.service';
import {SalaResponse} from '../../../models/salas/response/SalaResponse';
import {AuthService} from '../../../services/auth/auth.service';
import {ForaDaSalaComponent} from './fora-da-sala/fora-da-sala.component';
import {DentroDaSalaComponent} from './dentro-da-sala/dentro-da-sala.component';
import {HomeComponent} from '../../home/home.component';
import {NavbarComponent} from '../../navbar/navbar.component';

@Component({
  selector: 'app-entrar-sala',
  standalone: true,
  imports: [
    RouterLink,
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
  public participantesMaisDono: string[] = [];
  public carregando: boolean = false;
  constructor(
    private authService: AuthService,
    private service:SalasService,
    private router:Router,
    private route:ActivatedRoute



  ) {}


  ngOnInit(): void {
    this.carregando = true;
   this.username = this.authService.getStorage("username")!;
   this.usernameDono  = this.route.snapshot.paramMap.get('usernameDono');
   this.salaNome =this.route.snapshot.paramMap.get('nomeSala');
    this.url = this.usernameDono! + "/" + this.salaNome!;
    this.service.buscarPorUsernameDonoESalaNome((this.usernameDono)!, (this.salaNome)!).subscribe({
      next: (sala) => {
        this.carregando = false;
        this.sala = sala;
      },
      error: (err) => {
        this.carregando = false;
        throw err;
      }
    });
  }
  usuarioEstaNaSala(){
    return this.sala.usernameParticipantes.concat(this.sala.usernameDono).includes(this.username);
  }

  entrarSala(salaRequest:EntrarSalaRequest){
   this.service.entrarNaSala(salaRequest).subscribe((salaResponse: SalaResponse)=>{
     this.sala = salaResponse;
   });
  }

  validarParticipantes(participantes:string[]){
    this.sala.usernameParticipantes = participantes;
    this.participantesMaisDono = this.sala.usernameParticipantes.concat(this.sala.usernameDono);
  }
}
