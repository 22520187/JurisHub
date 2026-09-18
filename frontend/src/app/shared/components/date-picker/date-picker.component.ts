import {
  Component,
  EventEmitter,
  Input,
  Output,
  HostListener,
  ElementRef,
  forwardRef,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms'
// import { TranslateModule, TranslateService } from '@ngx-translate/core'
interface CalendarDate {
  date: Date
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isRangeStart: boolean
  isRangeEnd: boolean
  isRangeStartVisual: boolean  // Actual visual start (considering backward selection)
  isRangeEndVisual: boolean    // Actual visual end (considering backward selection)
  isInRange: boolean
  isDisabled?: boolean
}

export interface DateRange {
  startDate?: Date
  endDate?: Date
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    }
  ],
})
export class DatePickerComponent implements OnInit, OnChanges, Validator {

  private static openInstance: DatePickerComponent | null = null;

  @Input() label: string = ''
  @Input() placeholder: string = 'DD/MM/YYYY'
  private _externalDisabled: boolean = false;
  private _formDisabled: boolean = false;

  @Input()
  set disabled(value: boolean | string | null | undefined) {
    this._externalDisabled = value === '' ? true : (value === true || value === 'true');
  }

  get disabled(): boolean {
    return this._externalDisabled || this._formDisabled;
  }
  @Input() required: boolean = false
  @Input() validationMessage?: string
  @Input() invalid: boolean = false
  @Input() selectedDate?: Date
  @Input() allowRange: boolean = false
  @Input() dateRange?: DateRange
  @Input() enforceMonthRange: boolean = true
  @Input() monthRangeLimit: number = 6 // total window size; effective +/- offset = limit - 1
  @Input() type: 'default' | 'dayToDay' = 'default'
  @Input() maxLength?: number

  // Cho phép chọn ĐẾN ngày hiện tại (cho phép <= today)
  @Input() maxDateToday: boolean = false
  // Bắt buộc chọn TRƯỚC ngày hiện tại (cho phép < today)
  @Input() strictlyBeforeToday: boolean = false
  // Cho phép chọn TỪ ngày hiện tại trở đi (cho phép >= today)
  @Input() minDateToday: boolean = false
  // Bắt buộc chọn SAU ngày hiện tại (cho phép > today)
  @Input() strictlyAfterToday: boolean = false
  // Bắt buộc chọn SAU ngày được truyền vào (cho phép > ngày truyền vào)
  @Input() strictlyAfterDate?: any
  // Bắt buộc chọn TỪ ngày được truyền vào (cho phép >= ngày truyền vào)
  @Input() minDate?: any
  // Bắt buộc chọn ĐẾN ngày được truyền vào (cho phép <= ngày truyền vào)
  @Input() maxDate?: any

  @Input() mode: 'default' | 'dob' = 'default'

  //Custom 4/6/8 ký tự số cho date nhập vào
  @Input() allowShortDate: boolean = false
  @Input() yymmMode: boolean = false

  private _isEditMode: boolean = false;
  @Input()
  set isEditMode(value: boolean | string | null | undefined) {
    this._isEditMode = value === '' ? true : (value === true || value === 'true');
  }
  get isEditMode(): boolean {
    return this._isEditMode;
  }

  @Output() dateChange = new EventEmitter<Date | string>()
  @Output() dateRangeChange = new EventEmitter<DateRange>()
  @Output('blur') blurEvent = new EventEmitter<void>()

  @Input() touched: boolean = false
  @Input() submitted: boolean = false
  @Input() disableTouchValidation: boolean = false
  isOpen = false
  typedValue: string = ''
  @Input() forceDropUp: boolean = false
  dropUp = false
  currentMonth: Date = new Date()
  nextMonth: Date = new Date()
  hoverDate?: Date
  calendarDates: CalendarDate[] = []
  nextCalendarDates: CalendarDate[] = []
  daysOfWeek: string[] = []
  monthNames: string[] = []
  yearOptions: number[] = []
  internalErrorStr: string | null = null;
  currentControl: AbstractControl | null = null;

  get isControlTouched(): boolean {
    return this.touched || this.submitted || !!this.currentControl?.touched;
  }
  private onChangeFn?: () => void;

