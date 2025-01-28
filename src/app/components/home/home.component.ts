import {Component, Input} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {NgClass, NgOptimizedImage} from '@angular/common';
import {ErrorHandlerPersonalizado, ErrorPersonalizado} from './ErrorHandlerPersonalizado';
import {Observable} from 'rxjs';
import {GlobalErrorHandler} from '../../providers/exceptions/GlobalErrorHandler';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    NgClass
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  public username: string = '';
 public  throwErro() {
  const error: ErrorPersonalizado = { status: '500', error: 'Internal Server Error' };
  this.errorHandler.handleError(error);
}
  constructor(private authService: AuthService,private errorHandler: GlobalErrorHandler) {
   this.username =  localStorage.getItem('username')!;
  }

  logout() {
    this.authService.logout();
  }
}
