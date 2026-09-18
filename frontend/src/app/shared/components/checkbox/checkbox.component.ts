import { Component, Input, forwardRef, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';

export interface CheckboxCustomStyle {
  checkedColor?: string;
  tickColor?: string;
  minusColor?: string;
  textColor?: string;
}

@Component({
  selector: 'app-checkbox, tellerapp-checkbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ]
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() mode: 'binary' | 'tristate' = 'binary';
  @Input() customStyle?: CheckboxCustomStyle;
  @Input() boxOnlyClick = false;

  @Output() stateChange = new EventEmitter<CheckboxState | boolean>();

  public state: CheckboxState = 'unchecked';
  private _externalDisabled: boolean = false;
  private _formDisabled: boolean = false;

  @Input()
  set disabled(value: boolean | string | null | undefined) {
    this._externalDisabled = value === '' ? true : (value === true || value === 'true');
  }

  get disabled(): boolean {
    return this._externalDisabled || this._formDisabled;
  }

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (this.boxOnlyClick) return;

    event.preventDefault();
    if (this.disabled) return;

    this.toggleState();
    this.notifyValueChange();
  }
  onBoxClick(event: Event) {
    if (!this.boxOnlyClick) return;

    event.preventDefault();
    event.stopPropagation();

    if (this.disabled) return;

    this.toggleState();
    this.notifyValueChange();
  }

  private toggleState() {
    if (this.mode === 'binary') {
      this.state = this.state === 'checked' ? 'unchecked' : 'checked';
    } else {
      // Tristate sequence: unchecked -> checked -> indeterminate -> unchecked
      if (this.state === 'unchecked') {
        this.state = 'checked';
      } else if (this.state === 'checked') {
        this.state = 'indeterminate';
      } else {
        this.state = 'unchecked';
      }
    }
  }

  private notifyValueChange() {
    const value = this.getValue();
    this.onChange(value);
    this.onTouched();
    this.stateChange.emit(value);
  }

  private getValue(): CheckboxState | boolean {
    if (this.mode === 'binary') {
      return this.state === 'checked';
    }
    return this.state;
  }

  writeValue(value: any): void {
    if (this.mode === 'binary') {
      this.state = value === true || value === 'checked' ? 'checked' : 'unchecked';
    } else {
      if (value === 'checked' || value === 'indeterminate') {
        this.state = value;
      } else if (value === true) {
        this.state = 'checked';
      } else {
        this.state = 'unchecked';
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this._formDisabled = isDisabled;
  }
}
