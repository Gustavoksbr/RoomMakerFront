import { Component } from '@angular/core';
import {HomeComponent} from '../../home/home.component';
import {AuthService} from '../../../services/auth.service';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {RedefinirSenhaRequest} from './RedefinirSenhaRequest';
import {GlobalSuccess} from '../../../providers/sucesso/GlobalSuccess';

@Component({
  selector: 'app-forget',
  standalone: true,
  imports: [
    HomeComponent,
    FormsModule
  ],
  templateUrl: './forget.component.html',
  styleUrl: './forget.component.scss'
})
export class ForgetComponent {
  tentandoEnviar = false;
  enviadoPelaPrimeiraVez = false;
  enviado = false;

  tentandoRedefinir = false;

  emailParaRecuperarRequest = { email: '' };
  redefinirSenhaRequest : RedefinirSenhaRequest = {
    email: '',
    password: '',
    codigo: '' ,
    // confirmacao: ''
  };
  constructor(
    private authService: AuthService,
    private router: Router,
    private successHandler: GlobalSuccess
  ) {}

  forget() {
    this.tentandoEnviar = true;
    this.enviado = false;
    this.authService.forget(this.emailParaRecuperarRequest).subscribe({
      // next: () => {
      //   this.router.navigate(['/login']);
      // },
      next:()=>{
        this.tentandoEnviar = false;
        this.enviadoPelaPrimeiraVez = true;
        this.enviado = true;
        this.redefinirSenhaRequest.email = this.emailParaRecuperarRequest.email;

        },
      error: (err: any) => {
        this.tentandoEnviar = false;
        throw err;
      },
    });
  }

  redefinirSenha(){
    // if(this.redefinirSenhaRequest.password != this.redefinirSenhaRequest.confirmacao){
    //   throw new Error()
    // }
    this.tentandoRedefinir = true;
    this.authService.redefinirSenha(this.redefinirSenhaRequest).subscribe({
      next: () => {
        this.router.navigate(['/salas']).then(r => this.successHandler.handleSuccess('Senha redefinida com sucesso'));
      },
      error: (err: any) => {
        this.tentandoRedefinir = false;
        throw err;
      }
    });
  }

  login(){
    this.router.navigate(['/login']);
  }
}
