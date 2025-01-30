import {Component, OnInit} from '@angular/core';
import {WebSocketService} from '../../../services/websocket/websocket.service';
import {Client} from '@stomp/stompjs';
import {JsonPipe} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {SalasService} from '../../../services/salas/salas.service';
import {AuthService} from '../../../services/auth.service';
import {API_CONFIG} from '../../../config/api.config';

@Component({
  selector: 'app-hacker',
  standalone: true,
  imports: [
    JsonPipe
  ],
  templateUrl: './hacker.component.html',
  styleUrl: './hacker.component.scss'
})
export class HackerComponent implements OnInit{
  private client : Client = new Client();
  public salaContent: any;
  public teste :any;

  constructor(private websocketService : WebSocketService, private http : HttpClient, private salaService: SalasService, private authService: AuthService) {

  }
  ngOnInit(): void {
    this.client = this.websocketService.connectHacker(this.client);
  }

  fetchSala(): void {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem("token")}` };
    this.http.get(API_CONFIG.BASE_URL+"/sala", { headers }).subscribe((data: any) => {
      this.salaContent = data;
    });
  }

  fetchSaladoService(): void {
    this.salaService.listar().subscribe((data: any) => {
      this.salaContent = data;
    });
  }

  fetchAuthService(): void {
    this.http.get(API_CONFIG.BASE_URL+"/sala", {headers : this.authService.getHeaders()}).subscribe((data: any) => {
      this.salaContent = data;
    });
  }
  unsucscribe() {
    this.websocketService.unsubscribe(this.client, "/topic/sala/dono/nomesala/otrapessoa/chat")
  }

}
