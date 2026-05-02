import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_CONFIG } from '../config/api.config';
import { XadrezResponse } from '../../models/xadrez/XadrezResponse';

@Injectable({
    providedIn: 'root'
})
export class XadrezService {
    private readonly API = API_CONFIG.BASE_URL + '/categorias/xadrez';

    constructor(private http: HttpClient, private authService: AuthService) { }

    mostrar(usernameDono: string, nomeSala: string): Observable<XadrezResponse> {
        const url = `${this.API}/${usernameDono}/${nomeSala}/mostrar`;
        return this.http.get<XadrezResponse>(url, { headers: this.authService.getHeaders() });
    }
}
