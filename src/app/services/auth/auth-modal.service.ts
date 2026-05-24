import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AuthModalMode = 'login' | 'register';

export interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
}

@Injectable({
  providedIn: 'root',
})
export class AuthModalService {
  private readonly stateSubject = new BehaviorSubject<AuthModalState>({
    open: false,
    mode: 'login',
  });

  readonly state$ = this.stateSubject.asObservable();

  openLogin(): void {
    this.stateSubject.next({ open: true, mode: 'login' });
  }

  openRegister(): void {
    this.stateSubject.next({ open: true, mode: 'register' });
  }

  setMode(mode: AuthModalMode): void {
    const current = this.stateSubject.getValue();
    this.stateSubject.next({ ...current, mode });
  }

  close(): void {
    const current = this.stateSubject.getValue();
    this.stateSubject.next({ ...current, open: false });
  }
}
