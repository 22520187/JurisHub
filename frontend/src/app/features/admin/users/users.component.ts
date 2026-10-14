import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserManagement } from '../../../core/services/admin.service';
import {
  ButtonComponent,
  ConfirmPopupComponent,
  ToastMessageComponent,
  CustomDataTableComponent,
  TableColumn,
  TablePagination,
  TablePageChangeEvent,
  TableStyles
} from '../../../shared/components';

interface RoleOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ConfirmPopupComponent,
    ToastMessageComponent,
    CustomDataTableComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  // Table Configuration for tellerapp-custom-data-table
  readonly tableColumns: TableColumn<UserManagement>[] = [
    { key: 'user', label: 'Người dùng', minWidth: 260, align: 'left' },
    { key: 'role', label: 'Vai trò', minWidth: 150, align: 'left' },
    { key: 'isEnabled', label: 'Trạng thái', minWidth: 130, align: 'center' },
    { key: 'createdAt', label: 'Ngày tham gia', minWidth: 130, align: 'center' },
    { key: 'actions', label: 'Thao tác', minWidth: 80, align: 'center' }
  ];

  readonly tablePagination = computed<TablePagination>(() => ({
    page: this.currentPage() + 1,
    pageSize: this.pageSize(),
    total: this.totalElements(),
    pageSizeOptions: []
  }));

  readonly tableStyles: TableStyles = {
    headerBg: '#fafbfc',
    headerColor: '#64748b',
    rowHoverBg: '#f8fafc',
    borderColor: '#f1f5f9',
    fontSize: '0.875rem'
  };

  // Data state
  users = signal<UserManagement[]>([]);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Top metric counters
  totalUsersCount = signal<number>(0);
  activeUsersCount = signal<number>(0);
  lawyersCount = signal<number>(0);
  disabledUsersCount = signal<number>(0);

  // Filters
  searchQuery = '';
  selectedRole = 'ALL';
  isFilterDropdownOpen = false;
  isRoleMenuOpen = false;

  readonly roleOptions: RoleOption[] = [
    { label: 'Tất cả vai trò', value: 'ALL' },
    { label: 'Người dùng', value: 'USER' },
    { label: 'Luật sư', value: 'LAWYER' },
    { label: 'Admin', value: 'ADMIN' }
  ];

  // Actions menu & status update
  activeActionUserId: number | null = null;
  showStatusModal = false;
  targetUser: UserManagement | null = null;
  targetNewStatus = false;
  isUpdatingStatus = false;

  // Toast
  toastVisible = false;
  toastType: 'success' | 'error' | 'warning' = 'success';
  toastTitle = '';
  toastMessage = '';

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers(0);
  }

  loadStats(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        if (res && res.data) {
          const d = res.data;
          this.totalUsersCount.set(d.totalUsers || 0);
          this.activeUsersCount.set(d.activeUsers || 0);
          this.lawyersCount.set(d.totalLawyers || 0);

          let disabled = 0;
          if (d.totalUsers && d.activeUsers !== undefined) {
            disabled = Math.max(0, d.totalUsers - d.activeUsers);
          }
          this.disabledUsersCount.set(disabled);
        }
      },
      error: () => {
        // Ignored, stat cards will update from users list if needed
      }
    });
  }

  loadUsers(page: number = 0): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');
    this.activeActionUserId = null;

    this.adminService.getAllUsers({
      page,
      size: this.pageSize(),
      search: this.searchQuery,
      role: this.selectedRole !== 'ALL' ? this.selectedRole : undefined
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.data) {
          const pageData = res.data;
          this.users.set(pageData.content || []);
          this.totalElements.set(pageData.totalElements || 0);
          this.totalPages.set(pageData.totalPages || 0);
          this.currentPage.set(pageData.number || 0);

          // Update metrics if initial total was 0
          if (this.totalUsersCount() === 0) {
            this.totalUsersCount.set(pageData.totalElements || 0);
          }
        } else {
          this.users.set([]);
          this.totalElements.set(0);
          this.totalPages.set(0);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.hasError.set(true);
        this.errorMessage.set(err?.error?.message || 'Không thể tải danh sách người dùng.');
        this.users.set([]);
      }
    });
  }

  applyFilter(): void {
    this.isFilterDropdownOpen = false;
    this.isRoleMenuOpen = false;
    this.loadUsers(0);
  }

  toggleFilterDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isFilterDropdownOpen = !this.isFilterDropdownOpen;
    if (!this.isFilterDropdownOpen) {
      this.isRoleMenuOpen = false;
    }
  }

  toggleRoleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isRoleMenuOpen = !this.isRoleMenuOpen;
  }

  selectRole(roleValue: string): void {
    this.selectedRole = roleValue;
    this.isRoleMenuOpen = false;
    this.applyFilter();
  }

  getRoleLabel(roleValue: string): string {
    const found = this.roleOptions.find(r => r.value === roleValue);
    return found ? found.label : 'Tất cả vai trò';
  }

  toggleActionMenu(userId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeActionUserId = this.activeActionUserId === userId ? null : userId;
  }

  openStatusConfirm(user: UserManagement, newStatus: boolean): void {
    this.activeActionUserId = null;
    this.targetUser = user;
    this.targetNewStatus = newStatus;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.targetUser = null;
  }

  confirmUpdateStatus(): void {
    if (!this.targetUser) return;

    const user = this.targetUser;
    const isEnabled = this.targetNewStatus;
    this.isUpdatingStatus = true;
    this.showStatusModal = false;

    this.adminService.updateUserStatus(user.id, isEnabled).subscribe({
      next: () => {
        this.isUpdatingStatus = false;
        this.showToast(
          'Thành công',
          `Đã ${isEnabled ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản ${user.fullName || user.email}`,
          'success'
        );
        // Update user state locally
        const currentUsers = this.users().map(u => {
          if (u.id === user.id) {
            return { ...u, isEnabled: isEnabled };
          }
          return u;
        });
        this.users.set(currentUsers);
        this.loadStats();
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        this.showToast(
          'Lỗi',
          err?.error?.message || 'Không thể cập nhật trạng thái người dùng.',
          'error'
        );
      }
    });
  }

  showToast(title: string, message: string, type: 'success' | 'error' | 'warning'): void {
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
  }

  // Pagination helpers
  get pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage() + 1;
    if (total <= 1) return [1];

    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get paginationInfo(): { start: number; end: number } {
    const total = this.totalElements();
    if (total === 0) return { start: 0, end: 0 };
    const start = this.currentPage() * this.pageSize() + 1;
    const end = Math.min((this.currentPage() + 1) * this.pageSize(), total);
    return { start, end };
  }

  onPageChange(event: TablePageChangeEvent): void {
    this.loadUsers(event.page - 1);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages() && page !== this.currentPage()) {
      this.loadUsers(page);
    }
  }

  getUserInitials(nameOrEmail?: string): string {
    if (!nameOrEmail) return 'U';
    const clean = nameOrEmail.trim();
    if (clean.includes('@')) {
      return clean.substring(0, 2).toUpperCase();
    }
    const parts = clean.split(/\s+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.activeActionUserId = null;
    this.isFilterDropdownOpen = false;
    this.isRoleMenuOpen = false;
  }
}