  constructor(
    private readonly elementRef: ElementRef,
    // private readonly translate: TranslateService
  ) {
    this.initializeLocalization()
    this.generateCalendar()
  }

  ngOnInit(): void {
    if (!this.selectedDate && !this.dateRange?.startDate) {
      this.typedValue = '';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDate']) {
      const val = changes['selectedDate'].currentValue
      if (val) {
        this.typedValue = this.formatDateString(val)
      } else {
        this.typedValue = ''
      }
      this.syncMonthsFromRange()
      this.generateCalendar()
    }
    if (changes['strictlyAfterDate'] || changes['minDate'] || changes['maxDate']) {
      this.generateCalendar()
    }
  }

  initializeLocalization() {
    // Day names (Monday to Sunday)
    this.daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    // Month names (January to December)
    this.monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const currentYear = new Date().getFullYear()
    this.yearOptions = Array.from({ length: 151 }, (_, index) => currentYear - 100 + index)
  }

toggleCalendar() {
  if (this.disabled) return;

  if (DatePickerComponent.openInstance && DatePickerComponent.openInstance !== this) {
    DatePickerComponent.openInstance.isOpen = false;
  }

  this.isOpen = !this.isOpen;

  DatePickerComponent.openInstance = this.isOpen ? this : null;

  if (this.isOpen) {
    this.syncMonthsFromRange();
    this.generateCalendar();

    setTimeout(() => this.calculateDropdownDirection());
  }
}

