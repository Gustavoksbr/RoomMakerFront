import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    FormsModule
  ],
  standalone: true
})
export class RegisterComponent {
  user = { username: '', email:'', password: '' };

  constructor(private authService: AuthService) {}

  register() {
    this.authService.register(this.user).subscribe({
      next: (response: any) => console.log('Registration successful', response),
      error: (err: any) => console.error('Registration failed', err),
    });
  }
}
