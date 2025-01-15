import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {CriarSalaRequest} from '../../../models/salas/request/CriarSalaRequest';
import {SalasService} from '../../../services/salas/salas.service';
import {AuthService} from '../../../services/auth.service';
import {HomeComponent} from '../../home/home.component';

@Component({
  selector: 'app-criar-sala',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, HomeComponent],
  templateUrl: './criar-sala.component.html',
  styleUrl: './criar-sala.component.scss'
})
export class CriarSalaComponent {
  private username : string = '';
  sala : CriarSalaRequest = {
    nome: '',
    senha: '',
    categoria: '',
    qtdCapacidade: 0
  }
constructor(private service:SalasService,private router:Router,private authService : AuthService) {
  this.username = this.authService.getStorage("username")!;
}
    criarSalaRequest(){
    this.service.criar(this.sala).subscribe(()=>{
      this.router.navigate([`/salas/${this.username}/${this.sala.nome}`])
      })
}
}

