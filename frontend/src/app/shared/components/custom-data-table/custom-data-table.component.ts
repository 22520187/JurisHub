import { Component, HostListener, TemplateRef, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';

export interface TableBadge {
  value: string;
  bg: string;
  color: string;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  minWidth?: number;
  width?: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: unknown, row: T) => string;
  badges?: TableBadge[];
}

export interface TableAction<T = Record<string, unknown>> {
  id: string;
  label: string;
  iconOnly?: boolean;
  iconClass?: string;
  iconClassFn?: (row: T) => string;
  iconColor?: string;
  iconColorFn?: (row: T) => string;
  icon?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
}

export interface TablePageChangeEvent {
  page: number;
  pageSize: number;
}

export interface TableActionEvent<T = Record<string, unknown>> {
  actionId: string;
  row: T;
  rowIndex: number;
}

export interface TableSelectionChangeEvent<T = Record<string, unknown>> {
  selected: T[];
  count: number;
}

export interface TableStyles {
  headerBg?: string;
  headerColor?: string;
  rowHoverBg?: string;
  borderColor?: string;
  fontSize?: string;
  fontFamily?: string;
  stripeBg?: string;
  selectedBg?: string;
  activeRowBg?: string;
}

export interface TableCellTemplateContext<T = Record<string, unknown>> {
  $implicit: T;
  row: T;
  rowIndex: number;
  column: TableColumn<T>;
}

