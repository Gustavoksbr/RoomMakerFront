import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { AuthModalService } from '../services/auth/auth-modal.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private authModalService: AuthModalService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      // Salva a URL que o usuário tentou acessar antes de solicitar login
      this.authService.saveStorage('redirectUrl', state.url);

      // Mantém o usuário em uma rota pública e abre a modal de login
      this.router.navigate(['/salas']);
      this.authModalService.openLogin();
      return false;
    }
  }
}
