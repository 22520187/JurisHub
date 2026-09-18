import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-modal-custom',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-custom.html',
  styleUrls: ['./modal-custom.scss']
})
export class ModalCustomComponent {
  @Input() title: string = '';
  @Input() showFooter: boolean = false;
  @Input() showCloseIcon: boolean = true;
  @Input() isOpen: boolean = false;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  
  
  @Output() closeDialog = new EventEmitter<void>();

  onClose() {
    this.closeDialog.emit();
  }
}
