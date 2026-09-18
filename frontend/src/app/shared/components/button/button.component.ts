import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'danger-outline'
  | 'success'
  | 'warning'
  | 'custom'
  | 'gradient';         
        

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonShape = 'default' | 'rounded' | 'square';
export type ButtonType  = 'button' | 'submit' | 'reset';

export interface ButtonCustomStyle {
  /** Background color, supports any CSS value: hex, rgb, gradient, etc. */
  backgroundColor?: string;
  background?: string;
  /** Hover background (optional — auto-darkened if omitted) */
  backgroundColorHover?: string;
  /** Text / icon color */
  color?: string;
  /** Border color */
  borderColor?: string;
  /** Border width e.g. '1px' */
  borderWidth?: string;
  /** Box shadow override */
  boxShadow?: string;
  /** Hover box shadow override */
  boxShadowHover?: string;
  /** Font weight override */
  fontWeight?: string;
  /** Letter spacing override */
  letterSpacing?: string;
  /** Extra border radius override */
  borderRadius?: string;
  /** Icon size override for the button icon slot */
  iconSize?: string;
  /** Minimum width override */
  minWidth?: string;
  /** Width override */
  width?: string;
  /** Font size override */
  fontSize?: string;
  /** Height override */
  height?: string;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

@Component({
  selector: 'app-button, tellerapp-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {

  // ---- Appearance ----

  /** Text label shown inside the button */
  @Input() label?: string = '';

  /** Visual style preset */
  @Input() variant: ButtonVariant = 'primary';

  /** Size token */
  @Input() size: ButtonSize = 'md';

  /** Border-radius shape */
  @Input() shape: ButtonShape = 'default';

  /**
   * Fine-grained style overrides — used when variant = 'custom'
   * OR to override any individual token on any variant.
   */
  @Input() customStyle?: ButtonCustomStyle;

  /** URL to a background image rendered behind the label */
  @Input() backgroundImage?: string;

  /** Opacity of the background image (0–1) */
  @Input() backgroundImageOpacity: number = 0.2;

  /** SVG string rendered as left icon */
  @Input() iconLeft?: string;

  /** SVG string rendered as right icon */
  @Input() iconRight?: string;

  /** Badge text/number shown on the right side of the button */
  @Input() badge?: string | number;

  // ---- Behaviour ----

  /** HTML button type attribute */
  @Input() type: ButtonType = 'button';

  /** Disable the button */
  @Input() disabled: boolean = false;

  /**
   * Show loading spinner.
   * The button is automatically disabled while loading.
   */
  @Input() loading: boolean = false;

  /** Label to show while loading (replaces normal label) */
  @Input() loadingText?: string;

  /** Stretch to full width of parent */
  @Input() block: boolean = false;

  /** Aria label override (defaults to label) */
  @Input() ariaLabel?: string;

  // ---- Events ----

  @Output() btnClick = new EventEmitter<MouseEvent>();

  // ----------------------------------------------------------------
  // Host class binding
  // ----------------------------------------------------------------

  get hostClasses(): string {
    const classes: string[] = [
      `teller-btn--${this.variant}`,
      `teller-btn--${this.size}`,
    ];

    if (this.shape !== 'default') {
      classes.push(`teller-btn--${this.shape}`);
    }
    if (this.block) {
      classes.push('teller-btn--block');
    }
    if (!this.label && !this.loading) {
      classes.push('teller-btn--icon-only');
    }
    if (this.loading) {
      classes.push('teller-btn--loading');
    }

    return classes.join(' ');
  }

  // ----------------------------------------------------------------
  // Inline style binding (custom overrides via CSS variables)
  // ----------------------------------------------------------------

  get hostStyles(): Record<string, string> {
    const s = this.customStyle;
    if (!s) return {};

    const styles: Record<string, string> = {};

    if (s.background)           styles['--btn-bg']           = s.background;
    if (s.backgroundColor)      styles['--btn-bg']           = s.backgroundColor;
    if (s.backgroundColorHover) styles['--btn-bg-hover']     = s.backgroundColorHover;
    if (s.color)                styles['--btn-color']        = s.color;
    if (s.borderColor)          styles['--btn-border-color'] = s.borderColor;
    if (s.borderWidth)          styles['--btn-border-width'] = s.borderWidth;
    if (s.boxShadow)            styles['--btn-shadow']       = s.boxShadow;
    if (s.boxShadowHover)       styles['--btn-shadow-hover'] = s.boxShadowHover;
    if (s.fontWeight)           styles['--btn-font-weight']  = s.fontWeight;
    if (s.letterSpacing)        styles['letter-spacing']     = s.letterSpacing;
    if (s.borderRadius)         styles['--btn-radius']       = s.borderRadius;
    if (s.iconSize)             styles['--btn-icon-size']    = s.iconSize;
    if (s.minWidth)             styles['min-width']          = s.minWidth;
    if (s.width)                styles['width']              = s.width;
    if (s.fontSize)             styles['--btn-font-size']    = s.fontSize;
    if (s.height)               styles['height']             = s.height;

    return styles;
  }

  // ----------------------------------------------------------------
  // Events
  // ----------------------------------------------------------------

  handleClick(event: MouseEvent): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.btnClick.emit(event);
  }
}
