import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ButtonComponent,
  ButtonVariant,
  ButtonSize,
  ButtonShape,
  ButtonCustomStyle,
  ButtonType,
} from '../button/button.component';

// ----------------------------------------------------------------
// ButtonGroupItem — definition for each button in the group
// ----------------------------------------------------------------
export interface ButtonGroupItem {
  /** Text label */
  label?: string;

  /** Visual preset — overrides the group default */
  variant?: ButtonVariant;

  /** Size — overrides the group default */
  size?: ButtonSize;

  /** Shape — overrides the group default (ignored in attached mode) */
  shape?: ButtonShape;

  /** Fine-grained style overrides */
  customStyle?: ButtonCustomStyle;

  /** Background image URL */
  backgroundImage?: string;

  /** Opacity of background image (0–1) */
  backgroundImageOpacity?: number;

  /** SVG string for left icon */
  iconLeft?: string;

  /** SVG string for right icon */
  iconRight?: string;

  /** Badge value */
  badge?: string | number;

  /** HTML button type */
  type?: ButtonType;

  /** Disable this specific button */
  disabled?: boolean;

  /** Show loading spinner on this button */
  loading?: boolean;

  /** Label to show while loading */
  loadingText?: string;

  /** Accessibility label */
  ariaLabel?: string;

  /** Arbitrary extra data to carry through click events */
  data?: any;
}

// ----------------------------------------------------------------
// ButtonGroupClickEvent
// ----------------------------------------------------------------
export interface ButtonGroupClickEvent {
  event: MouseEvent;
  index: number;
  button: ButtonGroupItem;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
@Component({
  selector: 'tellerapp-button-group',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './button-group.component.html',
  styleUrls: ['./button-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonGroupComponent {

  // ---- Data ----

  /** Array of button definitions */
  @Input() buttons: ButtonGroupItem[] = [];

  // ---- Group-level defaults (overridable per button) ----

  /** Default variant applied to all buttons unless overridden */
  @Input() defaultVariant: ButtonVariant = 'primary';

  /** Default size applied to all buttons unless overridden */
  @Input() defaultSize: ButtonSize = 'md';

  /** Default shape applied to all buttons unless overridden */
  @Input() defaultShape: ButtonShape = 'default';

  // ---- Layout ----

  /**
   * Horizontal (default) or vertical stacking.
   */
  @Input() direction: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Gap between buttons in pixels (ignored in attached mode).
   * @default 8
   */
  @Input() gap: number = 8;

  /**
   * Align buttons within the group.
   * 'left' | 'center' | 'right' | 'space-between'
   */
  @Input() align: 'left' | 'center' | 'right' | 'space-between' = 'left';

  /**
   * When true, buttons are joined together with no gap,
   * sharing borders — exactly like the screenshot (In | Lưu | Gửi duyệt).
   */
  @Input() attached: boolean = false;

  /**
   * Stretch the group and each button to full parent width.
   */
  @Input() block: boolean = false;

  /** Accessibility label for the group element */
  @Input() ariaLabel?: string;

  // ---- Events ----

  /** Fires when any button in the group is clicked */
  @Output() buttonClick = new EventEmitter<ButtonGroupClickEvent>();

  // ----------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------

  onButtonClick(event: MouseEvent, index: number, btn: ButtonGroupItem): void {
    this.buttonClick.emit({ event, index, button: btn });
  }

  trackByBtn(index: number, btn: ButtonGroupItem): any {
    return btn.data ?? btn.label ?? index;
  }
}