import { CommonModule, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Optional,
  Output,
  Self,
  SimpleChanges,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';

const formatDateOpenCode = (value: any): string => {
  if (!value) return '';
  return String(value);
};

const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
  }).format(num);
};


@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [FormsModule, NgClass, CommonModule, ReactiveFormsModule],
  templateUrl: './custom-input.component.html',
  styleUrls: ['./custom-input.component.scss'],
})
export class CustomInputComponent
  implements ControlValueAccessor, OnChanges, OnInit, AfterViewInit {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() required: boolean = false;
  @Input() validateOnTouch = true;
  @Input() compactSuffixPadding = false;
  @Input() inputId: string = 'custom-input-' + Math.random().toString(36).substring(2, 9);

  private _externalDisabled: boolean = false;
  private _formDisabled: boolean = false;
  private isComposingText = false;


  @Input()
  set disabled(value: boolean | string | null | undefined) {
    this._externalDisabled = value === '' ? true : value === true || value === 'true';
  }

  get disabled(): boolean {
    return this._externalDisabled || this._formDisabled;
  }

  @Input() hasLongInput: boolean = false;
  @Input() prefix: any;
  @Input() suffix: any;
  @Input() textAlign?: 'left' | 'right' | 'center';

  @Input() notDisplayAsterisk: boolean = false;
  @Input() type: 'text' | 'number' | 'money' | 'password' = 'text';
  @Input() value: any = null;
  @Input() before: any;
  @Input() after: any;
  @Input() readOnly: boolean = false;
  @Input() onlyAlphanumeric: boolean = false;


  @Input() autoUpperCase: boolean = false;
  @Input() removeVietnameseAccent: boolean = false;
  @Input() removeSpecialChars: boolean = false;
  @Input() sanitizeOnBlur: boolean = false;
  @Input() disallowNumbers = false;

  @Input() onlyNumber: boolean = false;
  @Input() suffixIconSrc?: string;
  @Input() suffixAriaLabel?: string;

  @Input() ccy: string = 'VND';
  @Input() allowDecimal: boolean = true;
  @Input() customMaxFraction?: number;
  @Input() min?: number;
  @Input() max?: number;
  @Input() maxLength?: number;

  @Input() submitted: boolean = false;
  @Input() validationMessages: { [key: string]: string } = {};
  @Input() touched?: boolean;

  @Input() showSearchIcon: boolean = false;
  @Input() searchIconSrc: string = '';
  @Input() searchBtnBorderless: boolean = false;
  @Input() showPlaceholderWhenDisabled = false;

  //Chỉ cho phép nhập chữ cái (loại bỏ tất cả ký tự đặc biệt và số).
  @Input() onlyAlphabet: boolean = false;

  //Chỉ cho phép nhập chữ cái và số (loại bỏ tất cả ký tự đặc biệt).
  @Input() onlyAlphanumericUnicode: boolean = false;

  // Chỉ cho phép nhập ký tự số, chữ cái và dấu gạch dưới (_)
  @Input() onlyCodeFormat: boolean = false;

  // Chỉ cho phép nhập ký tự số, chữ in hoa, dấu gạch ngang (-), dấu gạch chéo (/)
  @Input() onlyUpperAlphaNumDashSlash: boolean = false;

  //Không cho phép nhập khoảng trắng (áp dụng cho tất cả các type, nếu type='text' sẽ không cho phép khoảng trắng ở bất kỳ vị trí nào, nếu type='number' hoặc 'money' sẽ không cho phép khoảng trắng ở đầu/cuối hoặc liên tiếp)
  @Input() noWhitespace: boolean = false;

  //Không có khoảng trắng ở đầu, cuối và giữa chuỗi (chặn và xóa mọi khoảng trắng)
  @Input() removeAllSpaces: boolean = false;

  //Cho phép nhập số với ký tự viết tắt (t/T, m/M, b/B) tương ứng với nghìn, triệu, tỷ (chỉ áp dụng cho type='number' và type='money')
  @Input() allowShorthand: boolean = false;

  //Chỉ cho phép nhập số và dấu chấm "." với tối đa 2 chữ số thập phân
  @Input() onlyDecimalNumber: boolean = false;

  //Cho phép text có ít nhất 1 khoảng trắng giữa các từ, không có khoảng trắng đầu/cuối hoặc khoảng trắng liên tiếp
  @Input() enforceSpacingRules: boolean = false;

  //Chỉ cho phép nhập số (0-9) và dấu gạch ngang (-)
  @Input() enforceNumberFormatWithHyphen: boolean = false;

  @Input() formatDateOpenCode: boolean = false;


  private _isViewMode: boolean = false;
  @Input()
  set isViewMode(value: boolean | string | null | undefined) {
    this._isViewMode = value === '' ? true : (value === true || value === 'true');
  }
  get isViewMode(): boolean {
    return this._isViewMode;
  }

  private _isEditMode: boolean = false;
  @Input()
  set isEditMode(value: boolean | string | null | undefined) {
    this._isEditMode = value === '' ? true : (value === true || value === 'true');
  }
  get isEditMode(): boolean {
    return this._isEditMode;
  }

  private _specialMode: boolean = false;
  @Input()
  set specialMode(value: boolean | string | null | undefined) {
    this._specialMode = value === '' ? true : (value === true || value === 'true');
  }
  get specialMode(): boolean {
    return this._specialMode;
  }

  @Output() handleBlur = new EventEmitter<any>();
  @Output() handleFocus = new EventEmitter<any>();
  @Output() handleEnter = new EventEmitter<any>();
  @Output() handleSearchClick = new EventEmitter<any>();
  @Output() suffixClick = new EventEmitter<any>();

  @ViewChild('inputRef') inputElementRef!: ElementRef<HTMLInputElement>;

  displayValue: string = '';

  onChange = (_: any) => { };
  onTouched = () => { };

  private _cachedFormatter: Intl.NumberFormat | null = null;
  private _currentCachedCcy: string = '';

  constructor(
    @Self() @Optional() public ngControl: NgControl,
    private cdr: ChangeDetectorRef
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.updateFormatter();
  }

  ngAfterViewInit(): void {
    if (this.value !== null && this.value !== undefined) {
      this.updateDisplayValue();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ccy']) {
      this.updateFormatter();
      if (this.value !== null) this.updateDisplayValue();
    }

    if (changes['value'] && !changes['value'].isFirstChange()) {
      this.value = changes['value'].currentValue;
      this.updateDisplayValue();
    }

    if (changes['submitted'] || changes['noWhitespace'] || changes['onlyNumber'] || changes['enforceSpacingRules'] || changes['enforceNumberFormatWithHyphen']) {
      this.validateWhitespaceIfNeeded();
      this.validateOnlyNumberIfNeeded();
      this.validateSpacingRulesIfNeeded();
      this.validateNumberFormatWithHyphenIfNeeded();
    }
  }

  private updateFormatter(): void {
    const isVND = this.ccy.toUpperCase() === 'VND';
    if (this._cachedFormatter && this._currentCachedCcy === this.ccy) return;

    this._currentCachedCcy = this.ccy;
    const locale = 'en-US';
    const maxFraction = this.customMaxFraction !== undefined ? this.customMaxFraction : (isVND ? 0 : 2);

    this._cachedFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFraction,
    });
  }

  private formatCurrencyFast(val: number): string {
    if (val === null || val === undefined || Number.isNaN(val)) return '';
    return this._cachedFormatter ? this._cachedFormatter.format(val) : String(val);
  }
  private sanitizeText(val: string, trimEdges: boolean = false): string {
    let result = val;

    if (this.autoUpperCase) {
      result = result.toUpperCase();
    }

    if (this.removeVietnameseAccent) {
      result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      result = result.replace(/Đ/g, 'D');
    }

    if (this.removeSpecialChars) {
      const regex = this.isEmailField
        ? /[^a-zA-Z0-9@._-]/g
        : /[^\p{L}\p{M}0-9\s.,\-\/()]/gu;
      result = result.replace(regex, '').normalize('NFC');
    }

    if (this.onlyAlphanumeric) {
      result = result.replace(/[^a-zA-Z0-9\s]/g, '');
    }

    if (this.onlyAlphabet) {
      result = result.replace(/[^\p{L}\p{M}\s]/gu, '');
    }

    if (this.onlyAlphanumericUnicode) {
      result = result.replace(/[^\p{L}\p{M}0-9\s]/gu, '');
    }

    if (this.onlyCodeFormat) {
      result = result.replace(/[^\p{L}\p{M}0-9_]/gu, '');
    }

    if (this.onlyUpperAlphaNumDashSlash) {
      result = result.replace(/[^A-Z0-9\-\/]/g, '');
    }

    if (this.disallowNumbers) {
      result = result.replace(/[0-9]/g, '');
    }

    if (this.onlyDecimalNumber) {
      const clean = result.replace(/[^0-9.]/g, '');
      const parts = clean.split('.');
      if (parts.length > 1) {
        let decimalPart = parts.slice(1).join('');
        if (decimalPart.length > 2) {
          decimalPart = decimalPart.substring(0, 2);
        }
        result = parts[0] + '.' + decimalPart;
      } else {
        result = parts[0];
      }
    }

    if (this.removeAllSpaces) {
      result = result.replace(/\s/g, '');
    }

    //Kiểm tra quy tắc khoảng trắng
    if (this.enforceSpacingRules) {
      result = result.replace(/\s{2,}/g, ' ');
      if (trimEdges) {
        result = result.trim();
      }
    }

    if (this.enforceNumberFormatWithHyphen) {
      result = result.replace(/[^0-9-]/g, '');
    }

    return result;
  }
  handleInput(event: Event): void {
    if (this.type === 'password') {
      const input = event.target as HTMLInputElement;
      this.value = input.value;
      this.onChange(this.value);
      return;
    }
    const input = event.target as HTMLInputElement;
    if (this.type === 'text' && this.removeSpecialChars && (this.isComposingText || (event as InputEvent).isComposing)) {
      this.value = input.value;
      return;
    }

    if (this.type !== 'money') {
      let val = input.value;
      if (this.type === 'number' || this.onlyNumber) {
        // Shorthand
        if (this.type === 'number' && this.allowShorthand) {
          const trimmed = val.trim();
          if (/^\d+[tTmMbB]$/.test(trimmed)) {
            if (input.value !== trimmed) input.value = trimmed;
            return;
          }
          val = val.replace(/\D/g, '');
        } else {
          val = val.replace(/\D/g, '');
        }

        if (val !== '') {
          const numVal = Number(val);
          if (this.max !== undefined && numVal > this.max) {
            val = String(this.max);
          }
        }

        if (this.onlyNumber && this.max === undefined) {
          val = val.substring(0, this.maxLength);
        }
      } else if (this.type === 'text' && !this.sanitizeOnBlur) {
        val = this.sanitizeText(val);
        if (this.maxLength !== undefined && typeof val === 'string') {
          val = val.substring(0, this.maxLength);
        }
      }

      if (val !== input.value) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const lengthDiff = input.value.length - val.length;
        input.value = val;
        if (start !== null) {
          input.setSelectionRange(Math.max(0, start - lengthDiff), Math.max(0, (end || start) - lengthDiff));
        }
      }

      this.value = input.value;
      this.onChange(this.value);
      this.validateWhitespaceIfNeeded();
      this.validateOnlyNumberIfNeeded();
      this.validateSpacingRulesIfNeeded();
      this.validateNumberFormatWithHyphenIfNeeded();
      return;
    } if (this.allowShorthand) {
      const rawVal = input.value.replace(/,/g, '').trim();
      if (/^[\d.]+[tTmMbB]$/.test(rawVal)) {
        return;
      }
    }

    this.handleMoneyInput(input);
  }

  onSuffixClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.disabled) {
      this.suffixClick.emit(this.value);
    }
  }

  private handleMoneyInput(input: HTMLInputElement): void {
    const originalValue = input.value;
    const selectionStart = input.selectionStart ?? 0;
    const isVND = this.ccy.toUpperCase() === 'VND';

    const digitsBeforeCursor = this.countDigitsBeforeCursor(originalValue, selectionStart);
    const cleanRaw = this.cleanMoneyInput(originalValue, isVND);
    const finalVal = this.parseAndClampValue(cleanRaw);

    this.updateValueIfChanged(finalVal);

    const formattedDisplay = this.formatDisplayValue(finalVal, cleanRaw, isVND);
    this.updateInputIfChanged(
      input,
      formattedDisplay,
      digitsBeforeCursor,
      selectionStart,
      originalValue,
      isVND
    );
  }

  private countDigitsBeforeCursor(value: string, cursorPos: number): number {
    let count = 0;
    for (let i = 0; i < value.length && i < cursorPos; i++) {
      const code = value.codePointAt(i)!;
      if (code >= 48 && code <= 57) count++;
    }
    return count;
  }

  // Shorthand suffix first (e.g. 1.5k => 1500, 2m => 2000000)
  private expandShorthandSuffix(value: string): string {
    if (!this.allowShorthand) return value;
    const cleanValue = value.replace(/,/g, '');
    const match = cleanValue.match(/^([\d.]+)([tTmMbB])$/);
    if (!match) return value;
    const num = parseFloat(match[1]);
    if (Number.isNaN(num)) return value;
    const suffix = match[2].toLowerCase();
    const multipliers: Record<string, number> = { t: 1000, m: 1000000, b: 1000000000 };
    const expanded = num * multipliers[suffix];
    return String(expanded);
  }

  private cleanMoneyInput(value: string, isVND: boolean): string {
    const expanded = this.expandShorthandSuffix(value.trim());
    const maxFraction = this.customMaxFraction !== undefined ? this.customMaxFraction : (isVND ? 0 : 2);

    if (maxFraction === 0) {
      return expanded.replaceAll(/[^\d]/g, '');
    }

    let cleanRaw = expanded.replaceAll(/[^\d.]/g, '');
    const dotIndex = cleanRaw.indexOf('.');
    if (dotIndex !== -1) {
      const integerPart = cleanRaw.substring(0, dotIndex);

      let decimalPart = cleanRaw.substring(dotIndex + 1).replaceAll('.', '');
      if (decimalPart.length > maxFraction) decimalPart = decimalPart.substring(0, maxFraction);
      cleanRaw = integerPart + '.' + decimalPart;
    }
    return cleanRaw;
  }

  private parseAndClampValue(cleanRaw: string): number | null {
    let finalVal = cleanRaw === '' || cleanRaw === '.' ? null : Number(cleanRaw);
    if (finalVal !== null && this.max !== undefined && finalVal > this.max) {
      finalVal = this.max;
    }
    return finalVal;
  }

  private updateValueIfChanged(finalVal: number | null): void {
    if (this.value !== finalVal) {
      this.value = finalVal;
      this.onChange(finalVal);
    }
  }

  private formatDisplayValue(finalVal: number | null, cleanRaw: string, isVND: boolean): string {
    let formattedDisplay = finalVal == null ? '' : this.formatCurrencyFast(finalVal);
    const maxFraction = this.customMaxFraction !== undefined ? this.customMaxFraction : (isVND ? 0 : 2);

    if (maxFraction > 0) {
      formattedDisplay = this.adjustDecimalDisplay(formattedDisplay, cleanRaw);
    }

    return formattedDisplay;
  }

  private adjustDecimalDisplay(formatted: string, cleanRaw: string): string {
    if (cleanRaw.endsWith('.')) {
      return formatted.includes('.') ? formatted : formatted + '.';
    }

    if (cleanRaw.includes('.')) {
      const dec = cleanRaw.split('.')[1];
      if (dec && formatted.includes('.')) {
        const dispParts = formatted.split('.');
        if (dispParts[1] !== dec) {
          return dispParts[0] + '.' + dec;
        }
      }
    }

    return formatted;
  }

  private updateInputIfChanged(
    input: HTMLInputElement,
    formattedDisplay: string,
    digitsBeforeCursor: number,
    selectionStart: number,
    originalValue: string,
    isVND: boolean
  ): void {
    if (input.value === formattedDisplay) return;

    input.value = formattedDisplay;
    this.displayValue = formattedDisplay;

    const newCursorPos = this.calculateNewCursorPosition(
      formattedDisplay,
      digitsBeforeCursor,
      selectionStart,
      originalValue,
      isVND
    );
    input.setSelectionRange(newCursorPos, newCursorPos);
  }

  private calculateNewCursorPosition(
    formattedDisplay: string,
    digitsBeforeCursor: number,
    selectionStart: number,
    originalValue: string,
    isVND: boolean
  ): number {
    const maxFraction = this.customMaxFraction !== undefined ? this.customMaxFraction : (isVND ? 0 : 2);
    if (digitsBeforeCursor === 0 && selectionStart === 0) return 0;
    if (maxFraction > 0 && originalValue.endsWith('.') && selectionStart === originalValue.length) {
      return formattedDisplay.length;
    }

    let newCursorPos = 0;
    let digitsSeen = 0;

    for (let i = 0; i < formattedDisplay.length; i++) {
      const code = formattedDisplay.codePointAt(i)!;
      if (code >= 48 && code <= 57) digitsSeen++;

      if (digitsSeen === digitsBeforeCursor) {
        newCursorPos = i + 1;
        break;
      }
    }

    return newCursorPos;
  }

  handleKeyPress(event: KeyboardEvent): void {
    const key = event.key;

    if (key.length > 1) return;

    if (event.ctrlKey || event.metaKey) {
      if (this.allowShorthand && (this.type === 'number' || this.type === 'money')) {
        if (key.toLowerCase() === 'v' || key.toLowerCase() === 'x') {
          event.preventDefault();
          return;
        }
      }
      return; // Allow Ctrl+C, Ctrl+A, etc.
    }

    // Kiểm tra maxlength cho type='text'
    try {
      const el = event.target as HTMLInputElement;
      const selStart = el.selectionStart ?? 0;
      const selEnd = el.selectionEnd ?? 0;
      const replaceLen = selEnd - selStart;
      const currentValForLength = this.type === 'text' ? this.sanitizeText(el.value) : el.value;
      if (this.maxLength !== undefined && this.type === 'text') {
        if (currentValForLength.length - replaceLen >= this.maxLength) {
          event.preventDefault();
          return;
        }
      }
    } catch {

    }

    // ── type='number' ──────────────────────────────────────────────────────────
    if (this.type === 'number') {
      const currentVal = (event.target as HTMLInputElement).value;
      if (key >= '0' && key <= '9') {
        if (this.allowShorthand && /[tTmMbB]$/.test(currentVal)) {
          event.preventDefault(); return;
        }
        return;
      }
      if (this.allowShorthand && /^[tTmMbB]$/.test(key)) {
        if (/^\d+$/.test(currentVal) && currentVal.length > 0) return;
      }
      event.preventDefault(); return;
    }

    // ── onlyNumber (not type=number) ──────────────────────────────────────────
    if (this.onlyNumber) {
      if (key >= '0' && key <= '9') return;
      event.preventDefault(); return;
    }

    // ── onlyDecimalNumber ──────────────────────────────────────────────────────
    if (this.onlyDecimalNumber) {
      if ((key >= '0' && key <= '9') || key === '.') return;
      event.preventDefault(); return;
    }

    // ── type='money' ───────────────────────────────────────────────────────────
    if (this.type === 'money') {
      const isVND = this.ccy.toUpperCase() === 'VND';
      const maxFraction = this.customMaxFraction !== undefined ? this.customMaxFraction : (isVND ? 0 : 2);
      const currentVal = (event.target as HTMLInputElement).value;
      const rawVal = currentVal.replace(/,/g, '');

      if (this.allowShorthand) {
        if (key >= '0' && key <= '9') {
          if (/[tTmMbB]$/.test(rawVal)) { event.preventDefault(); return; }
          return;
        }
        if (maxFraction > 0 && key === '.') {
          if (!rawVal.includes('.') && !/[tTmMbB]$/.test(rawVal)) return;
        }
        if (/^[tTmMbB]$/.test(key)) {
          const pattern = maxFraction === 0 ? /^\d+$/ : /^\d+(\.\d*)?$/;
          if (pattern.test(rawVal) && rawVal.length > 0) return;
        }
        event.preventDefault(); return;
      } else {
        if (key >= '0' && key <= '9') return;
        if (maxFraction > 0 && key === '.') {
          if (!currentVal.includes('.')) return;
        }
        event.preventDefault(); return;
      }
    }

    // ── Kiểm tra định dạng số đăng ký ─────────────────────────────
    if (this.type === 'text' && this.enforceNumberFormatWithHyphen) {
      if (!/^[0-9-]$/.test(key)) {
        event.preventDefault();
      }
      return;
    }

    if (this.type === 'text' && this.removeAllSpaces) {
      if (key === ' ') {
        event.preventDefault();
        return;
      }
    }

    // ── chỉ cho phép 1 khoảng trắng ──────────────────────────────────────
    if (this.type === 'text' && this.enforceSpacingRules) {
      const currentVal = (event.target as HTMLInputElement).value;
      const selStart = (event.target as HTMLInputElement).selectionStart ?? 0;
      const selEnd = (event.target as HTMLInputElement).selectionEnd ?? 0;
      const replaceLen = selEnd - selStart;
      if (this.maxLength !== undefined && currentVal.length - replaceLen >= this.maxLength) {
        event.preventDefault(); return;
      }

      // Cho phép 1 khoảng trắng 
      if (key === ' ') {
        if (currentVal.length === 0) { event.preventDefault(); return; }
        if (currentVal.endsWith(' ')) { event.preventDefault(); return; }
        return;
      }
    }

    // ── type='text' ────────────────────────────────────────────────────────────
    if (this.type === 'text' && this.onlyAlphanumeric) {
      if (/^[a-zA-Z0-9\s]$/.test(key)) return;
      event.preventDefault();
      return;
    }

    if (this.type === 'text' && this.onlyAlphabet) {
      if (/^[\p{L}\p{M}\s]$/u.test(key)) return;
      event.preventDefault();
      return;
    }

    if (this.type === 'text' && this.onlyAlphanumericUnicode) {
      if (/^[\p{L}\p{M}0-9\s]$/u.test(key)) return;
      event.preventDefault();
      return;
    }

    if (this.type === 'text' && this.onlyCodeFormat) {
      if (/^[\p{L}\p{M}0-9_]$/u.test(key)) return;
      event.preventDefault();
      return;
    }

    if (this.type === 'text' && this.onlyUpperAlphaNumDashSlash) {
      if (/^[a-zA-Z0-9\-\/]$/.test(key)) return;
      event.preventDefault();
      return;
    }
  }
  onEnter(): void {
    if (this.handleEnter.observed) {
      this.handleEnter.emit(this.value);
    } else {
      this.inputElementRef.nativeElement.blur();
    }
  }

  onSearchClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.handleSearchClick.observed) {
      this.handleSearchClick.emit(this.value);
    } else {
      this.onEnter();
    }
  }

  onBlur(): void {
    // Mở rộng suffix khi blur (ví dụ: "1b" → 1,000,000,000)
    if (this.allowShorthand && (this.type === 'number' || this.type === 'money')) {
      const rawDisplay = this.inputElementRef?.nativeElement?.value ?? '';
      const rawClean = rawDisplay.replace(/,/g, '').trim();
      const expanded = this.expandShorthandSuffix(rawClean);
      if (expanded !== rawClean) {
        const numVal = Number(expanded);
        if (!Number.isNaN(numVal)) {
          this.value = numVal;
          this.onChange(numVal);
        }
      }
    }
    if (this.type === 'text' && (this.sanitizeOnBlur || this.enforceSpacingRules)) {
      const input = this.inputElementRef?.nativeElement;
      if (input) {
        const sanitized = this.sanitizeText(input.value, this.enforceSpacingRules);

        if (sanitized !== input.value) {
          input.value = sanitized;
        }

        this.value = sanitized;
        this.onChange(sanitized);
      }
    }
    this.onTouched();
    this.handleBlur.emit(this.value);
    this.updateDisplayValue(true);
    this.validateWhitespaceIfNeeded();
    this.validateOnlyNumberIfNeeded();
    this.validateSpacingRulesIfNeeded();
    this.validateNumberFormatWithHyphenIfNeeded();
  }

  onFocus(): void {
    this.handleFocus.emit(this.value);
  }

  updateDisplayValue(forceFullFormat: boolean = false): void {
    if (this.isEmptyValue()) {
      this.clearDisplay();
      return;
    }

    if (this.isInvalidNumericValue()) {
      this.clearDisplay();
      return;
    }

    const formatted = this.formatValueByType(forceFullFormat);
    this.applyFormattedValue(formatted);
  }

  protected isEmptyValue(): boolean {
    return this.value === null || this.value === undefined || this.value === '';
  }

  private isInvalidNumericValue(): boolean {
    return (this.type === 'number' || this.type === 'money') && Number.isNaN(this.value);
  }

  private clearDisplay(): void {
    this.displayValue = '';
    if (this.inputElementRef) {
      this.inputElementRef.nativeElement.value = '';
    }
  }

  private formatValueByType(forceFullFormat: boolean): string {
    if (this.formatDateOpenCode) {
      return formatDateOpenCode(this.value);
    }

    if (this.type === 'number') {
      return formatNumber(this.value);
    }

    if (this.type === 'money') {
      return this.formatMoneyValue(forceFullFormat);
    }

    return this.value;
  }

  private formatMoneyValue(forceFullFormat: boolean): string {
    const isVND = this.ccy.toUpperCase() === 'VND';
    const maxFraction = this.customMaxFraction !== undefined ? this.customMaxFraction : (isVND ? 0 : 2);
    if (forceFullFormat && maxFraction > 0) {
      try {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: maxFraction,
          maximumFractionDigits: maxFraction,
        }).format(this.value);
      } catch {
        return this.formatCurrencyFast(this.value);
      }
    }
    return this.formatCurrencyFast(this.value);
  }

  private formatDateTimeStr(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const isoLike = /^([0-9]{4})-([0-9]{2})-([0-9]{2})(?:[ T]([0-9]{2}):([0-9]{2}):([0-9]{2}))?(?:Z|[+-].*)?$/;
      const m = trimmed.match(isoLike);
      if (m) {
        if (/[Zz]|[\+\-][0-9]{2}:?[0-9]{2}$/.test(trimmed)) {
          const d = new Date(trimmed);
          if (!isNaN(d.getTime())) value = d;
        } else {
          const y = Number(m[1]);
          const mo = Number(m[2]);
          const da = Number(m[3]);
          const hh = m[4] ? Number(m[4]) : 0;
          const mm = m[5] ? Number(m[5]) : 0;
          const ss = m[6] ? Number(m[6]) : 0;
          value = new Date(y, mo - 1, da, hh, mm, ss);
        }
      }
    }
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  private applyFormattedValue(formatted: string): void {
    this.displayValue = formatted;
    if (this.inputElementRef) {
      this.inputElementRef.nativeElement.value = formatted;
    }
  }

  //Xử lý viewmode, editmode, specialmode 
  get effectivePlaceholder(): string {
    const empty = this.isEmptyValue();
    if (!empty) return this.placeholder ?? '';

    if (this.specialMode) return this.placeholder ?? '';

    if (this.isEditMode) return this.placeholder ?? '';

    if (this.isViewMode) return '';

    if (this.disabled && !this.showPlaceholderWhenDisabled) return '';
    return this.placeholder ?? '';
  }

  get errorMessage(): string {
    const isTouched = this.touched !== undefined ? this.touched : (this.submitted || (this.validateOnTouch && (this.ngControl?.touched || this.ngControl?.dirty)));
    if (!this.ngControl?.errors || !isTouched) {
      return '';
    }
    const errors = this.ngControl.errors;
    const firstKey = Object.keys(errors)[0];

    if (this.validationMessages && this.validationMessages[firstKey]) {
      return this.validationMessages[firstKey];
    }

    if (firstKey === 'nowhitespace') {
      return this.label ? `Không cho phép nhập khoảng trắng tại ${this.label}` : 'Không cho phép nhập khoảng trắng';
    }

    if (firstKey === 'nameRules') {
      if (this.validationMessages && this.validationMessages[firstKey]) return this.validationMessages[firstKey];
      return this.label ? `${this.label} chỉ được chứa chữ cái in hoa không dấu` : 'Định dạng tên không hợp lệ';
    }

    if (firstKey === 'spacingRules') {
      if (this.validationMessages && this.validationMessages[firstKey]) return this.validationMessages[firstKey];
      return this.label ? `${this.label} phải có ít nhất 1 khoảng trắng giữa các từ` : 'Khoảng trắng không hợp lệ';
    }

    if (firstKey === 'numberFormatWithHyphen' || firstKey === 'registrationFormat') {
      if (this.validationMessages && this.validationMessages[firstKey]) return this.validationMessages[firstKey];
      return this.label ? `${this.label} chỉ được phép chứa số (0-9) và dấu gạch ngang (-)` : 'Chỉ được phép chứa số (0-9) và dấu gạch ngang (-)';
    }

    if (firstKey === 'onlyNumberLength') {
      return this.label ? `${this.label} phải có từ 10 đến 12 chữ số` : 'Trường này phải có từ 10 đến 12 chữ số';
    }

    if (firstKey === 'required') {
      return this.label ? `Vui lòng nhập ${this.label}` : 'Trường này là bắt buộc';
    }

    if (firstKey === 'email') {
      return 'Email không đúng định dạng';
    }

    if (firstKey === 'minlength') {
      const minLength = errors['minlength']?.requiredLength || 6;
      return `${this.label || 'Mật khẩu'} phải có ít nhất ${minLength} ký tự`;
    }

    if (firstKey === 'passwordMismatch') {
      return 'Mật khẩu xác nhận không khớp';
    }

    return 'Validation error: ' + firstKey;
  }

  private get isEmailField(): boolean {
    const labelLower = (this.label || '').toLowerCase();
    const placeholderLower = (this.placeholder || '').toLowerCase();
    const controlName = (this.ngControl?.name || '').toString().toLowerCase();
    return labelLower.includes('email') || placeholderLower.includes('email') || controlName.includes('email');
  }

  writeValue(obj: any): void {
    let val = obj ?? null;
    let modified = false;

    if (this.onlyNumber && typeof val === 'string') {
      const newVal = val.replace(/\D/g, '').substring(0, 12);
      if (newVal !== val) {
        val = newVal;
        modified = true;
      }
    }
    if (this.type === 'text' && typeof val === 'string') {
      const newVal = this.sanitizeText(val, true);
      if (newVal !== val) {
        val = newVal;
        modified = true;
      }
    }
    this.value = val;
    this.updateDisplayValue();

    if (modified) {
      setTimeout(() => {
        if (this.onChange) {
          this.onChange(val);
        }
      });
    }
    this.validateWhitespaceIfNeeded();
    this.validateOnlyNumberIfNeeded();
    this.validateSpacingRulesIfNeeded();
    this.validateNumberFormatWithHyphenIfNeeded();
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this._formDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  //Phần xử lý validate khoảng trắng  noWhitespace *
  private validateWhitespaceIfNeeded(): void {
    const control = this.ngControl?.control;
    if (!control) return;

    if (!this.noWhitespace || !this.submitted) {
      this.setWhitespaceError(false);
      return;
    }

    if (this.value === null || this.value === undefined || this.value === '') {
      this.setWhitespaceError(false);
      return;
    }

    if (typeof this.value !== 'string') {
      this.setWhitespaceError(false);
      return;
    }

    const hasWhitespace = this.value.trim().length === 0;
    this.setWhitespaceError(hasWhitespace);
  }

  private setWhitespaceError(hasError: boolean): void {
    const control = this.ngControl?.control;
    if (!control) return;

    const errors = control.errors ?? {};

    if (hasError) {
      if (!errors['nowhitespace']) {
        control.setErrors({ ...errors, nowhitespace: true });
      }
      return;
    }

    if (errors['nowhitespace']) {
      const { nowhitespace, ...rest } = errors;
      control.setErrors(Object.keys(rest).length ? rest : null);
    }
  } //End of phần xử lý validate khoảng trắng noWhitespace *

  private validateOnlyNumberIfNeeded(): void {
    this.setOnlyNumberLengthError(false);
  }

  // Validate khoảng trắng: không có khoảng trắng ở đầu/cuối, không có khoảng trắng liên tiếp và phải có ít nhất 1 khoảng trắng giữa các từ.
  private validateSpacingRulesIfNeeded(): void {
    const control = this.ngControl?.control;
    if (!control) return;

    if (!this.enforceSpacingRules || !this.submitted) {
      this.setSpacingRulesError(false);
      return;
    }

    const value = this.value === null || this.value === undefined ? '' : String(this.value);
    if (!value) { this.setSpacingRulesError(false); return; }

    const validSpacing = /^[^\s]+(?: [^\s]+)*$/.test(value.trim());

    this.setSpacingRulesError(!validSpacing);
  }

  private setSpacingRulesError(hasError: boolean): void {
    const control = this.ngControl?.control;
    if (!control) return;

    const errors = control.errors ?? {};

    if (hasError) {
      if (!errors['spacingRules']) {
        control.setErrors({ ...errors, spacingRules: true });
      }
      return;
    }

    if (errors['spacingRules']) {
      const { spacingRules, ...rest } = errors;
      control.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  // Validate định dạng số đăng ký: 10 số hoặc 10 số - 3 số
  private validateNumberFormatWithHyphenIfNeeded(): void {
    const control = this.ngControl?.control;
    if (!control) return;

    if (!this.enforceNumberFormatWithHyphen || !this.submitted) {
      this.setNumberFormatWithHyphenError(false);
      return;
    }

    const value = this.value === null || this.value === undefined ? '' : String(this.value);
    if (!value) { this.setNumberFormatWithHyphenError(false); return; }

    const valid = /^[0-9-]+$/.test(value);
    this.setNumberFormatWithHyphenError(!valid);
  }

  private setNumberFormatWithHyphenError(hasError: boolean): void {
    const control = this.ngControl?.control;
    if (!control) return;

    const errors = control.errors ?? {};

    if (hasError) {
      if (!errors['registrationFormat']) {
        control.setErrors({ ...errors, registrationFormat: true });
      }
      return;
    }

    if (errors['registrationFormat']) {
      const { registrationFormat, ...rest } = errors;
      control.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  private setOnlyNumberLengthError(hasError: boolean): void {
    const control = this.ngControl?.control;
    if (!control) return;

    const errors = control.errors ?? {};

    if (hasError) {
      if (!errors['onlyNumberLength']) {
        control.setErrors({ ...errors, onlyNumberLength: true });
      }
      return;
    }

    if (errors['onlyNumberLength']) {
      const { onlyNumberLength, ...rest } = errors;
      control.setErrors(Object.keys(rest).length ? rest : null);
    }
  }
  onCompositionStart(): void {
    if (this.type === 'text' && this.removeSpecialChars) {
      this.isComposingText = true;
    }
  }

  onCompositionEnd(event: CompositionEvent): void {
    if (this.type === 'text' && this.removeSpecialChars) {
      this.isComposingText = false;
      this.handleInput(event as unknown as Event);
    }
  }


}
