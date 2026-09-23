import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  ButtonComponent,
  BadgeComponent,
  SelectDropdownComponent,
  SelectOption,
  ModalCustomComponent,
  ScrollToTopComponent
} from '../../shared/components';
import { AuthService } from '../../core/services/auth.service';

export interface ForumPost {
  id: string;
  title: string;
  category: string;
  author: string;
  createdAt: string;
  repliesCount: number;
  viewsCount: number;
  isPinned?: boolean;
  isHot?: boolean;
  hasLawyerAnswer?: boolean;
  tags?: string[];
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  topicsCount: number;
  postsCount: number;
  icon?: string;
}

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    BadgeComponent,
    SelectDropdownComponent,
    ModalCustomComponent,
    ScrollToTopComponent
  ],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss'
})
export class ForumComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Search
  searchKeyword: string = '';

  // Filter selections
  selectedCategory: string = 'all';
  selectedSort: string = 'newest';
  selectedTime: string = 'all';
  selectedLimit: number = 5;

  // Quick filters
  isPinnedActive: boolean = false;
  isHotActive: boolean = false;
  isLawyerAnsweredActive: boolean = false;

  // Dropdown options
  readonly categoryOptions: SelectOption[] = [
    { label: 'Tất cả danh mục', value: 'all' },
    { label: 'Luật Dân sự', value: 'civil' },
    { label: 'Luật Hình sự', value: 'criminal' },
    { label: 'Luật Đất đai', value: 'land' },
    { label: 'Luật Doanh nghiệp', value: 'corporate' },
    { label: 'Luật Lao động', value: 'labor' },
    { label: 'Hôn nhân & Gia đình', value: 'marriage' }
  ];

  readonly sortOptions: SelectOption[] = [
    { label: 'Mới nhất', value: 'newest' },
    { label: 'Xem nhiều nhất', value: 'views' },
    { label: 'Trả lời nhiều nhất', value: 'replies' }
  ];

  readonly timeOptions: SelectOption[] = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Hôm nay', value: 'today' },
    { label: 'Tuần này', value: 'week' },
    { label: 'Tháng này', value: 'month' }
  ];

  readonly limitOptions: SelectOption[] = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 }
  ];

  // Post & Category Lists
  posts: ForumPost[] = [];
  categories: ForumCategory[] = [];

  // Pagination & counts
  currentPage: number = 1;
  totalPages: number = 1;
  totalResults: number = 0;
  onlineUsersCount: number = 0;

  // Stats banner
  readonly forumStats = {
    members: '1,245',
    topics: '5,678',
    posts: '23,456',
    online: '156'
  };

  // Create Topic Modal State
  isCreateModalOpen: boolean = false;
  newTopic = {
    category: '',
    title: '',
    tagInput: '',
    tags: [] as string[],
    content: ''
  };
  createModalError: string = '';

  // Quick filter toggle
  toggleQuickFilter(filter: 'pinned' | 'hot' | 'lawyer'): void {
    if (filter === 'pinned') this.isPinnedActive = !this.isPinnedActive;
    if (filter === 'hot') this.isHotActive = !this.isHotActive;
    if (filter === 'lawyer') this.isLawyerAnsweredActive = !this.isLawyerAnsweredActive;
  }

  // Create Modal Actions
  openCreateModal(): void {
    this.newTopic = {
      category: '',
      title: '',
      tagInput: '',
      tags: [],
      content: ''
    };
    this.createModalError = '';
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  addTag(): void {
    const rawTag = this.newTopic.tagInput.trim().replace(/^#/, '');
    if (rawTag && this.newTopic.tags.length < 5 && !this.newTopic.tags.includes(rawTag)) {
      this.newTopic.tags.push(rawTag);
      this.newTopic.tagInput = '';
    }
  }

  removeTag(tag: string): void {
    this.newTopic.tags = this.newTopic.tags.filter(t => t !== tag);
  }

  applyFormat(formatType: string): void {
    const textarea = document.getElementById('new-topic-textarea') as HTMLTextAreaElement | null;
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
    this.newTopic.content = before + replacement + after;

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  }

  submitTopic(): void {
    if (!this.newTopic.category) {
      this.createModalError = 'Vui lòng chọn chuyên mục cho bài viết.';
      return;
    }
    if (!this.newTopic.title || this.newTopic.title.trim().length < 10) {
      this.createModalError = 'Tiêu đề phải có tối thiểu 10 ký tự.';
      return;
    }
    if (!this.newTopic.content || this.newTopic.content.trim().length < 30) {
      this.createModalError = 'Nội dung bài viết phải có tối thiểu 30 ký tự.';
      return;
    }

    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
      title: this.newTopic.title.trim(),
      category: this.getCategoryLabel(this.newTopic.category),
      author: this.authService.currentUser()?.name || 'Thành viên mới',
      createdAt: 'Vừa xong',
      repliesCount: 0,
      viewsCount: 1,
      tags: [...this.newTopic.tags]
    };

    this.posts.unshift(newPost);
    this.totalResults = this.posts.length;
    this.closeCreateModal();
    alert('Đăng bài thành công!');
  }

  private getCategoryLabel(val: string): string {
    const found = this.categoryOptions.find(c => c.value === val);
    return found ? found.label : 'Thảo luận chung';
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
