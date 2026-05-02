import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
    selector: 'input[noAutocomplete]',
    standalone: true
})
export class NoAutocompleteDirective {
    @Input() type: string = 'text';

    @HostBinding('attr.autocomplete')
    get autocomplete(): string {
        // Chrome ignora "off" em campos de senha — "new-password" força desabilitar
        return this.type === 'password' ? 'new-password' : 'off';
    }
}
