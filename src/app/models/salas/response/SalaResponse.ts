export interface SalaResponse {
  id: string;
  usernameDono: string;
  nome: string;
  categoria: string;
  qtdCapacidade: number | null; // null = sem limite (infinito)
  disponivel: boolean;
  publica: boolean;
  usernameParticipantes: string[];
}

// não tem o campo senha
// possui campo publica
