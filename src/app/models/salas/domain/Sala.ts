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

export const categoriaMap: Record<string, string> = {
  ["chat"]: "Bate-papo",
  ["jokenpo"]: "Jokenpô",
  ["tictactoe"]: "Jogo da Velha",
  ["whoistheimpostor"]: "Quem é o impostor?",
};
