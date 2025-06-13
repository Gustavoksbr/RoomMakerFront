import {Component, Input, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {NgClass, NgIf, NgOptimizedImage} from '@angular/common';
import {GlobalErrorHandler} from '../../providers/exceptions/GlobalErrorHandler';
import confetti from 'canvas-confetti';

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
 verificarAniversario(){
    const dataNascimentoStr = localStorage.getItem("datanascimento");
    console.log("Data de nascimento do usuário:", dataNascimentoStr);
    if (dataNascimentoStr) {
      const dataNascimento = new Date(dataNascimentoStr);
      console.log("Data de nascimento convertida:", dataNascimento);
      const hoje = new Date();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const hojeStr = `${mes}-${dia}`;
      const nascimentoStr = dataNascimentoStr.slice(5);
      this.seuAniversario = nascimentoStr === hojeStr;
    }
    if(this.seuAniversario) {
      this.celebrate();
    }
  }
  public username: string = '';
  public escuro: boolean = false;
  public seuAniversario: boolean = false;
//  public  throwErro() {
//   const error: ErrorPersonalizado = { status: '500', error: 'Internal Server Error' };
//   this.errorHandler.handleError(error);
// }
  constructor(private authService: AuthService,private errorHandler: GlobalErrorHandler) {
   this.username =  localStorage.getItem('username')!;
   console.log('aaaaaaaaaaaaaaaaaaa')
  this.verificarAniversario();
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
  }

  isModalOpen = false;
  abrirModal() {
    this.isModalOpen = true;
  }
  fecharModal() {
    this.isModalOpen = false;
  }
  celebrate() {
    const duration = 3000;

    confetti({
      particleCount: 150,
      spread: 180,
      origin: { y: 0.6 },
      colors: ['#FF4500', '#008080', '#FFD700'],
    });

    setTimeout(() => confetti.reset(), duration);
  }
}