// ─── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'tellerapp-custom-data-table',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet],
  templateUrl: './custom-data-table.component.html',
  styleUrl: './custom-data-table.component.scss',
})
export class CustomDataTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  // ── Inputs ─────────────────────────────────────────────────────────────────

  readonly columns = input.required<TableColumn<T>[]>();

  readonly data = input<T[]>([]);

  readonly loading = input(false);

  readonly selectable = input(false);

  readonly singleSelection = input(false);

  readonly actions = input<TableAction<T>[]>([]);

  readonly pagination = input<TablePagination | null>(null);

  readonly tableStyles = input<TableStyles>({});

  readonly striped = input(false);

  readonly bordered = input(true);

  readonly compact = input(false);

  readonly horizontalScroll = input(false);

  readonly highlightRowOnClick = input(false);

  readonly rowKey = input<string>('id');

  readonly hideEmpty = input(false);

  readonly emptyMode = input<'initial' | 'no-results'>('initial');

  readonly showIndex = input(false);

  readonly indexWidth = input<string>('56px');

  readonly cellTemplates = input<Record<string, TemplateRef<TableCellTemplateContext<T>> | null>>({});

  readonly expandTemplate = input<TemplateRef<{ $implicit: T; row: T; rowIndex: number }> | null>(null);
  // ── Outputs ────────────────────────────────────────────────────────────────

  readonly selectionChange = output<TableSelectionChangeEvent<T>>();

  readonly actionClick = output<TableActionEvent<T>>();

  readonly pageChange = output<TablePageChangeEvent>();

  readonly rowClick = output<{ row: T; rowIndex: number }>();

  readonly rowDblClick = output<{ row: T; rowIndex: number }>();

  // ── Internal state ─────────────────────────────────────────────────────────

  private readonly _selectedKeys = signal<Set<unknown>>(new Set());
  private readonly _expandedKeys = signal<Set<unknown>>(new Set());
  private readonly _highlightedKey = signal<unknown>(null);

  constructor() {
    effect(() => {
      this.data();
      if (this.highlightRowOnClick()) {
        this._highlightedKey.set(null);
      }
    });
  }

  protected readonly isOpen = signal(false);
  protected readonly selectedSize = computed(() => this.pagination()?.pageSize ?? 10);

  // ── Computed ───────────────────────────────────────────────────────────────

  protected readonly isAllSelected = computed(() => {
    const d = this.data();
    return d.length > 0 && d.every(r => this._selectedKeys().has(this.getRowKey(r)));
  });

  protected readonly isIndeterminate = computed(() => {
    const count = this.data().filter(r => this._selectedKeys().has(this.getRowKey(r))).length;
    return count > 0 && count < this.data().length;
  });

  protected readonly selectedCount = computed(() =>
    this.data().filter(r => this._selectedKeys().has(this.getRowKey(r))).length
  );

  protected readonly colSpan = computed(() => {
    let n = this.columns().length;
    if (this.showIndex()) n++;
    if (this.selectable()) n++;
    if (this.actions().length > 0) n++;
    return n;
  });

  protected readonly indexOffset = computed(() => {
    const p = this.pagination();
    return p ? (p.page - 1) * p.pageSize : 0;
  });

  protected readonly skeletonRows = computed(() =>
    Array(Math.min(this.pagination()?.pageSize ?? 5, 10)).fill(null)
  );

  protected readonly totalPages = computed(() => {
    const p = this.pagination();
    return p ? Math.ceil(p.total / p.pageSize) : 0;
  });

  protected readonly pageNumbers = computed((): (number | '...')[] => {
    const total = this.totalPages();
    const cur = this.pagination()?.page ?? 1;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];
    if (cur > 3) pages.push('...');
    const from = Math.max(2, cur - 1);
    const to   = Math.min(total - 1, cur + 1);
    for (let i = from; i <= to; i++) pages.push(i);
    if (cur < total - 2) pages.push('...');
    if (total > 1) pages.push(total);
    return pages;
  });

  protected readonly pageStart = computed(() => {
    const p = this.pagination();
    return p && p.total > 0 ? (p.page - 1) * p.pageSize + 1 : 0;
  });

  protected readonly pageEnd = computed(() => {
    const p = this.pagination();
    return p ? Math.min(p.page * p.pageSize, p.total) : 0;
  });

  protected readonly cssVars = computed((): Record<string, string> => {
    const s = this.tableStyles();
    return {
      '--tbl-header-bg':    s.headerBg    ?? '#1a237e',
      '--tbl-header-color': s.headerColor ?? '#ffffff',
      '--tbl-hover-bg':     s.rowHoverBg  ?? '#e8eaf6',
      '--tbl-border':       s.borderColor ?? '#e0e0e0',
      '--tbl-font-size':    s.fontSize    ?? '0.875rem',
      '--tbl-font-family':  s.fontFamily  ?? 'inherit',
      '--tbl-stripe-bg':    s.stripeBg    ?? '#f8f9fa',
      '--tbl-active-bg':    s.activeRowBg ?? '#d5e4fb',
      '--tbl-selected-bg':  s.selectedBg  ?? '#e3f2fd',
      '--tbl-index-width':  this.indexWidth(),
    };
  });

  // ── Helpers used in template ────────────────────────────────────────────────

  protected getRowKey(row: T): unknown {
    return row[this.rowKey()];
  }

  protected isRowSelected(row: T): boolean {
    return this._selectedKeys().has(this.getRowKey(row));
  }

  protected isRowHighlighted(row: T): boolean {
    return this.highlightRowOnClick() && this._highlightedKey() === this.getRowKey(row);
  }

  public isRowExpanded(row: T): boolean {
    return this._expandedKeys().has(this.getRowKey(row));
  }

  public toggleRowExpand(row: T): void {
    const keys = new Set(this._expandedKeys());
    const k = this.getRowKey(row);
    if (keys.has(k)) keys.delete(k); else keys.add(k);
    this._expandedKeys.set(keys);
  }

  protected cellValue(row: T, col: TableColumn<T>): string {
    const v = row[col.key];
    return col.formatter ? col.formatter(v, row) : (v == null ? '' : String(v));
  }

  /** Returns the matching badge config for a cell, or `null` if no badge applies. */
  protected cellBadge(row: T, col: TableColumn<T>): TableBadge | null {
    if (!col.badges?.length) return null;
    const text = this.cellValue(row, col);
    return col.badges.find(b => b.value === text) ?? null;
  }

  protected colHeaderStyle(col: TableColumn<T>): Record<string, string> {
    const s: Record<string, string> = {};
    if (col.width) s['width'] = col.width;
    else if (col.minWidth) s['minWidth'] = `${col.minWidth}px`;
    return s;
  }

  protected colCellStyle(col: TableColumn<T>): Record<string, string> {
    return this.buildColStyle(col);
  }

  protected actionVisible(action: TableAction<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  protected actionDisabled(action: TableAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  protected actionIconClass(action: TableAction<T>, row: T): string {
    if (action.iconClassFn) return action.iconClassFn(row);
    return action.iconClass ?? '';
  }

  protected actionIconColor(action: TableAction<T>, row: T): string {
    if (action.iconColorFn) return action.iconColorFn(row);
    return action.iconColor ?? 'inherit';
  }

  protected cellTemplateFor(key: string): TemplateRef<TableCellTemplateContext<T>> | null {
    return this.cellTemplates()[key] ?? null;
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  protected toggleAll(): void {
    if (this.isAllSelected()) {
      this._selectedKeys.set(new Set());
    } else {
      this._selectedKeys.set(new Set(this.data().map(r => this.getRowKey(r))));
    }
    this.emitSelection();
  }

  protected toggleRow(row: T): void {
    const keys = new Set(this._selectedKeys());
    const k = this.getRowKey(row);
    const wasSelected = keys.has(k);
    if (this.singleSelection()) {
      keys.clear();
      if (!wasSelected) {
        keys.add(k);
      }
    } else {
      if (wasSelected) {
        keys.delete(k);
      } else {
        keys.add(k);
      }
    }
    this._selectedKeys.set(keys);
    this.emitSelection();
  }

  private _clickTimeout: any = null;

  protected onRowClick(row: T, rowIndex: number): void {
    if (this._clickTimeout) {
      // Nếu đã có click trước đó (trong vòng 250ms), đây là double click
      clearTimeout(this._clickTimeout);
      this._clickTimeout = null;
      this.onRowDblClick(row, rowIndex);
    } else {
      // Đặt timer cho single click
      this._clickTimeout = setTimeout(() => {
        this._clickTimeout = null;
        if (this.highlightRowOnClick()) {
          this._highlightedKey.set(this.getRowKey(row));
        }
        this.rowClick.emit({ row, rowIndex });
      }, 250); // 250ms là ngưỡng thời gian chuẩn cho double click
    }
  }

  protected onRowDblClick(row: T, rowIndex: number): void {
    console.log("CustomDataTable - onRowDblClick triggered", row);
    this.rowDblClick.emit({ row, rowIndex });
  }

  protected onAction(actionId: string, row: T, rowIndex: number): void {
    this.actionClick.emit({ actionId, row, rowIndex });
  }

  protected goToPage(page: number | '...'): void {
    if (page === '...') return;
    const p = this.pagination();
    if (!p || page < 1 || page > this.totalPages()) return;
    this.pageChange.emit({ page, pageSize: p.pageSize });
  }

  protected toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen.update(v => !v);
  }

  protected selectSize(size: number, event: Event): void {
    event.stopPropagation();
    this.isOpen.set(false);
    const p = this.pagination();
    if (!p) return;
    this.pageChange.emit({ page: 1, pageSize: size });
  }

  @HostListener('document:click')
  protected closeDropdown(): void {
    this.isOpen.set(false);
  }

  // ── Private utilities ───────────────────────────────────────────────────────

  private buildColStyle(col: TableColumn<T>): Record<string, string> {
    const s: Record<string, string> = {};
    if (col.width) s['width'] = col.width;
    else if (col.minWidth) s['minWidth'] = `${col.minWidth}px`;
    if (col.align) s['textAlign'] = col.align;
    return s;
  }

  private emitSelection(): void {
    const keys = this._selectedKeys();
    const selected = this.data().filter(r => keys.has(this.getRowKey(r)));
    this.selectionChange.emit({ selected, count: selected.length });
  }
}
