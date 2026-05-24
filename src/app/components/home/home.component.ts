import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { NgClass, NgIf, NgOptimizedImage } from '@angular/common';
import { GlobalErrorHandler } from '../../providers/exceptions/GlobalErrorHandler';
import confetti from 'canvas-confetti';
import { AuthModalService } from '../../services/auth/auth-modal.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    NgIf,
    NgClass
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  verificarAniversario() {
    const dataNascimentoStr = this.authService.getStorage('datanascimento');
    if (dataNascimentoStr) {
      const dataNascimento = new Date(dataNascimentoStr);
      const hoje = new Date();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const hojeStr = `${mes}-${dia}`;
      const nascimentoStr = dataNascimentoStr.slice(5);
      this.seuAniversario = nascimentoStr === hojeStr;
    }
    if (this.seuAniversario) {
      this.celebrate();
    }
  }
  public escuro: boolean = true;
  public seuAniversario: boolean = false;

  // [CANCELADO] alterarUsername - username é usado como chave em todas as coleções do MongoDB,
  // atualizar exigiria cascade update manual em salas, chats, jogos, etc.
  // public editandoUsername: boolean = false;
  // public novoUsername: string = '';
  // public erroUsername: string | null = null;

  constructor(
    private authService: AuthService,
    private authModalService: AuthModalService,
    private errorHandler: GlobalErrorHandler
  ) {
    this.verificarAniversario();
  }

  get username(): string | null {
    return this.authService.getStorage('username');
  }

  get email(): string | null {
    return this.authService.getStorage('email');
  }

  abrirLogin(): void {
    this.authService.deleteStorage('redirectUrl');
    this.authModalService.openLogin();
  }

  abrirCadastro(): void {
    this.authService.deleteStorage('redirectUrl');
    this.authModalService.openRegister();
  }

  // abrirEditarUsername() {
  //   this.novoUsername = this.username;
  //   this.erroUsername = null;
  //   this.editandoUsername = true;
  // }

  // fecharEditarUsername() {
  //   this.editandoUsername = false;
  //   this.erroUsername = null;
  // }

  // salvarUsername() {
  //   if (!this.novoUsername || this.novoUsername === this.username) {
  //     this.fecharEditarUsername();
  //     return;
  //   }
  //   this.erroUsername = null;
  //   this.authService.alterarUsername(this.novoUsername).subscribe({
  //     next: (res) => {
  //       this.authService.saveToken(res.token);
  //       this.authService.saveStorage('username', this.novoUsername);
  //       this.username = this.novoUsername;
  //       this.editandoUsername = false;
  //     },
  //     error: (err) => {
  //       this.erroUsername = err?.error ?? 'Erro ao alterar username.';
  //     }
  //   });
  // }

  logout() {
    this.fecharModal();
    this.authService.logout();
  }

  changeTheme() {
    const tema = this.authService.getStorage('tema');
    if (tema == 'escuro' || tema == null) {
      this.authService.saveStorage('tema', 'claro');
    } else if (tema == 'claro') {
      this.authService.saveStorage('tema', 'escuro');
    }
    this.colorir();
  }

  colorir() {
    const tema = this.authService.getStorage('tema');
    if (tema == 'escuro' || tema == null) {
      this.escuro = true;
      document.documentElement.setAttribute('data-theme', "escuro");
    } else if (tema == 'claro') {
      this.escuro = false;
      // console.log("claro");
      document.documentElement.setAttribute('data-theme', "claro");
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
