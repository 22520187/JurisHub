import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { ForumService, ForumCategoryItem, CategoryLabelItem } from '../../../core/services/forum.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    ToastMessageComponent
  ],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly forumService = inject(ForumService);

  // Form state
  category: string = '';
  title: string = '';
  tagInput: string = '';
  tags: string[] = [];
  content: string = '';

  // Labels state
  rawCategories: ForumCategoryItem[] = [];
  availableLabels: CategoryLabelItem[] = [];
  selectedLabelIds: number[] = [];

  errorMessage: string = '';
  isSubmitting: boolean = false;

  // Toast
  showToast: boolean = false;
  toastType: 'success' | 'error' = 'success';
  toastMessage: string = '';

  // Fallback categories list before API response
  categories: { value: string; label: string; id: number; icon?: string }[] = [
    { value: 'dan-su', label: 'Dân sự', id: 1 },
    { value: 'hinh-su', label: 'Hình sự', id: 2 },
    { value: 'dat-dai', label: 'Đất đai', id: 3 },
    { value: 'hon-nhan-gia-dinh', label: 'Hôn nhân và gia đình', id: 4 },
    { value: 'lao-dong', label: 'Lao động', id: 5 },
    { value: 'kinh-doanh', label: 'Kinh doanh & Doanh nghiệp', id: 6 },
    { value: 'giao-thong', label: 'Giao thông', id: 7 },
    { value: 'khac', label: 'Khác', id: 8 }
  ];

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.forumService.getAllCategories().subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          this.rawCategories = cats;
          this.categories = cats.map(c => ({
            value: c.slug,
            label: c.name,
            id: c.id,
          }));

          // If a category was already selected, populate its labels
          if (this.category) {
            this.updateLabelsForCategory(this.category);
          }
        }
      },
      error: (e) => {
        console.warn('Could not load dynamic categories, using default list:', e);
      }
    });
  }

  onCategoryChange(slug: string): void {
    this.category = slug;
    this.updateLabelsForCategory(slug);
  }

  updateLabelsForCategory(slug: string): void {
    const found = this.rawCategories.find(c => c.slug === slug || String(c.id) === String(slug));
    if (found && found.labels && Array.isArray(found.labels)) {
      this.availableLabels = found.labels.filter(l => l.isActive !== false);
    } else {
      this.availableLabels = [];
    }
    // Reset selected labels when switching category to ensure valid IDs
    this.selectedLabelIds = [];
  }

  toggleLabel(labelId: number): void {
    if (this.selectedLabelIds.includes(labelId)) {
      this.selectedLabelIds = this.selectedLabelIds.filter(id => id !== labelId);
    } else {
      if (this.selectedLabelIds.length >= 5) {
        this.errorMessage = 'Chỉ được chọn tối đa 5 nhãn cho bài viết.';
        return;
      }
      this.errorMessage = '';
      this.selectedLabelIds.push(labelId);
    }
  }

  isLabelSelected(labelId: number): boolean {
    return this.selectedLabelIds.includes(labelId);
  }

  clearSelectedLabels(): void {
    this.selectedLabelIds = [];
  }

  addTag(): void {
    const rawTag = this.tagInput.trim().replace(/^#/, '');
    if (rawTag && this.tags.length < 5 && !this.tags.includes(rawTag)) {
      this.tags.push(rawTag);
      this.tagInput = '';
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  applyFormat(formatType: string): void {
    const textarea = document.getElementById('create-topic-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    let replacement = '';

    switch (formatType) {
      case 'bold':
        replacement = `**${selected || 'Văn bản in đậm'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'Văn bản in nghiêng'}*`;
        break;
      case 'heading':
        replacement = `\n## ${selected || 'Tiêu đề'}\n`;
        break;
      case 'ul':
        replacement = `\n- ${selected || 'Mục danh sách'}\n`;
        break;
      case 'ol':
        replacement = `\n1. ${selected || 'Mục số'}\n`;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'Đoạn trích dẫn'}\n`;
        break;
      case 'link':
        replacement = `[${selected || 'Tên liên kết'}](https://)`;
        break;
      default:
        break;
    }

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    this.content = before + replacement + after;

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  }

  submitPost(): void {
    this.errorMessage = '';

    if (!this.category) {
      this.errorMessage = 'Vui lòng chọn chuyên mục cho bài viết.';
      return;
    }

    if (!this.title || this.title.trim().length < 10) {
      this.errorMessage = 'Tiêu đề phải có tối thiểu 10 ký tự.';
      return;
    }

    if (!this.content || this.content.trim().length < 30) {
      this.errorMessage = 'Nội dung bài viết phải có tối thiểu 30 ký tự.';
      return;
    }

    this.isSubmitting = true;

    const catObj = this.categories.find(c => c.value === this.category);
    const categoryName = catObj ? catObj.label : 'Thảo luận chung';
    const categoryId = catObj?.id ?? this.forumService.resolveCategoryId(this.category);

    this.forumService.createPost({
      title: this.title.trim(),
      content: this.content.trim(),
      categoryId: categoryId,
      labelIds: this.selectedLabelIds.length > 0 ? this.selectedLabelIds : undefined,
      category: categoryName,
      categorySlug: this.category,
      tags: [...this.tags]
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastType = 'success';
        this.toastMessage = 'Đăng bài viết thành công!';
        this.showToast = true;

        setTimeout(() => {
          this.router.navigate(['/post']);
        }, 800);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Lỗi khi đăng bài viết:', err);
        this.errorMessage = err?.error?.message || 'Có lỗi xảy ra khi đăng bài viết. Vui lòng thử lại!';
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/forum']);
    }
  }
}
