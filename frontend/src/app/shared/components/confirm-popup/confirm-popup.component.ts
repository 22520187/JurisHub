import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { ButtonGroupClickEvent, ButtonGroupComponent, ButtonGroupItem } from '../button-group/button-group.component';

export type ConfirmPopupMode = 'confirm' | 'warning' | 'delete' | 'success' | 'error';

export interface ConfirmPopupButton extends ButtonGroupItem {
  action?: 'cancel' | 'confirm' | string;
}

@Component({
  selector: 'tellerapp-confirm-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonGroupComponent],
  templateUrl: './confirm-popup.component.html',
  styleUrls: ['./confirm-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmPopupComponent {
  private static readonly CLOSE_ICON = '<img src="/assets/shared-ui/icon/icn-exit.svg" alt="" aria-hidden="true" width="16" height="16" />';

  // Illustrations
  private static readonly ILLUSTRATION_SUCCESS = '/assets/shared-ui/icon/icn-success-confirm.svg';
  private static readonly ILLUSTRATION_CONFIRM = '/assets/shared-ui/icon/icn-info-confirm.svg';
  private static readonly ILLUSTRATION_WARNING = '/assets/shared-ui/icon/icn-warning-confirm.svg';
  private static readonly ILLUSTRATION_DELETE = '/assets/shared-ui/icon/icn-warning-confirm.svg';
  private static readonly ILLUSTRATION_ERROR = '/assets/shared-ui/icon/icn-error-confirm.svg';

  @Input() title = 'Xác nhận';
  @Input() width = '400px';
  @Input() prompt = '';
  @Input() promptAlignLeft = false;
  @Input() textareaVisible = false;
  @Input() textareaLabel = 'Nội dung';
  @Input() textareaPlaceholder = 'Nhập nội dung...';
  @Input() textareaRows = 4;
  @Input() textareaMaxLength = 255;
  @Input() textareaValue = '';
  @Input() buttons: ConfirmPopupButton[] | null = null;
  @Input() confirmButtonMode: ConfirmPopupMode = 'confirm';
  @Input() confirmButtonLabel?: string;
  @Input() cancelButtonLabel = 'Quay lại';
  @Input() showCancelButton = true;
  @Input() autoCloseOnConfirm = true;

  /**
   * When true, the textarea input becomes required before confirming.
   */
  @Input() requireData = false;
  @Input() requiredErrorMessage = 'Vui lòng nhập lí do';

  /** Inline error message displayed when required data is missing */
  errorMessage = '';


  @Output() closed = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  @Output() buttonClick = new EventEmitter<ButtonGroupClickEvent>();
  @Output() textareaValueChange = new EventEmitter<string>();

  protected readonly closeIcon = ConfirmPopupComponent.CLOSE_ICON;
  protected readonly closeButtonStyle = {
    width: '24px',
    height: '24px',
    minWidth: '24px',
    padding: '0',
    borderRadius: '6px'
  };

  protected get illustrationSrc(): string {
    switch (this.confirmButtonMode) {
      case 'warning':
        return ConfirmPopupComponent.ILLUSTRATION_WARNING;
      case 'delete':
        return ConfirmPopupComponent.ILLUSTRATION_DELETE;
      case 'success':
        return ConfirmPopupComponent.ILLUSTRATION_SUCCESS;
      case 'error':
        return ConfirmPopupComponent.ILLUSTRATION_ERROR;
      default:
        return ConfirmPopupComponent.ILLUSTRATION_CONFIRM;
    }
  }

  protected get resolvedConfirmLabel(): string {
    if (this.confirmButtonLabel) {
      return this.confirmButtonLabel;
    }

    switch (this.confirmButtonMode) {
      case 'warning':
        return 'Đã hiểu';
      case 'delete':
        return 'Xác nhận xóa';
      case 'success':
        return 'Đóng';
      case 'error':
        return 'Đóng';
      default:
        return 'Xác nhận';
    }
  }

  protected get resolvedButtons(): ConfirmPopupButton[] {
    if (this.buttons && this.buttons.length > 0) {
      return this.buttons;
    }

    const items: ConfirmPopupButton[] = [];

    if (this.confirmButtonMode === 'warning') {
      items.push({
        label: this.resolvedConfirmLabel,
        variant: "custom",
        customStyle: {
          minWidth: '110px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: 'linear-gradient(75.39deg, #00426F 0%, #018DE3 100%)',
          fontWeight: '500',
          color: '#FFFFFF'
        },
        data: 'confirm',
      });
    } else if (this.confirmButtonMode === 'success') {
      items.push({
        label: this.resolvedConfirmLabel,
        variant: "custom",
        customStyle: {
          minWidth: '110px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(75.39deg, #00426F 0%, #018DE3 100%)',
          fontWeight: '500',
          color: '#FFFFFF'
        },
        data: 'confirm',
      });
    } else if (this.confirmButtonMode === 'error') {
      items.push({
        label: this.resolvedConfirmLabel,
        variant: "custom",
        customStyle: {
          minWidth: '110px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: '#D92D20',
          fontWeight: '500',
          color: '#FFFFFF'
        },
        data: 'confirm',
      });
    } else {
      if (this.showCancelButton) {
        items.push({
          label: this.cancelButtonLabel,
          variant: 'outline',
          customStyle: {
            color: '#374151',
            borderColor: 'rgba(13, 46, 67, 0.24)',
            borderRadius: '8px',
            minWidth: '110px',
            height: '36px',
            fontWeight: '500',
          },
          data: 'cancel',
        });
      }

      items.push({
        label: this.resolvedConfirmLabel,
        variant: "custom",
        customStyle: {
          minWidth: '110px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: this.confirmButtonMode === 'delete' ? '#D0121C' : 'linear-gradient(75.39deg, #00426F 0%, #018DE3 100%)',
          fontWeight: '500',
          color: '#FFFFFF'
        },
        data: 'confirm',
      });
    }

    return items;
  }

  onClosed(): void {
    this.closed.emit();
  }

  onTextareaChange(value: string): void {
    const nextValue = (value ?? '').slice(0, this.textareaMaxLength);
    this.textareaValue = nextValue;
    this.textareaValueChange.emit(nextValue);
    // Clear error when user types
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  onButtonClick(event: ButtonGroupClickEvent): void {
    this.buttonClick.emit(event);

    const button = event.button as ConfirmPopupButton;
    const action = button.action ?? button.data;
    if (action === 'cancel') {
      this.cancel.emit();
      this.closed.emit();
      return;
    }

    if (action === 'confirm') {
      // Validate required data if enabled
      if (this.requireData && (!this.textareaValue || this.textareaValue.trim().length === 0)) {
        this.errorMessage = this.requiredErrorMessage;
        return;
      }
      this.errorMessage = '';
      this.confirm.emit(this.textareaValue);
      if (this.autoCloseOnConfirm) {
        this.closed.emit();
      }
    }
  }
}
