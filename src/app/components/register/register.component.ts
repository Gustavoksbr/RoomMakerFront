import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {HomeComponent} from '../home/home.component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    FormsModule,
    HomeComponent
  ],
  standalone: true
})
export class RegisterComponent {
  public tentandoCadastrar = false;
  user = { username: '', email:'', password: '' ,dataNascimento:''};

  constructor(private authService: AuthService,  private router:Router) {}

  register() {
    this.tentandoCadastrar = true;
    this.authService.register(this.user).subscribe({
      next: (response: { token: any; }) => {
        this.authService.saveToken(response.token);
        this.authService.saveStorage("username",this.user.username);
        this.authService.getDataNascimento().subscribe(res => {
          const dataNascimento = res.data;
          console.log("Data de nascimento recebida:", dataNascimento);
          this.authService.saveStorage("datanascimento",dataNascimento);
          this.router.navigate(['/salas']);
        });
      },
      error: (err: any) => {
        this.tentandoCadastrar = false;
        throw err;
      },
    });
  }
  logar(){
    this.router.navigate(['/login']);
  }
}
