import {Component, NgModule} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {ToastrModule, ToastrService} from 'ngx-toastr';
import {HomeComponent} from '../home/home.component';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    FormsModule,
    HomeComponent,
  ],
  standalone: true
})
export class LoginComponent {
  tentandoLogar = false;
  credentials = { username: '', password: '' };

  constructor(
    private authService: AuthService,
  private router:Router,
  private toastr : ToastrService) {}

  login() {
    // console.log("chegou aqui no login")
    this.tentandoLogar = true;
    // setTimeout(() => {
    //   console.log("tentando logar" + this.credentials.username + this.credentials.password);
      this.authService.login(this.credentials).subscribe({
        next: (response: { token: any; }) => {
          this.authService.saveToken(response.token);
          this.authService.saveStorage("username",this.credentials.username);
          this.authService.getDataNascimento().subscribe(res => {
            const dataNascimento = res.data;
            console.log("Data de nascimento recebida:", dataNascimento);
              this.authService.saveStorage("datanascimento",dataNascimento);
            this.router.navigate(['/salas']);
          });
        },
        error: (err: any) => {
          this.tentandoLogar = false;
          throw err;
        },
      });
    // }, 5000);
  }

  cadastrar(){
    this.router.navigate(['/register']);
  }

  esqueciSenha(){
    this.router.navigate(['/forget']);
  }
}
