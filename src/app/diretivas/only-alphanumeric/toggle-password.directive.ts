import { Directive, ElementRef, Renderer2, OnInit } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[togglePassword]'
})
export class TogglePasswordDirective implements OnInit {
  private mostrando = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    const input = this.el.nativeElement;

    // ✅ Cria botão
    const botao = this.renderer.createElement('button');
    this.renderer.setAttribute(botao, 'type', 'button');

    // ✅ Ícone
    const icone = this.renderer.createElement('i');
    this.renderer.addClass(icone, 'fa');
    this.renderer.addClass(icone, 'fa-eye');
    this.renderer.appendChild(botao, icone);

    // ✅ Wrapper SEM forçar largura
    const wrapper = this.renderer.createElement('div');
    this.renderer.setStyle(wrapper, 'position', 'relative');
    this.renderer.setStyle(wrapper, 'display', 'inline-block');

    // ✅ Apenas espaço para o botão
    this.renderer.setStyle(input, 'padding-right', '20%');

    // ✅ Botão sempre na ponta direita do input
    this.renderer.setStyle(botao, 'position', 'absolute');
    this.renderer.setStyle(botao, 'right', '10px');
    this.renderer.setStyle(botao, 'top', '50%');
    this.renderer.setStyle(botao, 'transform', 'translateY(-50%)');
    this.renderer.setStyle(botao, 'background', 'transparent');
    this.renderer.setStyle(botao, 'border', 'none');
    this.renderer.setStyle(botao, 'cursor', 'pointer');
    this.renderer.setStyle(botao, 'color', 'var(--text-color)');
    this.renderer.setStyle(botao, 'padding', '0');

    // ✅ Move o input corretamente
    const parent = input.parentNode;
    this.renderer.insertBefore(parent, wrapper, input);
    this.renderer.appendChild(wrapper, input);
    this.renderer.appendChild(wrapper, botao);

    // ✅ Clique
    this.renderer.listen(botao, 'click', () => {
      this.mostrando = !this.mostrando;
      input.type = this.mostrando ? 'text' : 'password';

      if (this.mostrando) {
        this.renderer.removeClass(icone, 'fa-eye');
        this.renderer.addClass(icone, 'fa-eye-slash');
      } else {
        this.renderer.removeClass(icone, 'fa-eye-slash');
        this.renderer.addClass(icone, 'fa-eye');
      }
    });
  }
}
