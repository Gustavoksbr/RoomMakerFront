import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { WebSocketService } from '../../../../../services/websocket/websocket.service';
import { FormsModule } from '@angular/forms';
import {MessageResponseWs} from './MessageResponseWs';
import { jest } from '@jest/globals';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let webSocketServiceMock: any;

  beforeEach(async () => {
    webSocketServiceMock = {
      connect: jest.fn(),
      sendMessage: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ChatComponent],
      providers: [
        { provide: WebSocketService, useValue: webSocketServiceMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should connect to websocket on init', () => {
    component.ngOnInit();
    expect(webSocketServiceMock.connect).toHaveBeenCalled();
  });

  it('should send message', () => {
    component.message = { message: 'test message' };
    component.sendMessage();
    expect(webSocketServiceMock.sendMessage).toHaveBeenCalledWith(component.app + '/chat', component.message);
  });

  it('should add received message to chat', () => {
    const testMessage = { message: 'test message' };
    webSocketServiceMock.connect.mockImplementation((onConnect: any, topic: any, onMessage: (arg0: { message: string; }) => void) => {
      onMessage(testMessage);
    });

    component.ngOnInit();
    expect(component.chat.includes(<MessageResponseWs>testMessage)).toBeTruthy();
  });
});
