import { Component } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  public username: string = '';
  constructor(private authService: AuthService) {
    this.username = this.authService.getStorage("username")!;
  }

  logout() {
    this.authService.logout();
  }
}
