import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {SalaResponse} from '../../../../models/salas/response/SalaResponse';
import {AuthService} from '../../../../services/auth.service';

@Component({
  selector: 'app-lista-salas',
  standalone: true,
  imports: [
    RouterLink,
    NgClass,
    NgForOf,
    NgIf
  ],
  templateUrl: './lista-salas.component.html',
  styleUrl: './lista-salas.component.scss'
})
export class ListaSalasComponent implements OnInit, OnChanges {
  @Input() ListaSalas: SalaResponse[] = [];
  @Input() suasSalas: boolean = false;
  public username: string = '';

  // ListaOrdenada: SalaResponse[] = [];

  constructor(private authService: AuthService) {
    this.username = this.authService.getStorage("username")!;
  }
  ngOnInit() {
    this.ordenarSalas();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['ListaSalas']) {
      this.ordenarSalas();
    }}
// mostrarOrdenacao(){
//     console.log("lista salas ordenadaaaaas: ", this.ListaOrdenada);
// }
  ordenarSalas() {
    console.log("lista salas: ", this.ListaSalas);
    this.ListaSalas = this.ListaSalas.reverse();


    this.ListaSalas = this.ListaSalas.sort((a, b) => {
      const disponivelA = this.classificarOrdemDeSalas(a);
      const disponivelB = this.classificarOrdemDeSalas(b);
      return disponivelA - disponivelB;
    });
    console.log("lista ordenada: ", this.ListaSalas);

  }

  participantesComDono(sala: SalaResponse): string {
    return sala.usernameDono + "(dono), " + sala.usernameParticipantes.join(", ");
  }
  getDisponivel(sala: SalaResponse): string {
    if(sala.usernameParticipantes.length +1 >= sala.qtdCapacidade){
      return "Sala cheia";
    }
    if(!sala.disponivel){
      return "Em jogo";
    }
    return "Disponível";
  }
  jaEstaNaSala(sala: SalaResponse): boolean {
    if(sala.usernameParticipantes.includes(this.username) || sala.usernameDono === this.username){
      return true;
    }
    return false;
  }

  classificarOrdemDeSalas(sala: SalaResponse): number {
    // console.log("alo");
    if(this.jaEstaNaSala(sala)){
      return 3;
    }
    if(this.getDisponivel(sala) !== "Disponível"){
      return 2;
    }
    return 1;
  }
}
