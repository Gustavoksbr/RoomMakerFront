import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = API_CONFIG.BASE_URL;
  private static readonly STORAGE_PREFIX = 'roommaker_';

  // private apiUrl = 'http://localhost:8080';
  constructor(private http: HttpClient, private router: Router, private cookieService: CookieService) { }

  getUsername(): Observable<any> {
    return this.http.get(`${this.apiUrl}/username`, { headers: this.getHeaders() });
  }

  //chamadas para api
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cadastro`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
  forget(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuario/esquecisenha`, credentials);
  }
  redefinirSenha(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuario/novasenha`, credentials);
  }

  //chamadas para storage
  private storageKey(chave: string): string {
    if (chave.startsWith(AuthService.STORAGE_PREFIX)) return chave;
    return `${AuthService.STORAGE_PREFIX}${chave}`;
  }

  saveStorage(chave: string, valor: string) {
    localStorage.setItem(this.storageKey(chave), valor);
  }

  getStorage(chave: string) {
    const key = this.storageKey(chave);
    const value = localStorage.getItem(key);
    if (value != null) return value;

    // Fallback para chaves antigas (sem prefixo) e migra automaticamente.
    if (!chave.startsWith(AuthService.STORAGE_PREFIX)) {
      const legacyValue = localStorage.getItem(chave);
      if (legacyValue != null) {
        localStorage.setItem(key, legacyValue);
        localStorage.removeItem(chave);
        return legacyValue;
      }
    }

    return null;
  }

  deleteStorage(chave: string) {
    localStorage.removeItem(this.storageKey(chave));

    // Remove também a versão antiga (sem prefixo), por segurança.
    if (!chave.startsWith(AuthService.STORAGE_PREFIX)) {
      localStorage.removeItem(chave);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  saveToken(token: string): void {
    this.saveStorage('token', token);
  }
  getToken(): string | null {
    return this.getStorage('token');
  }
  getHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) return new HttpHeaders();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
  logout(from401 = false): void {
    this.deleteStorage('token');
    this.deleteStorage('username');
    this.deleteStorage('datanascimento');
    this.deleteStorage('email');

    // Rotas /login e /register foram removidas: volta para uma rota pública.
    this.router.navigate(['/salas']).then(() => {
      if (from401) window.location.reload();
    });
  }

  getDataNascimento(): Observable<any> {
    return this.http.get(`${this.apiUrl}/datanascimento`, { headers: this.getHeaders() });
  }

  // [CANCELADO] alterarUsername - username é usado como chave em todas as coleções do MongoDB,
  // atualizar exigiria cascade update manual em salas, chats, jogos, etc.
  // alterarUsername(novoUsername: string): Observable<{ token: string }> {
  //   return this.http.patch<{ token: string }>(`${this.apiUrl}/usuario/username`, { novoUsername }, { headers: this.getHeaders() });
  // }

  // saveCookie(chave:string,valor:string){
  //   this.cookieService.set(chave,valor);
  // }
  // getCookie(chave:string){
  //   return this.cookieService.get(chave);
  // }
  // deleteCookie(chave:string){
  //   this.cookieService.delete
  // }
  // logout(): void {
  //   this.cookieService.delete('token');
  //   this.router.navigate(['/login']).then(r =>console.log("logout") );
  // }
  //
  //
  // saveToken(token: string): void {
  //   this.cookieService.set('token', token);
  // }
  //
  // getToken(): string | null {
  //   return this.cookieService.get('token');
  // }
}
