import {MessageResponseWs} from './MessageResponseWs';

export interface ChatResponse {
  usernameDono: string;
  salaNome: string;
  messages: MessageResponseWs[];
}
