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
  ["xadrez"]: "Xadrez às cegas",
};

// Capacidade "infinita" — exibida como ∞ na UI, mas internamente é este número
export const CAPACIDADE_INFINITA = 99_999;

export function formatarCapacidade(qtd: number | null | undefined): string {
  if (qtd === null || qtd === undefined || qtd >= CAPACIDADE_INFINITA) return '∞';
  return String(qtd);
}
