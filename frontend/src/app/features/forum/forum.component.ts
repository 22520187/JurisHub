import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
import {
  ForumService,
  PopularTopicItem,
  CategoryStatItem,
  PopularTagItem,
  ForumCategoryItem,
  ForumStatsData
} from '../../core/services/forum.service';

export interface ForumPost {
  id: string | number;
  title: string;
  slug?: string;
  category: any;
  categorySlug?: string;
  author: any;
  createdAt: string;
  repliesCount: number;
  replyCount?: number;
  viewsCount: number;
  view?: number;
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
    ScrollToTopComponent
  ],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss'
})
export class ForumComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly forumService = inject(ForumService);
  private readonly cdr = inject(ChangeDetectorRef);

  popularTopics: PopularTopicItem[] = [];
  categoryStats: CategoryStatItem[] = [];
  popularTags: PopularTagItem[] = [];
  categoriesList: ForumCategoryItem[] = [];
  statsData: ForumStatsData = {
    totalTopics: 10,
    totalPosts: 25,
    totalMembers: 13,
    topicsToday: 0,
    postsToday: 0,
    membersToday: 0
  };
  onlineUsersCount: number = 0;

  ngOnInit(): void {
    this.loadPosts();
    this.loadPopularTopics();
    this.loadCategoryStats();
    this.loadPopularTags();
    this.loadCategories();
    this.loadForumStats();
    this.loadOnlineUsers();
  }

  loadPopularTopics(): void {
    this.forumService.getPopularTopics(5).subscribe({
      next: (data) => {
        this.popularTopics = data;
        this.cdr.markForCheck();
      }
    });
  }

  loadCategoryStats(): void {
    this.forumService.getCategoryStats().subscribe({
      next: (data) => {
        this.categoryStats = data;
        this.cdr.markForCheck();
      }
    });
  }

  loadPopularTags(): void {
    this.forumService.getPopularTags(10).subscribe({
      next: (data) => {
        this.popularTags = data;
        this.cdr.markForCheck();
      }
    });
  }

  loadCategories(): void {
    this.forumService.getAllCategories().subscribe({
      next: (data) => {
        this.categoriesList = data;
        this.cdr.markForCheck();
      }
    });
  }

  loadForumStats(): void {
    this.forumService.getForumStats().subscribe({
      next: (data) => {
        this.statsData = data;
        this.cdr.markForCheck();
      }
    });
  }

  loadOnlineUsers(): void {
    this.forumService.getOnlineUsers().subscribe({
      next: (res) => {
        this.onlineUsersCount = res.totalOnline || 0;
        this.cdr.markForCheck();
      }
    });
  }

  loadPosts(): void {
    const page = this.currentPage - 1;
    const size = this.selectedLimit;
    const sort = this.mapSortParam(this.selectedSort);
    const keyword = this.searchKeyword?.trim() || '';
    const hasCategory = this.selectedCategory && this.selectedCategory !== 'all';

    let request$;

    if (keyword && hasCategory) {
      request$ = this.forumService.searchPostsByCategory(keyword, this.selectedCategory, page, size, sort);
    } else if (keyword) {
      request$ = this.forumService.searchPosts(keyword, page, size, sort);
    } else if (hasCategory) {
      request$ = this.forumService.getPostsByCategory(this.selectedCategory, page, size, sort);
    } else {
      const catId = this.getCategoryId(this.selectedCategory);
      request$ = this.forumService.getAllPosts(page, size, catId, this.selectedTime, sort);
    }

    request$.subscribe({
      next: (res) => {
        this.posts = res.posts as unknown as ForumPost[];
        this.totalResults = res.totalElements;
        this.totalPages = res.totalPages;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách bài viết:', err);
        this.posts = [];
        this.totalResults = 0;
        this.totalPages = 1;
        this.cdr.markForCheck();
      }
    });
  }

  private mapSortParam(sortValue: string): string {
    switch (sortValue) {
      case 'views':
        return 'views,desc';
      case 'replies':
        return 'replyCount,desc';
      case 'newest':
      default:
        return 'createdAt,desc';
    }
  }

  getCategoryId(categorySlug: string): number | undefined {
    if (!categorySlug || categorySlug === 'all') return undefined;
    return this.forumService.resolveCategoryId(categorySlug);
  }

  navigateToPost(post: ForumPost): void {
    const categorySlug = this.getCategorySlug(post);
    const postSlug = post.slug || post.id;
    this.router.navigate(['/forum/categories', categorySlug, 'posts', postSlug]);
  }

  getCategoryName(cat: any): string {
    if (!cat) return 'Chung';
    if (typeof cat === 'object') return cat.name || 'Chung';
    return String(cat);
  }

  getAuthorName(author: any): string {
    if (!author) return 'Thành viên';
    if (typeof author === 'object') return author.name || 'Thành viên';
    return String(author);
  }

  getCategorySlug(post: ForumPost): string {
    if (post.categorySlug) return post.categorySlug;
    const cat = post.category as any;
    if (cat && typeof cat === 'object' && cat.slug) {
      return cat.slug;
    }
    return 'kinh-doanh';
  }

  selectCategoryBySlug(slug: string): void {
    this.selectedCategory = slug;
    this.loadPosts();
  }

  filterByTag(tag: string): void {
    this.searchKeyword = tag;
    this.loadPosts();
  }

  formatRelativeTime(dateStr?: string): string {
    return this.forumService.formatRelativeTime(dateStr);
  }

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

  // Create Modal Actions (now routes to dedicated create-post page)
  openCreateModal(): void {
    this.router.navigate(['/forum/create']);
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
