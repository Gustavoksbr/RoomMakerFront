import {Component, Input} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth/auth.service';
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
  constructor(private authService: AuthService, private router: Router) {
  }
@Input() paginaAtual: PaginaAtual = PaginaAtual.SALAS;

  protected readonly PaginaAtual = PaginaAtual;
}
