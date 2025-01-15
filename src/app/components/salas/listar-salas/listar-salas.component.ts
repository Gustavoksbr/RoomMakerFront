import {Component, OnInit, Pipe} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {SalaResponse} from '../../../models/salas/response/SalaResponse';
import {SalasService} from '../../../services/salas/salas.service';
import {SalaComponent} from '../sala/sala.component';
import {HomeComponent} from '../../home/home.component';

@Component({
  selector: 'app-listar-salas',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, SalaComponent, HomeComponent, NgClass],
  templateUrl: './listar-salas.component.html',
  styleUrl: './listar-salas.component.scss'
})
export class ListarSalasComponent implements OnInit {
  ListaSalas: SalaResponse[] = [];
  showParticipantsPopup: boolean = false;
  participants: string[] = [];
 constructor(private service: SalasService) {}

ngOnInit() {
  this.service.listar().subscribe((salas) => {
    this.ListaSalas = salas;
    console.log(this.ListaSalas);
  });
}

  toggleParticipants(sala?: SalaResponse): void {
    if (sala) {
      this.participants = [sala.usernameDono, ...sala.usernameParticipantes];
    }
    this.showParticipantsPopup = !this.showParticipantsPopup;
  }
}
