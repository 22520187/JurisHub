import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  TemplateRef,
  AfterContentInit,
  AfterViewInit,
  ViewChildren,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ----------------------------------------------------------------
// TabItem model — passed in via @Input() tabs
// ----------------------------------------------------------------
export interface TabItem {
  /** Display label */
  label: string;

  /** SVG string or any HTML string to render as icon */
  icon?: string;

  /** Show red asterisk (e.g. required / unsaved) */
  required?: boolean;

  /** Badge value shown on the tab.
   *  - number / string  → shown as text pill
   *  - any truthy value with badgeType = 'dot' → shown as red dot
   */
  badge?: string | number;

  /** 'dot' renders a small dot; omit or 'count' renders number pill */
  badgeType?: 'dot' | 'count';

  /** Disable interaction */
  disabled?: boolean;

  /**
   * The TemplateRef that contains the tab's content.
   * Consumers obtain this via ViewChild / ContentChild and pass it in.
   *
   * Example in parent template:
   *   <ng-template #myContent>
   *     <app-financial-info></app-financial-info>
   *   </ng-template>
   *
   *   [tabs]="[{ label: 'Financial', content: myContent }]"
   */
  content: TemplateRef<any>;

  /** Arbitrary extra data — carry anything you need */
  data?: any;
}

// ----------------------------------------------------------------
// TabChangeEvent — emitted on tab switch
// ----------------------------------------------------------------
export interface TabChangeEvent {
  previousIndex: number;
  currentIndex: number;
  tab: TabItem;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
@Component({
  selector: 'tellerapp-tab-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-card.component.html',
  styleUrls: ['./tab-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabCardComponent implements AfterViewInit, OnChanges {
  // ---------------------------
  // Inputs
  // ---------------------------

  /** Array of tab definitions */
  @Input() tabs: TabItem[] = [];

  /** Which tab to start on (zero-based) */
  @Input() defaultIndex: number = 0;

  /** Controlled active index (two-way via activeIndexChange) */
  @Input() activeIndex: number = 0;

  /** Two-way binding support: [(activeIndex)]="myIndex" */
  @Output() activeIndexChange = new EventEmitter<number>();

  /** Primary colour used for active tab text + indicator */
  @Input() activeColor?: string;

  /** Colour of the sliding indicator line (defaults to activeColor) */
  @Input() indicatorColor?: string;

  /** Add drop shadow */
  @Input() shadow: boolean = true;

  /** Add 1px border */
  @Input() bordered: boolean = true;

  /** Override CSS border-radius, e.g. '8px' */
  @Input() borderRadius?: string;

  /** Remove padding inside panel */
  @Input() noPadding: boolean = false;

  /** Allow tabs row to scroll horizontally when there are many tabs */
  @Input() scrollableTabs: boolean = false;

  /**
   * When true, tab panels are only rendered once they have been visited.
   * This avoids rendering hidden components on load while still preserving
   * their DOM state once they've been opened.
   */
  @Input() lazyLoad: boolean = true;

  /** Optional template to render in the top-right of the header */
  @Input() headerExtra?: TemplateRef<any>;

  /** Optional template rendered in the footer of the card */
  @Input() footer?: TemplateRef<any>;

  // ---------------------------
  // Outputs
  // ---------------------------

  /** Fires before the tab changes — call event.preventDefault() to cancel */
  @Output() beforeTabChange = new EventEmitter<TabChangeEvent & { preventDefault: () => void }>();

  /** Fires after the active tab changes */
  @Output() tabChange = new EventEmitter<TabChangeEvent>();

  // ---------------------------
  // View refs for indicator
  // ---------------------------
  @ViewChildren('tabContent') tabContentRefs!: QueryList<ElementRef<HTMLSpanElement>>;

  // ---------------------------
  // Internal state
  // ---------------------------
  readonly componentId: string = Math.random().toString(36).slice(2, 9);
  visitedTabs: Set<number> = new Set();
  indicatorOffset: number = 0;
  indicatorWidth: number = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    private host: ElementRef<HTMLElement>
  ) {}

  ngAfterViewInit(): void {
    // Initialise with defaultIndex on first render
    this.activeIndex = this.defaultIndex;
    this.visitedTabs.add(this.activeIndex);
    this.updateIndicator();
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeIndex'] && !changes['activeIndex'].firstChange) {
      this.visitedTabs.add(this.activeIndex);
      // Wait one tick so the DOM is updated before measuring
      setTimeout(() => this.updateIndicator(), 0);
    }

    if (changes['tabs'] && !changes['tabs'].firstChange) {
      setTimeout(() => this.updateIndicator(), 0);
    }
  }

  // ---------------------------
  // Public API
  // ---------------------------

  /** Programmatically select a tab by index */
  selectTab(index: number, tab?: TabItem): void {
    if (!tab) {
      tab = this.tabs[index];
    }
    if (!tab || tab.disabled || index === this.activeIndex) return;

    let cancelled = false;
    const event = {
      previousIndex: this.activeIndex,
      currentIndex: index,
      tab,
      preventDefault: () => { cancelled = true; },
    };

    this.beforeTabChange.emit(event);
    if (cancelled) return;

    const previousIndex = this.activeIndex;
    this.activeIndex = index;
    this.visitedTabs.add(index);
    this.activeIndexChange.emit(index);
    this.tabChange.emit({ previousIndex, currentIndex: index, tab });
    this.updateIndicator();
    this.cdr.markForCheck();
  }

  /** Navigate to next tab */
  nextTab(): void {
    const next = this.activeIndex + 1;
    if (next < this.tabs.length) this.selectTab(next);
  }

  /** Navigate to previous tab */
  prevTab(): void {
    const prev = this.activeIndex - 1;
    if (prev >= 0) this.selectTab(prev);
  }

  // ---------------------------
  // Indicator calculation
  // ---------------------------
  private updateIndicator(): void {
    const buttons = this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.tab-card__tab');
    if (!buttons.length) return;

    const activeBtn = buttons[this.activeIndex] as HTMLButtonElement;
    if (!activeBtn) return;

    const tabsEl = this.host.nativeElement.querySelector<HTMLElement>('.tab-card__tabs');
    if (!tabsEl) return;

    // Get the inner content element (icon + label only, not required/badge)
    const contentEl = activeBtn.querySelector<HTMLElement>('.tab-card__tab-content');
    if (!contentEl) return;

    const tabsRect = tabsEl.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const contentRect = contentEl.getBoundingClientRect();

    // Calculate offset from tabs container to button, then from button to content
    const btnOffset = btnRect.left - tabsRect.left;
    const contentOffsetInBtn = contentRect.left - btnRect.left;
    this.indicatorOffset = btnOffset + contentOffsetInBtn;
    this.indicatorWidth = contentRect.width;
    this.cdr.markForCheck();
  }
}