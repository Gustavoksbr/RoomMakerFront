import {Component, NgModule} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {ToastrModule, ToastrService} from 'ngx-toastr';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    FormsModule,
  ],
  standalone: true
})
export class LoginComponent {
  credentials = { username: '', password: '' };

  constructor(
    private authService: AuthService,
  private router:Router,
  private toastr : ToastrService) {}

  login() {
    console.log("tentando logar"+this.credentials.username + this.credentials.password);
    this.authService.login(this.credentials).subscribe({
      next: (response: { token: any; }) => {
        this.authService.saveToken(response.token);
        this.authService.saveStorage("username",this.credentials.username);
        this.router.navigate(['/salas']);
      },
      error: (err: any) => {
        throw err;
      },
    });
  }
}
