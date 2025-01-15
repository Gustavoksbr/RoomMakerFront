export interface SalaResponse {
  id: string;
  usernameDono: string;
  nome: string;
  categoria: string;
  qtdCapacidade: number;
  disponivel: boolean;
  publica: boolean;
  usernameParticipantes: string[];
}

// não tem o campo senha
// possui campo publica
