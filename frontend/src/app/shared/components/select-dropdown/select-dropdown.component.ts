import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  Optional,
  Output,
  Self,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  rawData?: any;
}

const EMPTY_SELECT_OPTION: SelectOption = {
  label: '',
  value: null,
};

@Component({
  selector: 'app-select-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-dropdown.component.html',
  styleUrls: ['./select-dropdown.component.scss'],
})
export class SelectDropdownComponent implements ControlValueAccessor, OnChanges, OnInit, OnDestroy {
  @Input() label: string = '';
  @Input() placeholder: string = 'Chọn một tùy chọn';
  @Input() showPlaceholderWhenDisabled: boolean = false;
  @Input() options: SelectOption[] = [];
  @Input() width?: string;
  @Input() required: boolean = false;
  private _externalDisabled: boolean = false;
  private _formDisabled: boolean = false;

  @Input()
  set disabled(value: boolean | string | null | undefined) {
    this._externalDisabled = value === '' ? true : (value === true || value === 'true');
  }

  get disabled(): boolean {
    return this._externalDisabled || this._formDisabled;
  }
  @Input() iconLeft?: string;
  @Input() allowFreeText: boolean = false;
  @Input() persistFreeText: boolean = false;
  @Input() showEmptyOption: boolean = false;
  @Input() multiple: boolean = false;
  @Input() showSelectAll: boolean = false;
  @Input() selectAllLabel: string = 'Chọn toàn bộ';
  @Input() showClearButton: boolean = true;

  // Input mới để nhận map lỗi (giống CustomInput)
  @Input() submitted: boolean = false;
  @Input() validationMessages: { [key: string]: string } = {};
  @Input() touched?: boolean;
  @Input() displayFn?: (option: SelectOption) => string;
  @Output() selectionChange = new EventEmitter<any>();

  // EditMode vừa disable vừa placeholder 
  private _isEditMode: boolean = false;

  @Input()
  set isEditMode(value: boolean | string | null | undefined) {
    this._isEditMode = value === '' ? true : (value === true || value === 'true');
  }

  get isEditMode(): boolean {
    return this._isEditMode;
  }
  get effectivePlaceholder(): string {
    if (this.isEditMode) {
      return this.placeholder ?? '';
    }
    if (this.disabled && !this.showPlaceholderWhenDisabled) {
      return '';
    }
    if (this.selectedOption && !this.searchTerm) {
      return '';
    }
    return this.placeholder ?? '';
  }

  isOpen: boolean = false;
  selectedOption: SelectOption | null = null;
  searchTerm: string = '';
  dropdownStyles: { [key: string]: string } = {};

  private innerValue: any = null;

  @ViewChild('container', { static: false })
  containerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('textInput', { static: false })
  textInput?: ElementRef<HTMLInputElement>;

  private onChange: (value: any) => void = () => { };
  protected onTouched: () => void = () => { };

  constructor(@Self() @Optional() public ngControl: NgControl) {
    if (this.ngControl) {
      // Thiết lập valueAccessor cho chính component này
      this.ngControl.valueAccessor = this;
    }
  }

  get errorMessage(): string {
    const isTouched = this.touched !== undefined ? this.touched : (this.ngControl?.touched || this.ngControl?.dirty);
    if (!this.ngControl?.errors || !isTouched) {
      return '';
    }

    const errors = this.ngControl.errors;
    const firstKey = Object.keys(errors)[0];

    if (this.validationMessages && this.validationMessages[firstKey]) {
      return this.validationMessages[firstKey];
    }

    if (firstKey === 'required') {
      return this.label ? `Vui lòng nhập ${this.label}` : 'Trường này là bắt buộc';
    }

    return `Validation error: ${firstKey}`;
  }

  @HostListener('window:resize')
  onWindowEvents() {
    if (this.isOpen) {
      this.closeDropdown();
    }
  }

