import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {RouterLink} from "@angular/router";
import {SalaResponse} from '../../../../models/salas/response/SalaResponse';
import {EntrarSalaRequest} from '../../../../models/salas/request/EntrarSalaRequest';
import {categoriaMap} from '../../../../models/salas/domain/Sala';
import {TogglePasswordDirective} from '../../../../diretivas/only-alphanumeric/toggle-password.directive';


@Component({
  selector: 'app-fora-da-sala',
  standalone: true,
  imports: [
    FormsModule,
    TogglePasswordDirective
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
  // public tentandoEntrar :boolean = false;
  salaRequest : EntrarSalaRequest = {
    nome: '',
    usernameDono: '',
    senha: '',
  }

  @Output() enviarSala = new EventEmitter<EntrarSalaRequest>();

  // futuramente seria bom implementar um carregando
  // public carregando: boolean = false;
  entrarSala(){
    // this.tentandoEntrar = true;
 // setTimeout(() => {
   this.salaRequest.nome = this.salaParaEntrar.nome;
   this.salaRequest.usernameDono = this.salaParaEntrar.usernameDono;
   this.enviarSala.emit(this.salaRequest);
 // }, 3000);
 //    this.tentandoEntrar = false;
  }

  protected readonly categoriaMap = categoriaMap;
}
