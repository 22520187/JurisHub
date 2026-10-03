import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ToastMessageComponent } from '../../../shared/components/toast-message/toast-message.component';
import { ForumService } from '../../../core/services/forum.service';

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
export class CreatePostComponent {
  private readonly router = inject(Router);
  private readonly forumService = inject(ForumService);

  // Form state
  category: string = '';
  title: string = '';
  tagInput: string = '';
  tags: string[] = [];
  content: string = '';

  errorMessage: string = '';
  isSubmitting: boolean = false;

  // Toast
  showToast: boolean = false;
  toastType: 'success' | 'error' = 'success';
  toastMessage: string = '';

  readonly categories = [
    { value: 'civil', label: 'Luật Dân sự' },
    { value: 'criminal', label: 'Luật Hình sự' },
    { value: 'land', label: 'Luật Đất đai' },
    { value: 'corporate', label: 'Luật Doanh nghiệp' },
    { value: 'labor', label: 'Luật Lao động' },
    { value: 'marriage', label: 'Hôn nhân & Gia đình' }
  ];

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

    this.forumService.createPost({
      title: this.title.trim(),
      content: this.content.trim(),
      category: categoryName,
      categorySlug: this.category,
      tags: [...this.tags]
    });

    this.toastType = 'success';
    this.toastMessage = 'Đăng bài viết thành công!';
    this.showToast = true;

    setTimeout(() => {
      this.router.navigate(['/post']);
    }, 800);
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/forum']);
    }
  }
}
