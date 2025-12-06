import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass, NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {SalaResponse} from '../../../../models/salas/response/SalaResponse';
import {AuthService} from '../../../../services/auth/auth.service';
import {categoriaMap} from '../../../../models/salas/domain/Sala';

@Component({
  selector: 'app-lista-salas',
  standalone: true,
  imports: [
    RouterLink,
    NgClass,
    NgForOf,
    NgIf,
    NgOptimizedImage
  ],
  templateUrl: './lista-salas.component.html',
  styleUrl: './lista-salas.component.scss'
})
export class ListaSalasComponent implements OnInit, OnChanges {
  @Input() ListaSalas: SalaResponse[] = [];
  @Input() suasSalas: boolean = false;
  public username: string = '';
  @Input() public carregando: boolean = false;


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
  ordenarSalas() {
    this.ListaSalas = this.ListaSalas.reverse();


    this.ListaSalas = this.ListaSalas.sort((a, b) => {
      const disponivelA = this.classificarOrdemDeSalas(a);
      const disponivelB = this.classificarOrdemDeSalas(b);
      return disponivelA - disponivelB;
    });

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
    if(this.jaEstaNaSala(sala)){
      return 3;
    }
    if(this.getDisponivel(sala) !== "Disponível"){
      return 2;
    }
    return 1;
  }

  protected readonly categoriaMap =  categoriaMap;
}
