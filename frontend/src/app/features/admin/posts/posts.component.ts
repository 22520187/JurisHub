import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, PostModeration } from '../../../core/services/admin.service';
import {
  ButtonComponent,
  ConfirmPopupComponent,
  ToastMessageComponent,
  CustomDataTableComponent,
  ModalCustomComponent,
  TableColumn,
  TablePagination,
  TablePageChangeEvent,
  TableStyles
} from '../../../shared/components';

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ConfirmPopupComponent,
    ToastMessageComponent,
    CustomDataTableComponent,
    ModalCustomComponent
  ],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.scss'
})
export class PostsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Table Configuration for tellerapp-custom-data-table (compact widths to fit 1 screen)
  readonly tableColumns: TableColumn<PostModeration>[] = [
    { key: 'title', label: 'Tiêu đề', minWidth: 160, align: 'left' },
    { key: 'author', label: 'Tác giả', width: '135px', align: 'left' },
    { key: 'categoryName', label: 'Danh mục', width: '110px', align: 'left' },
    { key: 'stats', label: 'Thống kê', width: '80px', align: 'left' },
    { key: 'isActive', label: 'Trạng thái', width: '100px', align: 'center' },
    { key: 'createdAt', label: 'Ngày tạo ↓', width: '105px', align: 'left' },
    { key: 'actions', label: 'Hành động', width: '150px', align: 'center' }
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

  // State signals
  posts = signal<PostModeration[]>([]);
  rawPosts = signal<PostModeration[]>([]);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Top metric counters
  totalPostsCount = signal<number>(0);
  activePostsCount = signal<number>(0);
  pinnedPostsCount = signal<number>(0);
  hotPostsCount = signal<number>(0);

  // Filters state
  isFilterOpen = false;
  searchQuery = '';
  filterStatus = 'ALL'; // ALL, ACTIVE, INACTIVE
  filterCategory = 'ALL';
  filterPinned = 'ALL'; // ALL, PINNED, UNPINNED
  filterHot = 'ALL'; // ALL, HOT, NOT_HOT
  filterAuthorRole = 'ALL'; // ALL, USER, LAWYER, ADMIN
  filterReported = 'ALL'; // ALL, REPORTED, NOT_REPORTED

  // Categories list
  categories: string[] = [
    'Hình sự',
    'Dân sự',
    'Đất đai',
    'Lao động',
    'Hôn nhân và gia đình',
    'Kinh doanh & Doanh nghiệp',
    'Giao thông'
  ];

  // Post detail modal state (signals for instant change detection)
  isDetailModalOpen = signal<boolean>(false);
  selectedPost = signal<PostModeration | null>(null);
  isLoadingDetail = signal<boolean>(false);

  // Delete modal state
  showDeleteModal = signal<boolean>(false);
  targetDeletePost = signal<PostModeration | null>(null);
  isDeleting = signal<boolean>(false);

  // Toast state
  toastVisible = false;
  toastType: 'success' | 'error' | 'warning' = 'success';
  toastTitle = '';
  toastMessage = '';

  ngOnInit(): void {
    this.loadPosts(0);
    this.loadOverallStats();
  }

  /**
   * Load overall stats from server
   */
  loadOverallStats(): void {
    this.adminService.getPostsForModeration({ page: 0, size: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const all = res.data.content || [];
          this.totalPostsCount.set(res.data.totalElements || all.length);
          this.activePostsCount.set(all.filter((p) => p.isActive).length);
          this.pinnedPostsCount.set(all.filter((p) => p.isPinned).length);
          this.hotPostsCount.set(all.filter((p) => p.isHot).length);

          // Extract unique categories if available
          const uniqueCats = Array.from(new Set(all.map((p) => p.categoryName).filter(Boolean)));
          if (uniqueCats.length > 0) {
            this.categories = Array.from(new Set([...this.categories, ...uniqueCats]));
          }
        }
      },
      error: () => {
        // Fallback or ignore
      }
    });
  }

  /**
   * Load posts with pagination and server search/isActive filters
   */
  loadPosts(page: number = 0): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    let isActiveParam: boolean | undefined = undefined;
    if (this.filterStatus === 'ACTIVE') isActiveParam = true;
    if (this.filterStatus === 'INACTIVE') isActiveParam = false;

    this.adminService
      .getPostsForModeration({
        page,
        size: this.pageSize(),
        sortBy: 'createdAt',
        sortDir: 'desc',
        search: this.searchQuery.trim() || undefined,
        isActive: isActiveParam
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.currentPage.set(res.data.number ?? page);
            this.totalPages.set(res.data.totalPages ?? 0);
            this.totalElements.set(res.data.totalElements ?? 0);
            const content = res.data.content || [];
            this.rawPosts.set(content);
            this.applyClientSideFilters(content);
          } else {
            this.posts.set([]);
            this.rawPosts.set([]);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set(
            err.error?.message || 'Không thể tải danh sách bài viết. Vui lòng thử lại sau.'
          );
        }
      });
  }

  /**
   * Apply additional client-side filters (category, pinned, hot, author role, reported)
   */
  applyClientSideFilters(postsList: PostModeration[]): void {
    let filtered = [...postsList];

    if (this.filterCategory !== 'ALL') {
      filtered = filtered.filter((p) => p.categoryName === this.filterCategory);
    }

    if (this.filterPinned === 'PINNED') {
      filtered = filtered.filter((p) => p.isPinned === true);
    } else if (this.filterPinned === 'UNPINNED') {
      filtered = filtered.filter((p) => !p.isPinned);
    }

    if (this.filterHot === 'HOT') {
      filtered = filtered.filter((p) => p.isHot === true);
    } else if (this.filterHot === 'NOT_HOT') {
      filtered = filtered.filter((p) => !p.isHot);
    }

    if (this.filterAuthorRole !== 'ALL') {
      filtered = filtered.filter(
        (p) => (p.author?.role || '').toUpperCase() === this.filterAuthorRole
      );
    }

    if (this.filterReported === 'REPORTED') {
      filtered = filtered.filter((p) => p.isReported === true || (p.reportCount || 0) > 0);
    } else if (this.filterReported === 'NOT_REPORTED') {
      filtered = filtered.filter((p) => !p.isReported && (p.reportCount || 0) === 0);
    }

    this.posts.set(filtered);
  }

  /**
   * Toggle filter collapse panel
   */
  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  /**
   * Apply button clicked
   */
  applyFilter(): void {
    this.loadPosts(0);
  }

  /**
   * Reset filter parameters
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.filterStatus = 'ALL';
    this.filterCategory = 'ALL';
    this.filterPinned = 'ALL';
    this.filterHot = 'ALL';
    this.filterAuthorRole = 'ALL';
    this.filterReported = 'ALL';
    this.loadPosts(0);
  }

  /**
   * Page change event from custom-data-table
   */
  onPageChange(event: TablePageChangeEvent): void {
    const targetPage = event.page - 1;
    if (this.pageSize() !== event.pageSize) {
      this.pageSize.set(event.pageSize);
    }
    this.loadPosts(targetPage);
  }

  // ─────────────────────────────────────────────────────────────
  // 5 Actions: View Details, Toggle Status, Toggle Pin, Toggle Hot, Delete
  // ─────────────────────────────────────────────────────────────

  /**
   * 1. View Post Details: calls GET /api/admin/posts/{postId}
   */
  viewPostDetails(post: PostModeration, event?: Event): void {
    event?.stopPropagation();

    // Set post & open modal immediately so UI responds instantly on first click
    this.selectedPost.set(post);
    this.isDetailModalOpen.set(true);
    this.isLoadingDetail.set(true);
    this.cdr.markForCheck();

    // Call API to fetch complete post details and update modal
    this.adminService.getPostDetails(post.id).subscribe({
      next: (res) => {
        this.isLoadingDetail.set(false);
        if (res.success && res.data) {
          this.selectedPost.set(res.data);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingDetail.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedPost.set(null);
    this.cdr.markForCheck();
  }

  /**
   * 2. Toggle Status: calls PUT /api/admin/posts/{postId}/status?isActive=...
   */
  togglePostStatus(post: PostModeration, event?: Event): void {
    event?.stopPropagation();
    const newStatus = !post.isActive;
    this.adminService.updatePostStatus(post.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          post.isActive = newStatus;
          this.activePostsCount.update((c) => (newStatus ? c + 1 : Math.max(0, c - 1)));
          this.showToast(
            'success',
            'Thành công',
            newStatus ? 'Bài viết đã được kích hoạt hoạt động' : 'Bài viết đã bị vô hiệu hóa'
          );
        } else {
          this.showToast('error', 'Lỗi', res.message || 'Không thể cập nhật trạng thái bài viết');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToast(
          'error',
          'Lỗi',
          err.error?.message || 'Không thể cập nhật trạng thái bài viết'
        );
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * 3. Toggle Pin: calls PUT /api/admin/posts/{postId}/pin?isPinned=...
   */
  togglePostPin(post: PostModeration, event?: Event): void {
    event?.stopPropagation();
    const newPinStatus = !post.isPinned;
    this.adminService.updatePostPinStatus(post.id, newPinStatus).subscribe({
      next: (res) => {
        if (res.success) {
          post.isPinned = newPinStatus;
          this.pinnedPostsCount.update((c) => (newPinStatus ? c + 1 : Math.max(0, c - 1)));
          this.showToast(
            'success',
            'Thành công',
            newPinStatus ? 'Đã ghim bài viết lên đầu diễn đàn' : 'Đã bỏ ghim bài viết'
          );
        } else {
          this.showToast('error', 'Lỗi', res.message || 'Không thể cập nhật trạng thái ghim');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToast(
          'error',
          'Lỗi',
          err.error?.message || 'Không thể cập nhật trạng thái ghim bài viết'
        );
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * 4. Toggle Hot: calls PUT /api/admin/posts/{postId}/hot?isHot=...
   */
  togglePostHot(post: PostModeration, event?: Event): void {
    event?.stopPropagation();
    const newHotStatus = !post.isHot;
    this.adminService.updatePostHotStatus(post.id, newHotStatus).subscribe({
      next: (res) => {
        if (res.success) {
          post.isHot = newHotStatus;
          this.hotPostsCount.update((c) => (newHotStatus ? c + 1 : Math.max(0, c - 1)));
          this.showToast(
            'success',
            'Thành công',
            newHotStatus ? 'Đã đánh dấu bài viết là nổi bật' : 'Đã bỏ đánh dấu nổi bật bài viết'
          );
        } else {
          this.showToast('error', 'Lỗi', res.message || 'Không thể cập nhật trạng thái nổi bật');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToast(
          'error',
          'Lỗi',
          err.error?.message || 'Không thể cập nhật trạng thái nổi bật bài viết'
        );
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * 5. Delete Post: calls DELETE /api/admin/posts/{postId}
   */
  openDeleteConfirm(post: PostModeration, event?: Event): void {
    event?.stopPropagation();
    this.targetDeletePost.set(post);
    this.showDeleteModal.set(true);
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.targetDeletePost.set(null);
    this.cdr.markForCheck();
  }

  confirmDeletePost(): void {
    const postToDelete = this.targetDeletePost();
    if (!postToDelete) return;

    this.isDeleting.set(true);
    const postId = postToDelete.id;
    this.adminService.deletePost(postId).subscribe({
      next: (res) => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        if (res.success) {
          this.showToast('success', 'Thành công', 'Đã xóa bài viết khỏi hệ thống');
          this.loadPosts(this.currentPage());
          this.loadOverallStats();
        } else {
          this.showToast('error', 'Lỗi', res.message || 'Không thể xóa bài viết');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.showToast('error', 'Lỗi', err.error?.message || 'Không thể xóa bài viết');
        this.cdr.markForCheck();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Helper functions
  // ─────────────────────────────────────────────────────────────

  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  timeAgo(dateStr?: string | Date): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays} days ago`;
      }
      if (diffHours > 0) {
        return `${diffHours} hours ago`;
      }
      if (diffMin > 0) {
        return `${diffMin} mins ago`;
      }
      return 'Just now';
    } catch {
      return String(dateStr);
    }
  }

  showToast(type: 'success' | 'error' | 'warning', title: string, message: string): void {
    this.toastType = type;
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastVisible = true;
  }
}
