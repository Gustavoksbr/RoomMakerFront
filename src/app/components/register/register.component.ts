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
  user = { username: '', email:'', password: '' };

  constructor(private authService: AuthService,  private router:Router) {}

  register() {
    this.authService.register(this.user).subscribe({
      next: (response: { token: any; }) => {
        this.authService.saveToken(response.token);
        this.authService.saveStorage("username",this.user.username);
        this.router.navigate(['/salas']);
      },
      error: (err: any) => {
        throw err;
      },
    });
  }
  logar(){
    this.router.navigate(['/login']);
  }
}
