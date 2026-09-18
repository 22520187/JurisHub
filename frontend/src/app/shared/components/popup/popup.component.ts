import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonComponent } from '../button/button.component';

@Component({
    selector: 'tellerapp-popup',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    templateUrl: './popup.component.html',
    styleUrl: './popup.component.scss',
})
export class PopupComponent {
    private static readonly EXIT_ICON =
        '<img src="/assets/shared-ui/icon/icn-exit.svg" alt="" aria-hidden="true" width="16" height="16" />';

    @Input() title: string = '';
    @Input() width: string = '800px';
    @Input() showHeader: boolean = true;
    @Output() closed = new EventEmitter<void>();

    protected readonly EXIT_ICON = PopupComponent.EXIT_ICON;
    protected readonly CLOSE_BUTTON_STYLE = {
        width: '24px',
        height: '24px',
        minWidth: '24px',
        padding: '0',
        borderRadius: '6px'
    };

    onClose() {
        this.closed.emit();
    }

    onBackdropClick(event: MouseEvent) {
        if ((event.target as HTMLElement).classList.contains('backdrop')) {
            this.onClose();
        }
    }
}
