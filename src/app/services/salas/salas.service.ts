import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {SalaResponse} from '../../models/salas/response/SalaResponse';
import {AuthService} from '../auth.service';
import {Sala} from '../../models/salas/domain/Sala';
import {CriarSalaRequest} from '../../models/salas/request/CriarSalaRequest';
import {EntrarSalaRequest} from '../../models/salas/request/EntrarSalaRequest';

@Injectable({
  providedIn: 'root'
})
export class SalasService {
  private readonly API = 'http://localhost:8080/sala';
  constructor(private http: HttpClient,private authService:AuthService) {
  }
  private getHeaders(): HttpHeaders {
    return  this.authService.getHeaders();
  }
 listar(): Observable<SalaResponse[]> {
  return this.http.get<SalaResponse[]>(this.API, { headers: this.getHeaders() });
}
  criar(sala:CriarSalaRequest):Observable<SalaResponse>{
    return this.http.post<SalaResponse>(this.API,sala,{ headers: this.getHeaders() });

  }
  buscarPorUsernameDonoESalaNome(usernameDono:string,salaNome:string):Observable<SalaResponse>{
    const url = `${this.API}/${usernameDono}/${salaNome}`;
    return this.http.get<SalaResponse>(url,{ headers: this.getHeaders() });
  }

  entrarNaSala(sala:EntrarSalaRequest):Observable<SalaResponse>{
    const url = `${this.API}/${sala.usernameDono}/${sala.nome}`;
    console.log("url é:"+url);
    return this.http.post<SalaResponse>(url,sala,{ headers: this.getHeaders() });
  }

  sairDaSala(usernameDono:string,salaNome:string,username:string):Observable<SalaResponse>{
    const url = `${this.API}/${usernameDono}/${salaNome}/${username}`;
    return this.http.delete<SalaResponse>(url,{ headers: this.getHeaders() });
  }


  // excluir(id:string):Observable<Pensamento>{
  //   const url = `${this.API}/${id}`; //http://localhost:3000/pensamentos/{id}
  //   return this.http.delete<Pensamento>(url);
  // }
  // buscarPorId(id:string):Observable<Pensamento>
  // {
  //   const url = `${this.API}/${id}`;
  //   return this.http.get<Pensamento>(url);
  // }
  //
  // editar(pensamento: Pensamento): Observable<Pensamento>{
  //   const url = `${this.API}/${pensamento.id}`;
  //   return this.http.put<Pensamento>(url,pensamento);
  // }
}
