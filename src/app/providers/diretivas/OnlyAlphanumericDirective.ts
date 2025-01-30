import { Directive, HostListener } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appOnlyAlphanumeric]'
})
export class OnlyAlphanumericDirective {

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];

    // Permitir teclas de controle (como Backspace, Tab, etc.)
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Permitir apenas letras e números
    const regex = /^[a-zA-Z0-9]$/;
    if (!regex.test(event.key)) {
      event.preventDefault();
    }
  }
}
