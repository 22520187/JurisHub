import { Component, OnInit, inject, signal, computed, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, PostCategory, PostLabel } from '../../../core/services/admin.service';
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
  selector: 'app-admin-categories',
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
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Table Configuration for tellerapp-custom-data-table
  readonly tableColumns: TableColumn<PostCategory>[] = [
    { key: 'name', label: 'Tên danh mục', minWidth: 160, align: 'left' },
    { key: 'slug', label: 'Slug', width: '150px', align: 'left' },
    { key: 'description', label: 'Mô tả', minWidth: 280, align: 'left' },
    { key: 'postCount', label: 'Số bài viết', width: '110px', align: 'center' },
    { key: 'actions', label: 'Thao tác', width: '90px', align: 'center' }
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
  categories = signal<PostCategory[]>([]);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Search
  searchQuery = '';

  // Action Menu dropdown state
  activeActionCategoryId: number | null = null;

  // Create Modal State
  isCreateModalOpen = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  createForm = {
    name: '',
    description: ''
  };

  // Edit Modal State
  isEditModalOpen = signal<boolean>(false);
  isUpdating = signal<boolean>(false);
  editForm = {
    id: 0,
    name: '',
    slug: '',
    description: ''
  };
  activeCategoryLabels = signal<PostLabel[]>([]);

  // Create Label Modal State
  isCreateLabelModalOpen = signal<boolean>(false);
  isCreatingLabel = signal<boolean>(false);
  createLabelForm = {
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6'
  };

  // Edit Label Modal State
  isEditLabelModalOpen = signal<boolean>(false);
  isUpdatingLabel = signal<boolean>(false);
  editLabelForm = {
    id: 0,
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6'
  };

  // Delete Modal State
  showDeleteModal = signal<boolean>(false);
  targetDeleteCategory = signal<PostCategory | null>(null);
  isDeleting = signal<boolean>(false);

  // Toast state
  toastVisible = false;
  toastType: 'success' | 'error' | 'warning' = 'success';
  toastTitle = '';
  toastMessage = '';

  ngOnInit(): void {
    this.loadCategories(0);
  }

  /**
   * Load categories from API
   */
  loadCategories(page: number = 0): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.adminService
      .getAllCategories({
        page,
        size: this.pageSize(),
        sortBy: 'displayOrder',
        sortDir: 'asc',
        search: this.searchQuery.trim() || undefined
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.currentPage.set(res.data.number ?? page);
            this.totalPages.set(res.data.totalPages ?? 0);
            this.totalElements.set(res.data.totalElements ?? 0);
            this.categories.set(res.data.content || []);
          } else {
            this.categories.set([]);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set(
            err.error?.message || 'Không thể tải danh sách danh mục. Vui lòng thử lại sau.'
          );
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Search input enter / filter
   */
  onSearch(): void {
    this.loadCategories(0);
  }

  /**
   * Refresh categories
   */
  refresh(): void {
    this.searchQuery = '';
    this.loadCategories(0);
  }

  /**
   * Table pagination change
   */
  onPageChange(event: TablePageChangeEvent): void {
    const targetPage = event.page - 1;
    if (this.pageSize() !== event.pageSize) {
      this.pageSize.set(event.pageSize);
    }
    this.loadCategories(targetPage);
  }

  /**
   * Toggle action menu (...)
   */
  toggleActionMenu(categoryId: number, event: Event): void {
    event.stopPropagation();
    if (this.activeActionCategoryId === categoryId) {
      this.activeActionCategoryId = null;
    } else {
      this.activeActionCategoryId = categoryId;
    }
    this.cdr.markForCheck();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.activeActionCategoryId !== null) {
      this.activeActionCategoryId = null;
      this.cdr.markForCheck();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Create Category
  // ─────────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.createForm = {
      name: '',
      description: ''
    };
    this.isCreateModalOpen.set(true);
    this.cdr.markForCheck();
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.cdr.markForCheck();
  }

  submitCreateCategory(): void {
    if (!this.createForm.name.trim()) {
      this.showToast('warning', 'Thông báo', 'Vui lòng nhập tên danh mục');
      return;
    }

    this.isCreating.set(true);
    const slug = this.slugify(this.createForm.name);

    this.adminService
      .createCategory({
        name: this.createForm.name.trim(),
        slug,
        description: this.createForm.description.trim() || undefined,
        isActive: true
      })
      .subscribe({
        next: (res) => {
          this.isCreating.set(false);
          if (res.success) {
            this.showToast('success', 'Thành công', 'Đã tạo danh mục mới thành công');
            this.closeCreateModal();
            this.loadCategories(this.currentPage());
          } else {
            this.showToast('error', 'Lỗi', res.message || 'Không thể tạo danh mục');
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isCreating.set(false);
          this.showToast('error', 'Lỗi', err.error?.message || 'Không thể tạo danh mục');
          this.cdr.markForCheck();
        }
      });
  }

  // ─────────────────────────────────────────────────────────────
  // Edit Category & Labels
  // ─────────────────────────────────────────────────────────────

  openEditModal(category: PostCategory, event?: Event): void {
    event?.stopPropagation();
    this.activeActionCategoryId = null;

    this.editForm = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    };
    this.activeCategoryLabels.set(category.labels || []);
    this.isEditModalOpen.set(true);
    this.cdr.markForCheck();

    // Fetch labels for this category
    this.adminService.getLabelsByCategory(category.id).subscribe({
      next: (labels) => {
        if (labels) {
          this.activeCategoryLabels.set(labels);
          this.cdr.markForCheck();
        }
      },
      error: () => {
        // Keep initial labels
      }
    });
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.cdr.markForCheck();
  }

  onEditNameChange(): void {
    // If slug is empty, auto generate slug
    if (!this.editForm.slug) {
      this.editForm.slug = this.slugify(this.editForm.name);
    }
  }

  submitUpdateCategory(): void {
    if (!this.editForm.name.trim()) {
      this.showToast('warning', 'Thông báo', 'Tên danh mục không được để trống');
      return;
    }
    if (!this.editForm.slug.trim()) {
      this.editForm.slug = this.slugify(this.editForm.name);
    }

    this.isUpdating.set(true);
    this.adminService
      .updateCategory(this.editForm.id, {
        name: this.editForm.name.trim(),
        slug: this.editForm.slug.trim(),
        description: this.editForm.description.trim() || undefined,
        isActive: true
      })
      .subscribe({
        next: (res) => {
          this.isUpdating.set(false);
          if (res.success) {
            this.showToast('success', 'Thành công', 'Đã cập nhật danh mục thành công');
            this.closeEditModal();
            this.loadCategories(this.currentPage());
          } else {
            this.showToast('error', 'Lỗi', res.message || 'Không thể cập nhật danh mục');
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isUpdating.set(false);
          this.showToast('error', 'Lỗi', err.error?.message || 'Không thể cập nhật danh mục');
          this.cdr.markForCheck();
        }
      });
  }

  // ─────────────────────────────────────────────────────────────
  // Label Modal Management (Hình 1, 2, 3)
  // ─────────────────────────────────────────────────────────────

  openCreateLabelModal(): void {
    this.createLabelForm = {
      name: '',
      slug: '',
      description: '',
      color: '#3B82F6'
    };
    this.isCreateLabelModalOpen.set(true);
    this.cdr.markForCheck();
  }

  closeCreateLabelModal(): void {
    this.isCreateLabelModalOpen.set(false);
    this.cdr.markForCheck();
  }

  onCreateLabelNameChange(): void {
    this.createLabelForm.slug = this.slugify(this.createLabelForm.name);
  }

  submitCreateLabel(): void {
    if (!this.createLabelForm.name.trim()) {
      this.showToast('warning', 'Thông báo', 'Vui lòng nhập tên nhãn');
      return;
    }

    const slug = this.createLabelForm.slug.trim() || this.slugify(this.createLabelForm.name);
    this.isCreatingLabel.set(true);

    this.adminService
      .createLabel({
        name: this.createLabelForm.name.trim(),
        slug,
        description: this.createLabelForm.description.trim() || undefined,
        color: this.createLabelForm.color || '#3B82F6',
        categoryId: this.editForm.id,
        isActive: true
      })
      .subscribe({
        next: (savedLabel) => {
          this.isCreatingLabel.set(false);
          this.activeCategoryLabels.update((list) => [...list, savedLabel]);
          this.closeCreateLabelModal();
          this.showToast('success', 'Thành công', 'Đã thêm nhãn mới thành công');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isCreatingLabel.set(false);
          this.showToast('error', 'Lỗi', err.error?.message || 'Không thể tạo nhãn');
          this.cdr.markForCheck();
        }
      });
  }

  openEditLabelModal(label: PostLabel): void {
    this.editLabelForm = {
      id: label.id || 0,
      name: label.name,
      slug: label.slug,
      description: label.description || '',
      color: label.color || '#3B82F6'
    };
    this.isEditLabelModalOpen.set(true);
    this.cdr.markForCheck();
  }

  closeEditLabelModal(): void {
    this.isEditLabelModalOpen.set(false);
    this.cdr.markForCheck();
  }

  onEditLabelNameChange(): void {
    if (!this.editLabelForm.slug) {
      this.editLabelForm.slug = this.slugify(this.editLabelForm.name);
    }
  }

  submitEditLabel(): void {
    if (!this.editLabelForm.name.trim()) {
      this.showToast('warning', 'Thông báo', 'Tên nhãn không được để trống');
      return;
    }

    const slug = this.editLabelForm.slug.trim() || this.slugify(this.editLabelForm.name);
    this.isUpdatingLabel.set(true);

    this.adminService
      .updateLabel(this.editLabelForm.id, {
        name: this.editLabelForm.name.trim(),
        slug,
        description: this.editLabelForm.description.trim() || undefined,
        color: this.editLabelForm.color || '#3B82F6',
        categoryId: this.editForm.id,
        isActive: true
      })
      .subscribe({
        next: (updatedLabel) => {
          this.isUpdatingLabel.set(false);
          this.activeCategoryLabels.update((list) =>
            list.map((l) => (l.id === this.editLabelForm.id ? updatedLabel : l))
          );
          this.closeEditLabelModal();
          this.showToast('success', 'Thành công', 'Đã cập nhật nhãn thành công');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isUpdatingLabel.set(false);
          this.showToast('error', 'Lỗi', err.error?.message || 'Không thể cập nhật nhãn');
          this.cdr.markForCheck();
        }
      });
  }

  getLabelBgColor(color?: string): string {
    if (!color) return '#eff6ff';
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map((c) => c + c).join('');
      }
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          return `rgba(${r}, ${g}, ${b}, 0.12)`;
        }
      }
    }
    return '#eff6ff';
  }

  getLabelTextColor(color?: string): string {
    return color && color.startsWith('#') ? color : '#3B82F6';
  }

  deleteLabel(labelId: number): void {
    this.adminService.deleteLabel(labelId).subscribe({
      next: () => {
        this.activeCategoryLabels.update((list) => list.filter((l) => l.id !== labelId));
        this.showToast('success', 'Thành công', 'Đã xóa nhãn thành công');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToast('error', 'Lỗi', err.error?.message || 'Không thể xóa nhãn');
        this.cdr.markForCheck();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Delete Category
  // ─────────────────────────────────────────────────────────────

  openDeleteConfirm(category: PostCategory, event?: Event): void {
    event?.stopPropagation();
    this.activeActionCategoryId = null;
    this.targetDeleteCategory.set(category);
    this.showDeleteModal.set(true);
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.targetDeleteCategory.set(null);
    this.cdr.markForCheck();
  }

  confirmDeleteCategory(): void {
    const cat = this.targetDeleteCategory();
    if (!cat) return;

    this.isDeleting.set(true);
    this.adminService.deleteCategory(cat.id).subscribe({
      next: (res) => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        if (res.success) {
          this.showToast('success', 'Thành công', 'Đã xóa danh mục thành công');
          this.loadCategories(this.currentPage());
        } else {
          this.showToast('error', 'Lỗi', res.message || 'Không thể xóa danh mục');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.showToast('error', 'Lỗi', err.error?.message || 'Không thể xóa danh mục');
        this.cdr.markForCheck();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  slugify(text: string): string {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  showToast(type: 'success' | 'error' | 'warning', title: string, message: string): void {
    this.toastType = type;
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastVisible = true;
  }
}
