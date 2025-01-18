import {Component, Input, OnInit} from '@angular/core';
import {Client} from '@stomp/stompjs';
import {MessageResponseWs} from '../../chat/MessageResponseWs';
import {WebSocketService} from '../../../../../../services/websocket/websocket.service';

@Component({
  selector: 'app-coup',
  standalone: true,
  imports: [],
  templateUrl: './coup.component.html'
})
export class CoupComponent {

}
