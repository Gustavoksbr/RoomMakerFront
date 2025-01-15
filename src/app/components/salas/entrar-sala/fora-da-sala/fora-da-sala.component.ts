import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {RouterLink} from "@angular/router";
import {SalaResponse} from '../../../../models/salas/response/SalaResponse';
import {EntrarSalaRequest} from '../../../../models/salas/request/EntrarSalaRequest';


@Component({
  selector: 'app-fora-da-sala',
  standalone: true,
    imports: [
        FormsModule,
        RouterLink
    ],
  templateUrl: './fora-da-sala.component.html',
  styleUrl: './fora-da-sala.component.scss'
})
export class ForaDaSalaComponent {
  @Input() salaParaEntrar : SalaResponse = {
    id: '',
    usernameDono: '',
    nome: '',
    categoria: '',
    qtdCapacidade: 0,
    disponivel: false,
    publica: false,
    usernameParticipantes: []
  }
  salaRequest : EntrarSalaRequest = {
    nome: '',
    usernameDono: '',
    senha: '',
  }

  @Output() enviarSala = new EventEmitter<EntrarSalaRequest>();

  entrarSala(){
    this.salaRequest.nome = this.salaParaEntrar.nome;
    this.salaRequest.usernameDono = this.salaParaEntrar.usernameDono;
    this.enviarSala.emit(this.salaRequest);
  }
}