  ngOnInit(): void {
    window.addEventListener('scroll', this.globalScrollHandler, true);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.globalScrollHandler, true);
  }

  // private globalScrollHandler = (event: Event): void => {
  //   if (this.isOpen) {
  //     const target = event.target as HTMLElement;
  //     if (target && target.closest && target.closest('.options-dropdown')) {
  //       return;
  //     }
  //     this.closeDropdown();
  //   }
  // };
  private globalScrollHandler = (event: Event): void => {
    if (!this.isOpen) return;
    const target = event.target as HTMLElement;

    if (target && target.closest && target.closest('.options-dropdown')) {
      return;
    }

    this.calculatePosition();
  };
  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.isOpen) return;

    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (
      this.containerRef?.nativeElement.contains(target) ||
      target.closest('.options-dropdown')
    ) {
      return;
    }

    this.closeDropdown();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.updateSelectedOption();
    }
  }

  writeValue(value: any): void {
    if (this.multiple) {
      if (typeof value === 'string') {
        this.innerValue = value ? value.split(',').map(v => v.trim()) : [];
      } else {
        this.innerValue = Array.isArray(value) ? value : (value ? [value] : []);
      }
    } else {
      this.innerValue = value;
    }
    this.updateSelectedOption();
  }

  private updateSelectedOption(): void {
    if (this.multiple) {
      if (!Array.isArray(this.innerValue)) {
        this.innerValue = this.innerValue ? [this.innerValue] : [];
      }
      const selectableOptions = this.getSelectableOptions();
      const selectedOptions = selectableOptions.filter(opt =>
        this.innerValue && Array.isArray(this.innerValue) && this.innerValue.includes(opt.value)
      );

      if (selectedOptions.length > 0) {
        this.selectedOption = {
          label: selectedOptions.map(opt => opt.label).join(', '),
          value: this.innerValue
        } as SelectOption;
      } else {
        this.selectedOption = null;
      }
      return;
    }

    const isEmpty =
      this.innerValue === null || this.innerValue === undefined || this.innerValue === '';

    if (isEmpty) {
      const emptyOption = this.getEmptyOption();
      if (emptyOption) {
        this.selectedOption = emptyOption;
        return;
      }
      this.selectedOption = null;
      return;
    }

    const selectableOptions = this.getSelectableOptions();
    let found = null;
    if (selectableOptions.length > 0) {
      found = selectableOptions.find((opt) => opt.value === this.innerValue);
    }

    if (found) {
      this.selectedOption = found;
    } else if (this.persistFreeText) {
      this.selectedOption = {
        label: String(this.innerValue),
        value: this.innerValue,
      } as SelectOption;
    } else {
      this.selectedOption = null;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._formDisabled = isDisabled;
  }

  private getContainingBlock(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      if (
        style.transform !== 'none' ||
        style.perspective !== 'none' ||
        style.filter !== 'none' ||
        (style.willChange && style.willChange.includes('transform')) ||
        (style.willChange && style.willChange.includes('filter')) ||
        style.backdropFilter !== 'none'
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  private calculatePosition(): void {
    const nativeEl = this.containerRef?.nativeElement;
    if (nativeEl) {
      const rect = nativeEl.getBoundingClientRect();
      const cb = this.getContainingBlock(nativeEl);
      let topOffset = 0;
      let leftOffset = 0;
      let cbBottom = window.innerHeight;

      if (cb) {
        const cbRect = cb.getBoundingClientRect();
        topOffset = cbRect.top;
        leftOffset = cbRect.left;
        cbBottom = cbRect.bottom;
      }

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownMaxHeight = 280; // from max-height: 280px in css

      if (spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow) {
        // Not enough space below and more space above, so Drop UP
        const bottomOffset = cbBottom - rect.top;
        this.dropdownStyles = {
          position: 'fixed',
          top: 'auto',
          bottom: `${bottomOffset + 4}px`,
          left: `${rect.left - leftOffset}px`,
          width: `${rect.width}px`,
          zIndex: '2000',
        };
      } else {
        // Drop DOWN
        this.dropdownStyles = {
          position: 'fixed',
          top: `${rect.bottom + 4 - topOffset}px`,
          bottom: 'auto',
          left: `${rect.left - leftOffset}px`,
          width: `${rect.width}px`,
          zIndex: '2000',
        };
      }
    }
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.calculatePosition();
      }
    }
  }

  onContainerClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;
    if (!this.isOpen) {
      this.isOpen = true;
      this.calculatePosition();
    }
    setTimeout(() => {
      if (this.textInput?.nativeElement) {
        const el = this.textInput.nativeElement;
        el.focus();
        const val = el.value || '';
        el.setSelectionRange(val.length, val.length);
      } else {
        this.containerRef?.nativeElement.focus();
      }
    }, 0);
  }

  onInput(value: string): void {
    if (this.disabled) return;
    this.searchTerm = value || '';
    if (!this.isOpen) {
      this.isOpen = true;
      this.calculatePosition();
    }
    if (this.searchTerm === '' && !this.multiple) {
      this.innerValue = null;
      this.selectedOption = null;
      this.onChange(this.innerValue);
      this.selectionChange.emit(this.innerValue);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;

    const key = event.key;
    this.openDropdownOnTyping(event);

    if (key === 'Escape') {
      this.handleEscapeKey(event);
      return;
    }

    if (key === 'Enter') {
      this.handleEnterKey(event);
      return;
    }

    if (key === 'Backspace') {
      this.handleBackspaceKey(event);
      return;
    }

    this.handleCharacterKey(event);
  }

  private openDropdownOnTyping(event: KeyboardEvent): void {
    if (!this.isOpen && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      this.isOpen = true;
      this.calculatePosition();
    }
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    this.closeDropdown();
    event.preventDefault();
  }

  private handleEnterKey(event: KeyboardEvent): void {
    const first = this.filteredOptions[0];
    if (first) {
      this.selectOption(first);
      event.preventDefault();
      return;
    }

    if (this.allowFreeText && this.searchTerm) {
      this.applyFreeTextValue();
      event.preventDefault();
    }
  }

  private applyFreeTextValue(): void {
    this.innerValue = this.searchTerm;
    if (this.persistFreeText) {
      this.selectedOption = {
        label: this.searchTerm,
        value: this.searchTerm,
      } as SelectOption;
    }
    this.onChange(this.searchTerm);
    this.selectionChange.emit(this.searchTerm);
    this.isOpen = false;
    this.searchTerm = '';
  }

  private handleBackspaceKey(event: KeyboardEvent): void {
    const activeIsInput = this.isInputFocused();
    if (!activeIsInput) {
      this.searchTerm = this.searchTerm.slice(0, -1);
      event.preventDefault();
    }
  }

  private handleCharacterKey(event: KeyboardEvent): void {
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      const activeIsInput = this.isInputFocused();
      if (!activeIsInput) {
        this.searchTerm = this.searchTerm + event.key;
        event.preventDefault();
      }
    }
  }

  private isInputFocused(): boolean {
    return !!(
      this.textInput?.nativeElement && document.activeElement === this.textInput.nativeElement
    );
  }

  selectOption(option: SelectOption): void {
    if (option.disabled || this.disabled) return;

    if (this.multiple) {
      if (!Array.isArray(this.innerValue)) {
        this.innerValue = [];
      }
      const index = this.innerValue.indexOf(option.value);
      if (index > -1) {
        this.innerValue.splice(index, 1);
      } else {
        this.innerValue.push(option.value);
      }
      this.innerValue = [...this.innerValue];
      this.onChange(this.innerValue);
      this.selectionChange.emit(this.innerValue);
      this.updateSelectedOption();
      return;
    }

    this.selectedOption = option;
    this.innerValue = option.value;
    this.onChange(option.value);
    this.selectionChange.emit(option.value);
    this.isOpen = false;
    this.searchTerm = '';
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.searchTerm = '';
    this.onTouched();
  }

  clearSelection(): void {
    if (this.disabled) return;
    this.innerValue = this.multiple ? [] : null;
    this.selectedOption = null;
    this.searchTerm = '';
    this.onChange(this.innerValue);
    this.selectionChange.emit(this.innerValue);
  }

  onInputBlur(): void {
    this.onTouched();
    if (this.allowFreeText && this.searchTerm && !this.selectedOption && !this.multiple) {
      this.innerValue = this.searchTerm;
      if (this.persistFreeText) {
        this.selectedOption = {
          label: this.searchTerm,
          value: this.searchTerm,
        } as SelectOption;
      }
      this.onChange(this.searchTerm);
      this.selectionChange.emit(this.searchTerm);
      this.searchTerm = '';
    }
  }

  get filteredOptions(): SelectOption[] {
    const options = this.getSelectableOptions();
    if (!this.searchTerm) return options;
    const q = this.searchTerm.toLowerCase();
    return options.filter((opt) =>
      String(opt.label || '')
        .toLowerCase()
        .includes(q)
    );
  }

  private getSelectableOptions(): SelectOption[] {
    const options = this.options || [];
    if (!this.showEmptyOption || this.multiple) {
      return options;
    }

    const hasEmptyOption = options.some((opt) => opt.value === null || opt.value === undefined);
    if (hasEmptyOption) {
      return options;
    }

    return [EMPTY_SELECT_OPTION, ...options];
  }

  private getEmptyOption(): SelectOption | null {
    const existing = (this.options || []).find(
      (opt) => opt.value === null || opt.value === undefined
    );

    if (existing) {
      return existing;
    }

    return this.showEmptyOption ? EMPTY_SELECT_OPTION : null;
  }

  getWrapperStyle(): { [k: string]: any } | null {
    if (!this.width) return null;
    const w = String(this.width).trim();
    return { width: w };
  }

  get canShowClear(): boolean {
    if (!this.showClearButton || this.disabled) return false;
    if (this.multiple) {
      return Array.isArray(this.innerValue) && this.innerValue.length > 0;
    }
    return this.innerValue !== null && this.innerValue !== undefined && this.innerValue !== '';
  }

  isSelected(option: SelectOption): boolean {
    if (this.multiple) {
      return Array.isArray(this.innerValue) && this.innerValue.includes(option.value);
    }
    return this.selectedOption?.value === option.value;
  }

  isAllSelected(): boolean {
    const selectable = this.options.filter(opt => !opt.disabled);
    if (selectable.length === 0) return false;
    return selectable.every(opt => Array.isArray(this.innerValue) && this.innerValue.includes(opt.value));
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.innerValue = [];
    } else {
      this.innerValue = this.options.filter(opt => !opt.disabled).map(opt => opt.value);
    }
    this.onChange(this.innerValue);
    this.selectionChange.emit(this.innerValue);
    this.updateSelectedOption();
  }

  trackByValue(index: number, option: SelectOption): any {
    return option.value;
  }
}
