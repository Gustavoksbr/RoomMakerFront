import {Component, Input, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {NgClass, NgIf, NgOptimizedImage} from '@angular/common';
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
    NgClass,
    NgIf
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  public username: string = '';
  public escuro: boolean = false;
//  public  throwErro() {
//   const error: ErrorPersonalizado = { status: '500', error: 'Internal Server Error' };
//   this.errorHandler.handleError(error);
// }
  constructor(private authService: AuthService,private errorHandler: GlobalErrorHandler) {
   this.username =  localStorage.getItem('username')!;
  }

  logout() {
    this.authService.logout();
  }

  changeTheme() {
   if(localStorage.getItem("tema") == "claro" || localStorage.getItem("tema") == null){
     localStorage.setItem("tema", "escuro");
   }else if (localStorage.getItem("tema") == "escuro"){
      localStorage.setItem("tema","claro");
   }
    this.colorir();
  }

  colorir() {
    if (localStorage.getItem("tema") == "claro" || localStorage.getItem("tema") == null) {
      this.escuro = false;
      document.documentElement.setAttribute('data-theme', "");
      // document.getElementById('home')!.style.backgroundColor = 'white';

    } else if (localStorage.getItem("tema") == "escuro") {
// setTimeout(() => {
  this.escuro = true;
      document.documentElement.setAttribute('data-theme', "dark");
  // document.getElementById('home')!.style.backgroundColor = 'black';

//
// },500);
    }
  }

  ngOnInit(): void {
   this.colorir();
   console.log("home carregou");
  }
  isModalOpen = false;
  abrirModal() {
    this.isModalOpen = true;
  }
  fecharModal() {
    this.isModalOpen = false;
  }

}
