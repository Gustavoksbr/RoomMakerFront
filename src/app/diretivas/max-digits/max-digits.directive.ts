import { Directive, HostListener, Input, ElementRef } from '@angular/core';

/**
 * Limita a quantidade de dígitos digitados em um input[type=number].
 * Uso: <input type="number" [maxDigits]="5">
 * Necessário pois maxlength não funciona em input[type=number].
 */
@Directive({
    selector: 'input[maxDigits]',
    standalone: true
})
export class MaxDigitsDirective {
    @Input() maxDigits: number = 5;

    constructor(private el: ElementRef<HTMLInputElement>) { }

    @HostListener('input')
    onInput(): void {
        const input = this.el.nativeElement;
        const value = input.value;
        if (value.length > this.maxDigits) {
            input.value = value.slice(0, this.maxDigits);
            // dispara o evento para o ngModel atualizar
            input.dispatchEvent(new Event('input'));
        }
    }
}
