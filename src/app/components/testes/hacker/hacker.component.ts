import {Component, OnInit} from '@angular/core';
import {WebSocketService} from '../../../services/websocket/websocket.service';
import {Client} from '@stomp/stompjs';

@Component({
  selector: 'app-hacker',
  standalone: true,
  imports: [],
  templateUrl: './hacker.component.html',
  styleUrl: './hacker.component.scss'
})
export class HackerComponent implements OnInit{
  private client : Client = new Client();

  constructor(private websocketService : WebSocketService) {

  }
  unsucscribe() {
    this.websocketService.unsubscribe(this.client, "/topic/sala/dono/nomesala/otrapessoa/chat")
  }

  ngOnInit(): void {
   this.client = this.websocketService.connectHacker(this.client);
  }
}
