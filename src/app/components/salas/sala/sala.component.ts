import {Component, Input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass} from '@angular/common';
import {SalaResponse} from '../../../models/salas/response/SalaResponse';

@Component({
  selector: 'app-sala',
  standalone: true,
  imports: [NgClass,RouterLink],
  templateUrl: './sala.component.html',
  styleUrl: './sala.component.scss'
})
export class SalaComponent {
@Input() p: SalaResponse = {
  id: '',
  usernameDono: '',
  nome: '',
  categoria: '',
  qtdCapacidade: 0,
  disponivel: false,
  publica: false,
  usernameParticipantes: []
}
}
