export interface Sala {
  id: string;
  usernameDono: string;
  nome: string;
  categoria: string;
  senha: string;
  qtdCapacidade: number;
  disponivel: boolean;
  usernameParticipantes: string[];
}
