import { Directive, HostListener } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[onlyAlphanumeric]'
})
export class OnlyAlphanumericDirective {

  // ✅ Permite apenas letras e números
  private regex = /^[a-zA-Z0-9]*$/;

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const tecla = event.key;

    // ✅ Permite teclas de controle
    const teclasPermitidas = [
      'Backspace', 'Tab', 'Enter', 'ArrowLeft',
      'ArrowRight', 'Delete'
    ];

    if (teclasPermitidas.includes(tecla)) {
      return;
    }

    // ✅ BLOQUEIA imediatamente
    if (!/^[a-zA-Z0-9]$/.test(tecla)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const texto = event.clipboardData?.getData('text') || '';

    // ✅ BLOQUEIA colagem inválida
    if (!this.regex.test(texto)) {
      event.preventDefault();
    }
  }
}