  private calculateDropdownDirection() {
    if (this.forceDropUp) {
      this.dropUp = true;
      return;
    }

    const inputContainer = this.elementRef.nativeElement.querySelector('.date-input-container');
    const dropdown = this.elementRef.nativeElement.querySelector('.calendar-dropdown');

    if (inputContainer && dropdown) {
      const rect = inputContainer.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const dropdownHeight = dropdownRect.height || (this.type === 'dayToDay' ? 288 : 288);

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        this.dropUp = true;
      } else {
        this.dropUp = false;
      }
    }
  }

  private getTodayStartTime(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }

  private onChange: (value: any) => void = () => { }
  private onTouched: () => void = () => { }

  private syncMonthsFromRange() {
    this.parseDateInputs()
    this.syncDefaultDateRange()
  }

  private parseDateInputs(): void {
    this.selectedDate = this.parseDDMMYYYY(this.selectedDate)
    if (this.dateRange) {
      this.dateRange.startDate = this.parseDDMMYYYY(this.dateRange.startDate)
      this.dateRange.endDate = this.parseDDMMYYYY(this.dateRange.endDate)
    }
  }



  private syncDefaultDateRange(): void {
    if (this.dateRange?.startDate) {
      this.currentMonth = new Date(this.dateRange.startDate)
      this.nextMonth = new Date(
        this.dateRange.startDate.getFullYear(),
        this.dateRange.startDate.getMonth() + 1,
        1
      )
    } else if (this.selectedDate) {
      this.currentMonth = new Date(this.selectedDate)
      this.nextMonth = new Date(
        this.selectedDate.getFullYear(),
        this.selectedDate.getMonth() + 1,
        1
      )
    } else {
      const today = new Date()
      this.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      this.nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    }
  }

  isEmpty(): boolean {
    if (this.allowRange) {
      return !this.dateRange?.startDate
    }
    return !this.selectedDate
  }

  markTouched(): void {
    if (!this.disableTouchValidation) {
      this.touched = true
    }
    this.onTouched()
  }

  get defaultValidationMessage(): string {
    return this.label ? `Vui lòng nhập ${this.label}` : 'Trường này là bắt buộc';
  }

  private generateCalendar() {
    this.calendarDates = this.createMonthCalendar(this.currentMonth)
    this.nextCalendarDates = this.createMonthCalendar(this.nextMonth)
  }



  private createMonthCalendar(monthDate: Date): CalendarDate[] {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1)
    let startDay = firstDayOfMonth.getDay() - 1 // Convert to Monday = 0
    if (startDay < 0) startDay = 6 // Sunday becomes 6

    // Get last day of month
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()

    // Get days from previous month
    const prevMonthDays = new Date(year, month, 0).getDate()

    const dates: CalendarDate[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i)
      dates.push(this.createCalendarDate(date, today, false))
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      dates.push(this.createCalendarDate(date, today, true))
    }

    // Next month days (fill to complete weeks, up to 6 rows)
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7
    const remainingCells = totalCells - dates.length
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day)
      dates.push(this.createCalendarDate(date, today, false))
    }

    return dates
  }

  private createCalendarDate(
    date: Date,
    today: Date,
    isCurrentMonth: boolean
  ): CalendarDate {
    let isSelected = false
    let isRangeStart = false
    let isRangeEnd = false
    let isRangeStartVisual = false
    let isRangeEndVisual = false
    let isInRange = false
    let isDisabled = false

    if (this.maxDateToday && date.getTime() > today.getTime()) {
      isDisabled = true
    }

    if (this.strictlyBeforeToday && date.getTime() >= today.getTime()) {
      isDisabled = true
    }

    if (this.minDateToday && date.getTime() < today.getTime()) {
      isDisabled = true
    }

    if (this.strictlyAfterToday && date.getTime() <= today.getTime()) {
      isDisabled = true
    }

    if (this.strictlyAfterDate) {
      const parsedStrictlyAfter = this.parseDDMMYYYY(this.strictlyAfterDate);
      if (parsedStrictlyAfter && date.getTime() <= parsedStrictlyAfter.getTime()) {
        isDisabled = true;
      }
    }

    if (this.minDate) {
      const parsedMinDate = this.parseDDMMYYYY(this.minDate);
      if (parsedMinDate && date.getTime() < parsedMinDate.getTime()) {
        isDisabled = true;
      }
    }

    if (this.maxDate) {
      const parsedMaxDate = this.parseDDMMYYYY(this.maxDate);
      if (parsedMaxDate && date.getTime() > parsedMaxDate.getTime()) {
        isDisabled = true;
      }
    }

    if (this.allowRange && this.dateRange) {
      const start = this.dateRange.startDate
      const end = this.dateRange.endDate

      // Finalized range
      isRangeStart = start ? this.isSameDay(date, start) : false
      isRangeEnd = end ? this.isSameDay(date, end) : false
      isInRange = this.isDateInRangeInclusive(date, start, end)

      if (start && end) {
        const isBackwardSelection = start.getTime() > end.getTime()
        if (isBackwardSelection) {
          isRangeStartVisual = this.isSameDay(date, end)
          isRangeEndVisual = this.isSameDay(date, start)
        } else {
          isRangeStartVisual = this.isSameDay(date, start)
          isRangeEndVisual = this.isSameDay(date, end)
        }
      }
    } else {
      isSelected = this.selectedDate
        ? this.isSameDay(date, this.selectedDate)
        : false
    }

    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: this.isSameDay(date, today),
      isSelected,
      isRangeStart,
      isRangeEnd,
      isRangeStartVisual,
      isRangeEndVisual,
      isInRange,
      isDisabled,
    }
  }

  private isDateInRangeInclusive(
    date: Date,
    start?: Date,
    end?: Date
  ): boolean {
    if (!start || !end) return false
    const s = start.getTime()
    const e = end.getTime()
    const d = date.getTime()
    if (s === e) return d === s
    const min = Math.min(s, e)
    const max = Math.max(s, e)
    return d >= min && d <= max
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  previousMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    )
    this.generateCalendar()
  }

  nextMonthBtn() {
    this.markTouched()
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    )
    this.generateCalendar()
  }

  nextMonthRight() {
    this.nextMonth = new Date(
      this.nextMonth.getFullYear(),
      this.nextMonth.getMonth() + 1,
      1
    )
    this.generateCalendar()
  }

  selectDate(calendarDate: CalendarDate) {
    if (calendarDate.isDisabled) return;

    if (this.allowRange) {
      this.dateRange ??= {}

      if (!this.dateRange.startDate) {
        this.dateRange.startDate = new Date(calendarDate.date)
        this.hoverDate = undefined
        this.syncMonthsFromRange()
        this.generateCalendar()
        return
      }

      if (!this.dateRange.endDate) {
        const chosen = new Date(calendarDate.date)
        const start = new Date(this.dateRange.startDate)

        if (chosen.getTime() < start.getTime()) {
          this.dateRange.endDate = start
          this.dateRange.startDate = chosen
        } else {
          this.dateRange.endDate = chosen
        }

        this.hoverDate = undefined
        this.dateRangeChange.emit(this.dateRange)
        this.isOpen = false
        this.markTouched()
        this.syncMonthsFromRange()
        this.generateCalendar()
        return
      }

      this.dateRange.startDate = new Date(calendarDate.date)
      this.dateRange.endDate = undefined
      this.hoverDate = undefined
      this.syncMonthsFromRange()
      this.generateCalendar()
      return
    }

    // Single date selection, DOB cũng chạy vào đây
    this.selectedDate = new Date(calendarDate.date)
    this.typedValue = this.formatDateString(this.selectedDate)
    this.internalErrorStr = null
    this.emitValue(this.selectedDate);
    this.isOpen = false
    this.markTouched()
    this.syncMonthsFromRange()
    this.generateCalendar()
  }

  getMonthYearLabel(): string {
    const month = this.monthNames[this.currentMonth.getMonth()]
    const year = this.currentMonth.getFullYear()
    return `${month} ${year}`
  }
  onMonthDropdownChange(month: string | number): void {
    this.markTouched()

    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      Number(month),
      1
    )

    this.nextMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    )

    this.generateCalendar()
  }
  onYearDropdownChange(year: string | number): void {
    this.markTouched()

    this.currentMonth = new Date(
      Number(year),
      this.currentMonth.getMonth(),
      1
    )

    this.nextMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    )

    this.generateCalendar()
  }

  getNextMonthYearLabel(): string {
    const month = this.monthNames[this.nextMonth.getMonth()]
    const year = this.nextMonth.getFullYear()
    return `${month} ${year}`
  }

  getFormattedDate(): string {
    if (this.allowRange) {
      return this.formatDateRange()
    }
    if (!this.selectedDate) return ''
    return this.formatDateString(this.selectedDate)
  }

  private formatDateRange(): string {
    if (!this.dateRange?.startDate) return ''
    const start = this.formatDateString(this.dateRange.startDate)
    const end = this.dateRange.endDate
      ? this.formatDateString(this.dateRange.endDate)
      : ''
    return end ? `${start} - ${end}` : start
  }

  private formatDateString(date: any): string {
    if (!(date instanceof Date)) {
      date = new Date(date)
    }

    if (Number.isNaN(date.getTime())) return ''

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    if (this.yymmMode) {
      return `${String(year).slice(-2)}${month}`
    }
    return `${day}/${month}/${year}`
  }

  private parseDDMMYYYY(value: any): Date | undefined {
    if (!value) return undefined
    if (value instanceof Date) return value

    if (typeof value === 'string') {
      value = value.split('T')[0].split(' ')[0];
      let dd = 1, mm = 1, yyyy = 0;

      if (value.includes('-')) {
        const parts = value.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          yyyy = Number(parts[0]);
          mm = Number(parts[1]);
          dd = Number(parts[2]);
        } else {
          return undefined;
        }
      } else if (value.includes('/')) {
        const parts = value.split('/');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            yyyy = Number(parts[0]);
            mm = Number(parts[1]);
            dd = Number(parts[2]);
          } else {
            dd = Number(parts[0])
            mm = Number(parts[1])
            yyyy = Number(parts[2])
          }
        } else if (parts.length === 2) {
          dd = 1
          mm = Number(parts[0])
          yyyy = Number(parts[1])
        } else {
          return undefined
        }
      } else if (value.includes('-')) {
        const parts = value.split('-');
        if (parts.length >= 3) {
          yyyy = Number(parts[0]);
          mm = Number(parts[1]);
          dd = Number(parts[2].substring(0, 2));
        } else {
          return undefined;
        }
      } else {
        const clean = value.replace(/\D/g, '')
        if (clean.length === 8) {
          if (this.yymmMode) {
             // For yyyymmdd input if they paste it
             yyyy = Number(clean.substring(0, 4))
             mm = Number(clean.substring(4, 6))
             dd = Number(clean.substring(6, 8))
          } else {
             dd = Number(clean.substring(0, 2))
             mm = Number(clean.substring(2, 4))
             yyyy = Number(clean.substring(4, 8))
          }
        } else if (clean.length === 6) {
          dd = 1
          mm = Number(clean.substring(0, 2))
          yyyy = Number(clean.substring(2, 6))
        } else if (clean.length === 4) {
          if (this.yymmMode) {
            dd = 1
            const yyStr = clean.substring(0, 2)
            yyyy = Number("20" + yyStr)
            mm = Number(clean.substring(2, 4))
          } else {
            dd = 1
            mm = 1
            yyyy = Number(clean.substring(0, 4))
          }
        } else {
          return undefined
        }
      }

      if (yyyy < 1800) return undefined
      if (mm < 1 || mm > 12) return undefined
      if (dd < 1 || dd > 31) return undefined

      const d = new Date(yyyy, mm - 1, dd)
      if (d.getDate() !== dd || d.getMonth() !== mm - 1 || d.getFullYear() !== yyyy) {
        return undefined
      }
      return d
    }

    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? undefined : d
  }

  private emitValue(date: Date | undefined | null) {
    if (!date) {
      this.onChange(null);
      this.dateChange.emit(undefined);
      return;
    }
    
    if (this.yymmMode) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const formatted = `${yyyy}-${mm}-${dd}`;
      this.onChange(formatted);
      this.dateChange.emit(formatted);
    } else {
      this.onChange(date);
      this.dateChange.emit(date);
    }
  }


  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false
      if (DatePickerComponent.openInstance === this) {
        DatePickerComponent.openInstance = null;
      }
    }
  }

  onDateHover(calendarDate: CalendarDate) {
    if (calendarDate.isDisabled) return;
    if (
      this.allowRange &&
      this.dateRange?.startDate &&
      !this.dateRange?.endDate
    ) {
      // Only update hover state, don't regenerate calendar to avoid breaking click events
      this.hoverDate = new Date(calendarDate.date)
    }
  }

  onDateHoverLeave() {
    if (
      this.allowRange &&
      this.dateRange?.startDate &&
      !this.dateRange?.endDate
    ) {
      // Only clear hover state, don't regenerate calendar
      this.hoverDate = undefined
    }
  }

  // Helper methods for hover preview styling
  isHoverRangeStart(date: Date): boolean {
    if (
      !this.allowRange ||
      !this.dateRange?.startDate ||
      this.dateRange?.endDate ||
      !this.hoverDate
    ) {
      return false
    }
    // Always use the earlier date as range start
    const startTime = this.dateRange.startDate.getTime()
    const hoverTime = this.hoverDate.getTime()
    const rangeStart =
      startTime <= hoverTime ? this.dateRange.startDate : this.hoverDate
    return this.isSameDay(date, rangeStart)
  }

  isHoverRangeEnd(date: Date): boolean {
    if (
      !this.allowRange ||
      !this.dateRange?.startDate ||
      this.dateRange?.endDate ||
      !this.hoverDate
    ) {
      return false
    }
    // Always use the later date as range end
    const startTime = this.dateRange.startDate.getTime()
    const hoverTime = this.hoverDate.getTime()
    const rangeEnd =
      startTime >= hoverTime ? this.dateRange.startDate : this.hoverDate
    return this.isSameDay(date, rangeEnd)
  }

  isInHoverRange(date: Date): boolean {
    if (
      !this.allowRange ||
      !this.dateRange?.startDate ||
      this.dateRange?.endDate ||
      !this.hoverDate
    ) {
      return false
    }
    // Auto-sort dates for range calculation
    const startTime = this.dateRange.startDate.getTime()
    const hoverTime = this.hoverDate.getTime()
    const rangeStart =
      startTime <= hoverTime ? this.dateRange.startDate : this.hoverDate
    const rangeEnd =
      startTime >= hoverTime ? this.dateRange.startDate : this.hoverDate
    return this.isDateInRangeInclusive(date, rangeStart, rangeEnd)
  }

  writeValue(value: Date | string | null): void {
    const parsed = this.parseDDMMYYYY(value)

    if (!parsed) {
      this.selectedDate = undefined
      this.typedValue = ''
      return
    }

    this.selectedDate = parsed
    this.typedValue = this.formatDateString(parsed)
    this.syncMonthsFromRange()
    this.generateCalendar()
  }

  onInput(event: Event) {
    this.internalErrorStr = null;
    const input = event.target as HTMLInputElement;

    if (!input.value) {
      this.typedValue = '';
      this.selectedDate = undefined;
      this.onChange(null);
      this.dateChange.emit(undefined);
      if (this.onChangeFn) this.onChangeFn();
      return;
    }

    const oldSelectionStart = input.selectionStart || 0;
    const valueBeforeCursor = input.value.substring(0, oldSelectionStart);
    const digitsBeforeCursor = valueBeforeCursor.replace(/\D/g, '').length;

    let digits = input.value.replace(/\D/g, '');

    if (this.allowShortDate) {
      if (digits.length > 10) digits = digits.substring(0, 10);
    } else {
      if (digits.length > 8) digits = digits.substring(0, 8);
    }

    let formatted = '';

    if (this.yymmMode) {
      if (digits.length > 4) digits = digits.substring(0, 4);
      formatted = digits;
    } else if (!this.allowShortDate) {
      const mask = 'DD/MM/YYYY';
      let digitIndex = 0;
      for (let i = 0; i < mask.length; i++) {
        if (digitIndex < digits.length) {
          if (mask[i] === '/') {
            formatted += '/';
          } else {
            formatted += digits[digitIndex];
            digitIndex++;
          }
        } else {
          formatted += mask.substring(i);
          break;
        }
      }
      if (digits.length === 0) {
        formatted = '';
      }
    } else {
      formatted = input.value.replace(/[^\d/]/g, '');
      if (formatted.length > 10) formatted = formatted.substring(0, 10);
    }

    input.value = formatted;
    this.typedValue = formatted;

    if (!this.allowShortDate && formatted.length > 0) {
      let newCursorPos = 0;
      let dCount = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (dCount === digitsBeforeCursor) {
          newCursorPos = i;
          break;
        }
        if (/\d/.test(formatted[i])) {
          dCount++;
        }
      }
      if (dCount === digitsBeforeCursor && newCursorPos === 0) {
        newCursorPos = formatted.length;
        for (let i = 0; i < formatted.length; i++) {
          if (['D', 'M', 'Y'].includes(formatted[i])) {
            newCursorPos = i;
            break;
          }
        }
      } else if (dCount < digitsBeforeCursor) {
        newCursorPos = formatted.length;
      }
      input.setSelectionRange(newCursorPos, newCursorPos);
    } else {
      input.setSelectionRange(oldSelectionStart, oldSelectionStart);
    }

    let parsed: Date | undefined;
    if (this.yymmMode) {
      if (digits.length === 4) {
        parsed = this.parseDDMMYYYY(formatted);
      }
    } else if (!this.allowShortDate) {
      if (digits.length === 8) {
        parsed = this.parseDDMMYYYY(formatted);
      }
    } else {
      parsed = this.parseDDMMYYYY(formatted);
    }

    if (parsed) {
      const error = this.validateDate(parsed);
      if (error) {
        this.internalErrorStr = error;
        this.selectedDate = undefined;
        this.emitValue(null);
      } else {
        this.selectedDate = parsed;
        this.internalErrorStr = null;
        this.emitValue(this.selectedDate);
        this.syncMonthsFromRange();
        this.generateCalendar();
      }
    } else {
      this.selectedDate = undefined;
      if (this.yymmMode && digits.length === 4) {
        this.internalErrorStr = 'Ngày không hợp lệ';
      } else if (!this.allowShortDate && digits.length === 8) {
        this.internalErrorStr = 'Ngày không hợp lệ';
      } else {
        this.internalErrorStr = null;
      }
      this.emitValue(null);
    }
    if (this.onChangeFn) this.onChangeFn();
  }

  onBlur() {
    this.blurEvent.emit()
    this.markTouched()

    if (!this.typedValue) {
      this.selectedDate = undefined
      this.typedValue = ''
      this.emitValue(null);
      if (this.onChangeFn) this.onChangeFn();
      return
    }

    let parsed: Date | undefined;

    if (this.typedValue.includes('/')) {
      parsed = this.parseDDMMYYYY(this.typedValue)
    } else {
      const clean = this.typedValue.replace(/\D/g, '')
      if (clean.length !== 4 && clean.length !== 6 && clean.length !== 8) {
        this.internalErrorStr = 'Ngày không hợp lệ';
        this.selectedDate = undefined;
        this.emitValue(null);
        if (this.onChangeFn) this.onChangeFn();
        return;
      }

      let dd = '01', mm = '01', yyyy = '';
      if (clean.length === 8) {
        dd = clean.substring(0, 2);
        mm = clean.substring(2, 4);
        yyyy = clean.substring(4, 8);
      } else if (clean.length === 6) {
        mm = clean.substring(0, 2);
        yyyy = clean.substring(2, 6);
      } else if (clean.length === 4) {
        yyyy = clean.substring(0, 4);
      }
      this.typedValue = `${dd}/${mm}/${yyyy}`;

      parsed = this.parseDDMMYYYY(this.typedValue)
    }

    if (parsed) {
      const error = this.validateDate(parsed);
      if (error) {
        this.internalErrorStr = error;
        this.selectedDate = undefined;
        this.emitValue(null);
        if (this.onChangeFn) this.onChangeFn();
        return;
      }
      this.selectedDate = parsed
      this.typedValue = this.formatDateString(parsed)
      this.emitValue(this.selectedDate);
      this.syncMonthsFromRange()
      this.generateCalendar()
    } else {
      this.internalErrorStr = 'Ngày không tồn tại hoặc năm < 1800';
      this.selectedDate = undefined
      this.emitValue(null);
    }
    if (this.onChangeFn) this.onChangeFn();
  }

  onFocus() {
    // Only open calendar on icon click. Input focus just allows typing.
  }

  onKeyPress(event: KeyboardEvent): void {
    const key = event.key;
    if (key.length > 1) return;
    if (!/[0-9/]/.test(key)) {
      event.preventDefault();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this._formDisabled = isDisabled;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onChangeFn = fn;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    this.currentControl = control;
    if (this.required && this.isEmpty()) {
      return { required: true };
    }
    if (!this.allowShortDate && this.typedValue) {
      const digits = this.typedValue.replace(/\D/g, '');
      if (digits.length > 0 && digits.length < 8) {
        return { invalidDate: 'Ngày chưa đầy đủ' };
      }
    }
    if (this.internalErrorStr) {
      return { invalidDate: this.internalErrorStr };
    }
    return null;
  }

  private validateDate(parsed: Date): string | null {
    const todayStart = this.getTodayStartTime()

    // rule chung
    if (this.maxDateToday && parsed.getTime() > todayStart) {
      return 'Ngày không được lớn hơn ngày hiện tại'
    }

    if (this.strictlyBeforeToday && parsed.getTime() >= todayStart) {
      return 'Ngày phải nhỏ hơn ngày hiện tại'
    }

    if (this.minDateToday && parsed.getTime() < todayStart) {
      return 'Ngày không được nhỏ hơn ngày hiện tại'
    }

    if (this.strictlyAfterToday && parsed.getTime() <= todayStart) {
      return 'Ngày phải lớn hơn ngày hiện tại'
    }

    if (this.strictlyAfterDate) {
      const parsedStrictlyAfter = this.parseDDMMYYYY(this.strictlyAfterDate);
      if (parsedStrictlyAfter && parsed.getTime() <= parsedStrictlyAfter.getTime()) {
        return `Ngày phải lớn hơn ${this.formatDateString(parsedStrictlyAfter)}`
      }
    }

    if (this.minDate) {
      const parsedMinDate = this.parseDDMMYYYY(this.minDate);
      if (parsedMinDate && parsed.getTime() < parsedMinDate.getTime()) {
        return `Ngày phải từ ngày ${this.formatDateString(parsedMinDate)}`
      }
    }

    if (this.maxDate) {
      const parsedMaxDate = this.parseDDMMYYYY(this.maxDate);
      if (parsedMaxDate && parsed.getTime() > parsedMaxDate.getTime()) {
        return `Ngày không được lớn hơn ngày ${this.formatDateString(parsedMaxDate)}`
      }
    }
    return null
  }

  private calculateAge(dob: Date): number {
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()

    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--
    }

    return age
  }
}

