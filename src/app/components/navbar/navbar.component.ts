import {Component, Input} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth/auth.service';
import {AuthModalService} from '../../services/auth/auth-modal.service';
import {PaginaAtual} from './PaginaAtual';
import {NgClass} from '@angular/common';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    NgClass
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  constructor(private authService: AuthService, private router: Router, private authModalService: AuthModalService) {
  }
@Input() paginaAtual: PaginaAtual = PaginaAtual.SALAS;

  get suasSalasDesabilitado(): boolean {
    return !this.authService.isLoggedIn();
  }

  navegarParaSuasSalas(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/suas-salas']);
    } else {
      this.authModalService.openLogin();
    }
  }

  protected readonly PaginaAtual = PaginaAtual;
}
