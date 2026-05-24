import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OnlyAlphanumericDirective } from '../../../diretivas/only-alphanumeric/only-alphanumeric.divective';
import { TogglePasswordDirective } from '../../../diretivas/only-alphanumeric/toggle-password.directive';
import { AuthService } from '../../../services/auth/auth.service';
import { AuthModalMode, AuthModalService, AuthModalState } from '../../../services/auth/auth-modal.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TogglePasswordDirective, OnlyAlphanumericDirective],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss',
})
export class AuthModalComponent implements OnInit, OnDestroy {
  state: AuthModalState = { open: false, mode: 'login' };

  tentandoLogar = false;
  tentandoCadastrar = false;

  credentials = { username: '', password: '' };
  user = { username: '', email: '', password: '', dataNascimento: '' };

  errorMessage: string = '';
  redirectUrl: string | null = null;

  private subscription?: Subscription;

  constructor(
    private authModalService: AuthModalService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.authModalService.state$.subscribe((state) => {
      const wasClosed = !this.state.open && state.open;
      this.state = state;

      if (wasClosed) {
        this.resetEphemeralState();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  close(): void {
    this.authModalService.close();
  }

  setMode(mode: AuthModalMode): void {
    this.errorMessage = '';
    this.tentandoLogar = false;
    this.tentandoCadastrar = false;
    this.authModalService.setMode(mode);
  }

  private resetEphemeralState(): void {
    this.errorMessage = '';
    this.tentandoLogar = false;
    this.tentandoCadastrar = false;
    this.redirectUrl = this.authService.getStorage('redirectUrl');
  }

  login(): void {
    if (this.tentandoLogar) return;

    this.tentandoLogar = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response: { token: any; username?: string; email?: string }) => {
        this.authService.saveToken(response.token);

        const username = response.username ?? this.credentials.username;
        if (username) this.authService.saveStorage('username', username);
        if (response.email) this.authService.saveStorage('email', response.email);

        this.authService.getDataNascimento().subscribe({
          next: (res) => {
            const dataNascimento = res.data;
            this.authService.saveStorage('datanascimento', dataNascimento);

            const redirectUrl = this.authService.getStorage('redirectUrl');
            this.authService.deleteStorage('redirectUrl');

            this.close();
            if (redirectUrl) this.router.navigateByUrl(redirectUrl);
          },
          error: () => {
            const redirectUrl = this.authService.getStorage('redirectUrl');
            this.authService.deleteStorage('redirectUrl');

            this.close();
            if (redirectUrl) this.router.navigateByUrl(redirectUrl);
          },
        });
      },
      error: (err: any) => {
        this.tentandoLogar = false;
        this.errorMessage = err.error || 'Erro ao fazer login. Tente novamente.';
      },
    });
  }

  register(): void {
    if (this.tentandoCadastrar) return;

    this.tentandoCadastrar = true;
    this.errorMessage = '';

    this.authService.register(this.user).subscribe({
      next: (response: { token: any; username?: string; email?: string }) => {
        this.authService.saveToken(response.token);

        const username = response.username ?? this.user.username;
        if (username) this.authService.saveStorage('username', username);
        const email = response.email ?? this.user.email;
        if (email) this.authService.saveStorage('email', email);

        this.authService.getDataNascimento().subscribe({
          next: (res) => {
            const dataNascimento = res.data;
            this.authService.saveStorage('datanascimento', dataNascimento);

            const redirectUrl = this.authService.getStorage('redirectUrl');
            this.authService.deleteStorage('redirectUrl');

            this.close();
            if (redirectUrl) this.router.navigateByUrl(redirectUrl);
          },
          error: () => {
            const redirectUrl = this.authService.getStorage('redirectUrl');
            this.authService.deleteStorage('redirectUrl');

            this.close();
            if (redirectUrl) this.router.navigateByUrl(redirectUrl);
          },
        });
      },
      error: (err: any) => {
        this.tentandoCadastrar = false;
        this.errorMessage = err.error || 'Erro ao cadastrar. Tente novamente.';
      },
    });
  }
}
