import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, PostModeration } from '../../../core/services/admin.service';
import {
  ButtonComponent,
  ToastMessageComponent,
  CustomDataTableComponent,
  ModalCustomComponent,
  TableColumn,
  TablePagination,
  TablePageChangeEvent,
  TableStyles
} from '../../../shared/components';

export type ViolationTab = 'posts' | 'replies';

@Component({
  selector: 'app-admin-violations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ToastMessageComponent,
    CustomDataTableComponent,
    ModalCustomComponent
  ],
  templateUrl: './violations.component.html',
  styleUrl: './violations.component.scss'
})
export class ViolationsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Active Tab: 'posts' (Bài viết) | 'replies' (Bình luận)
  activeTab = signal<ViolationTab>('posts');

  // Table Configuration
  readonly postTableColumns: TableColumn<PostModeration>[] = [
    { key: 'content', label: 'Bài viết', width: '380px', minWidth: 340, align: 'left' },
    { key: 'author', label: 'Tác giả', width: '210px', minWidth: 190, align: 'left' },
    { key: 'reportCount', label: 'Số báo cáo', width: '100px', minWidth: 90, align: 'center' },
    { key: 'violationReason', label: 'Lý do', width: '130px', minWidth: 100, align: 'center' },
    { key: 'status', label: 'Trạng thái', width: '130px', minWidth: 120, align: 'center' },
    { key: 'createdAt', label: 'Ngày tạo', width: '120px', minWidth: 110, align: 'center' },
    { key: 'actions', label: 'Thao tác', width: '220px', minWidth: 200, align: 'center' }
  ];

  readonly replyTableColumns: TableColumn<PostModeration>[] = [
    { key: 'content', label: 'Bình luận', width: '380px', minWidth: 340, align: 'left' },
    { key: 'author', label: 'Người bình luận', width: '210px', minWidth: 190, align: 'left' },
    { key: 'reportCount', label: 'Số báo cáo', width: '100px', minWidth: 90, align: 'center' },
    { key: 'violationReason', label: 'Lý do', width: '130px', minWidth: 100, align: 'center' },
    { key: 'status', label: 'Trạng thái', width: '130px', minWidth: 120, align: 'center' },
    { key: 'createdAt', label: 'Ngày tạo', width: '120px', minWidth: 110, align: 'center' },
    { key: 'actions', label: 'Thao tác', width: '220px', minWidth: 200, align: 'center' }
  ];

  readonly tablePagination = computed<TablePagination>(() => ({
    page: this.currentPage() + 1,
    pageSize: this.pageSize(),
    total: this.totalElements(),
    pageSizeOptions: [10, 20, 50]
  }));

  readonly tableStyles: TableStyles = {
    headerBg: '#fafbfc',
    headerColor: '#64748b',
    rowHoverBg: '#f8fafc',
    borderColor: '#f1f5f9',
    fontSize: '0.875rem'
  };

  // State Signals
  violationsList = signal<PostModeration[]>([]);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Stat Counters
  totalViolations = signal<number>(0);
  pendingViolations = signal<number>(0);
  processedViolations = signal<number>(0);
  deactivatedViolations = signal<number>(0);

  // Filters
  searchQuery = '';
  selectedStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  // Detail Modal State
  isDetailModalOpen = signal<boolean>(false);
  selectedItem = signal<PostModeration | null>(null);

  // Deactivate Reason Modal State
  isReasonModalOpen = signal<boolean>(false);
  targetDeactivateItem = signal<PostModeration | null>(null);
  deactivateReason = '';
  isDeactivating = signal<boolean>(false);

  // Quick reason presets
  readonly reasonPresets = [
    'Spam quảng cáo dịch vụ',
    'Ngôn từ xúc phạm, thù địch',
    'Nội dung sai sự thật, lừa đảo',
    'Vi phạm tiêu chuẩn cộng đồng'
  ];

  // Toast State
  toastVisible = false;
  toastType: 'success' | 'error' | 'warning' = 'success';
  toastTitle = '';
  toastMessage = '';

  ngOnInit(): void {
    this.loadViolations(0);
    this.loadStats();
  }

  /**
   * Switch between Posts and Replies tabs
   */
  switchTab(tab: ViolationTab): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.searchQuery = '';
    this.selectedStatus = 'ALL';
    this.loadViolations(0);
    this.loadStats();
  }

  /**
   * Load violations list based on active tab and filters
   */
  loadViolations(page: number = 0): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    let isActiveParam: boolean | undefined = undefined;
    if (this.selectedStatus === 'ACTIVE') isActiveParam = true;
    if (this.selectedStatus === 'INACTIVE') isActiveParam = false;

    const requestParams = {
      page,
      size: this.pageSize(),
      sortBy: 'createdAt',
      sortDir: 'desc',
      search: this.searchQuery.trim() || undefined,
      isActive: isActiveParam
    };

    const apiCall$ =
      this.activeTab() === 'posts'
        ? this.adminService.getViolationPosts(requestParams)
        : this.adminService.getViolationReplies(requestParams);

    apiCall$.subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.currentPage.set(res.data.number ?? page);
          this.totalPages.set(res.data.totalPages ?? 0);
          this.totalElements.set(res.data.totalElements ?? 0);
          this.violationsList.set(res.data.content || []);
        } else {
          this.violationsList.set([]);
          this.totalElements.set(0);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.hasError.set(true);
        this.errorMessage.set(
          err.error?.message || 'Không thể tải danh sách vi phạm. Vui lòng thử lại sau.'
        );
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Load metric statistics for top 4 cards
   */
  loadStats(): void {
    const isPosts = this.activeTab() === 'posts';

    // 1. Total violations
    const total$ = isPosts
      ? this.adminService.getViolationPosts({ page: 0, size: 1 })
      : this.adminService.getViolationReplies({ page: 0, size: 1 });

    total$.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.totalViolations.set(res.data.totalElements ?? 0);
          this.cdr.markForCheck();
        }
      }
    });

    // 2. Pending (isActive == true)
    const pending$ = isPosts
      ? this.adminService.getViolationPosts({ page: 0, size: 1, isActive: true })
      : this.adminService.getViolationReplies({ page: 0, size: 1, isActive: true });

    pending$.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pendingViolations.set(res.data.totalElements ?? 0);
          this.cdr.markForCheck();
        }
      }
    });

    // 3. Deactivated (isActive == false)
    const deactivated$ = isPosts
      ? this.adminService.getViolationPosts({ page: 0, size: 1, isActive: false })
      : this.adminService.getViolationReplies({ page: 0, size: 1, isActive: false });

    deactivated$.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.deactivatedViolations.set(res.data.totalElements ?? 0);
          this.cdr.markForCheck();
        }
      }
    });
  }

  /**
   * Search button clicked / enter pressed
   */
  onSearch(): void {
    this.loadViolations(0);
  }

  /**
   * Status dropdown change
   */
  onStatusFilterChange(): void {
    this.loadViolations(0);
  }

  /**
   * Pagination change
   */
  onPageChange(event: TablePageChangeEvent): void {
    const targetPage = event.page - 1;
    if (this.pageSize() !== event.pageSize) {
      this.pageSize.set(event.pageSize);
    }
    this.loadViolations(targetPage);
  }

  // ─────────────────────────────────────────────────────────────
  // Detail Modal Actions
  // ─────────────────────────────────────────────────────────────

  openDetailModal(item: PostModeration): void {
    this.selectedItem.set(item);
    this.isDetailModalOpen.set(true);
    this.cdr.markForCheck();
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────────────────────
  // Deactivate Reason Modal Actions
  // ─────────────────────────────────────────────────────────────

  openDeactivateModal(item: PostModeration): void {
    this.targetDeactivateItem.set(item);
    this.deactivateReason = '';
    this.isReasonModalOpen.set(true);
    this.cdr.markForCheck();
  }

  closeDeactivateModal(): void {
    this.isReasonModalOpen.set(false);
    this.targetDeactivateItem.set(null);
    this.deactivateReason = '';
    this.cdr.markForCheck();
  }

  selectPresetReason(preset: string): void {
    this.deactivateReason = preset;
  }

  confirmDeactivate(): void {
    const target = this.targetDeactivateItem();
    if (!target) return;

    this.isDeactivating.set(true);
    const isPosts = this.activeTab() === 'posts';

    const updateCall$ = isPosts
      ? this.adminService.updatePostStatus(target.id, false, this.deactivateReason)
      : this.adminService.updateReplyStatus(target.id, false);

    updateCall$.subscribe({
      next: (res) => {
        this.isDeactivating.set(false);
        this.closeDeactivateModal();
        if (this.isDetailModalOpen() && this.selectedItem()?.id === target.id) {
          // Update selected item in open detail modal
          const updated = { ...target, isActive: false, violationReason: this.deactivateReason || target.violationReason };
          this.selectedItem.set(updated);
        }
        this.showToast('success', 'Thành công', 'Đã vô hiệu hóa nội dung vi phạm thành công');
        this.loadViolations(this.currentPage());
        this.loadStats();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDeactivating.set(false);
        this.showToast('error', 'Lỗi', err.error?.message || 'Không thể vô hiệu hóa nội dung');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Re-activate content that was previously deactivated
   */
  reactivateItem(item: PostModeration): void {
    const isPosts = this.activeTab() === 'posts';
    const updateCall$ = isPosts
      ? this.adminService.updatePostStatus(item.id, true)
      : this.adminService.updateReplyStatus(item.id, true);

    updateCall$.subscribe({
      next: () => {
        if (this.isDetailModalOpen() && this.selectedItem()?.id === item.id) {
          this.selectedItem.set({ ...item, isActive: true });
        }
        this.showToast('success', 'Thành công', 'Đã kích hoạt lại nội dung thành công');
        this.loadViolations(this.currentPage());
        this.loadStats();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToast('error', 'Lỗi', err.error?.message || 'Không thể kích hoạt lại nội dung');
        this.cdr.markForCheck();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  showToast(type: 'success' | 'error' | 'warning', title: string, message: string): void {
    this.toastType = type;
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastVisible = true;
  }
}
