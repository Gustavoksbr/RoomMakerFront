export interface CriarSalaRequest {
  nome: string;
  categoria: string;
  senha: string;
  qtdCapacidade: number | null; // null = sem limite (infinito)
}
