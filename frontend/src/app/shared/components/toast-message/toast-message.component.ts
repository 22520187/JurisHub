import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-toast-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-message.component.html',
  styleUrl: './toast-message.component.scss',
})
export class ToastMessageComponent implements OnChanges, OnDestroy {
  @Input() type: ToastType = 'success';
  @Input() title = '';
  @Input() message = '';
  @Input() visible = false;
  @Input() duration?: number;  
  @Input() top = '24px';

  @Output() close = new EventEmitter<void>();

  private timer: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.startAutoClose();
    }
  }

  private startAutoClose() {
    // clear timer cũ nếu có
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // nếu không truyền duration thì không auto close
    if (!this.duration) return;

    this.timer = setTimeout(() => {
      this.onClose();
    }, this.duration * 1000);
  }

  onClose() {
    this.visible = false;
    this.close.emit();

    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  get iconPath(): string {
    return this.type === 'success'
      ? 'assets/shared-ui/icon/icn-circle-success.svg'
      : 'assets/shared-ui/icon/icn-circle-warning.svg';
  }
}