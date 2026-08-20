import { Component, EventEmitter, Input, Output } from '@angular/core';

import { LanceDetalhado } from '../../../../../../../services/xadrez/partida';

/** Um par de lances (brancas e pretas) de uma mesma jogada numerada. */
interface ParDeLances {
    readonly numero: number;
    readonly brancas: string;
    readonly pretas: string | null;
}

/**
 * A lista de lances e os botões de navegação.
 *
 * Só de apresentação: recebe os lances e qual está sendo exibido, e devolve
 * cliques. Quem decide o que fazer com isso é o componente do xadrez — assim
 * este não precisa saber que existe partida, servidor ou pré-lance.
 */
@Component({
    selector: 'app-navegador-lances',
    standalone: true,
    imports: [],
    templateUrl: './navegador-lances.component.html',
    styleUrl: './navegador-lances.component.scss',
})
export class NavegadorLancesComponent {

    @Input() lances: readonly LanceDetalhado[] = [];
    /** Quantos lances estão sendo exibidos. 0 = posição inicial. */
    @Input() ply: number = 0;

    @Output() irParaPly = new EventEmitter<number>();

    get total(): number {
        return this.lances.length;
    }

    get vendoHistorico(): boolean {
        return this.ply < this.total;
    }

    get podeVoltar(): boolean {
        return this.ply > 0;
    }

    get pares(): ParDeLances[] {
        const pares: ParDeLances[] = [];
        for (let i = 0; i < this.lances.length; i += 2) {
            pares.push({
                numero: i / 2 + 1,
                brancas: this.lances[i].sanExibicao,
                pretas: this.lances[i + 1]?.sanExibicao ?? null,
            });
        }
        return pares;
    }

    /** O ply a que este lance corresponde. */
    private plyDe(numeroDoPar: number, brancas: boolean): number {
        return (numeroDoPar - 1) * 2 + (brancas ? 1 : 2);
    }

    ehAtual(numeroDoPar: number, brancas: boolean): boolean {
        return this.ply === this.plyDe(numeroDoPar, brancas);
    }

    selecionar(numeroDoPar: number, brancas: boolean): void {
        this.irParaPly.emit(this.plyDe(numeroDoPar, brancas));
    }

    primeiro(): void { this.irParaPly.emit(0); }
    anterior(): void { this.irParaPly.emit(this.ply - 1); }
    proximo(): void { this.irParaPly.emit(this.ply + 1); }
    ultimo(): void { this.irParaPly.emit(this.total); }
}
