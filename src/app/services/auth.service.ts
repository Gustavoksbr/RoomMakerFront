import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import {CookieService} from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080'; // Substitua pelo endpoint do backend

  constructor(private http: HttpClient, private router: Router,private cookieService:CookieService) {}

  getUsername(): Observable<any>{
    return this.http.get(`${this.apiUrl}/username`, { headers: this.getHeaders() });
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

saveStorage(chave:string,valor:string){
  localStorage.setItem(chave, valor);
}
getStorage(chave:string){
  return localStorage.getItem(chave);
}
deleteStorage(chave:string){
  localStorage.removeItem(chave);
}

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.router.navigate(['/login']).then(r =>console.log("logout") );
  }
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
