import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      // Se o usuário estiver autenticado e na rota "default", redireciona para "salas"
      if (state.url === '/default') {
        this.router.navigate(['/salas']);
        return false;
      }
      return true;
    } else {
      // Se não estiver autenticado, redireciona para "login"
      this.router.navigate(['/login']);
      return false;
    }
  }
}
