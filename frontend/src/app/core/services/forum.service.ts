import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface PostAuthor {
  id: number | string;
  name: string;
  email?: string;
  role: 'USER' | 'ADMIN' | 'LAWYER' | string;
  avatar?: string;
}

export interface PostReplyItem {
  id: number | string;
  content: string;
  postId: number | string;
  author: PostAuthor;
  parentId?: number | string | null;
  children?: PostReplyItem[];
  upvoteCount?: number;
  downvoteCount?: number;
  userVote?: 'UPVOTE' | 'DOWNVOTE' | string | null;
  isActive?: boolean;
  isSolution?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PostDetailItem {
  id: number | string;
  title: string;
  slug?: string;
  content: string;
  category?: any;
  author: PostAuthor;
  view?: number;
  views?: number;
  replyCount?: number;
  upvoteCount?: number;
  downvoteCount?: number;
  userVote?: string | null;
  pinned?: boolean;
  solved?: boolean;
  isHot?: boolean;
  tags?: string[];
  labels?: any[];
  createdAt: string;
  updatedAt?: string;
  replies?: PostReplyItem[];
}

export interface ForumPostItem {
  id: string | number;
  title: string;
  slug?: string;
  category: string;
  categorySlug?: string;
  author: string;
  authorId?: string | number;
  createdAt: string;
  repliesCount: number;
  viewsCount: number;
  isPinned?: boolean;
  isHot?: boolean;
  hasLawyerAnswer?: boolean;
  tags?: string[];
  content?: string;
}

export interface PopularTopicItem {
  id: number;
  title: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  views: number;
  replyCount: number;
  badge?: string;
}

export interface CategoryStatItem {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  topicCount: number;
  totalPostCount?: number;
  topicsToday?: number;
}

export interface PopularTagItem {
  tag: string;
  count: number;
}

export interface ForumCategoryItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  threadCount?: number;
  postCount?: number;
  labels?: any[];
  lastPost?: {
    id: number;
    title: string;
    slug: string;
    authorName?: string;
    authorRole?: string;
    authorAvatar?: string;
    views?: number;
    createdAt?: string;
  };
}

export interface ForumStatsData {
  totalTopics: number;
  totalPosts: number;
  totalMembers: number;
  topicsToday: number;
  postsToday: number;
  membersToday: number;
}

export interface OnlineUsersData {
  users?: any[];
  lawyers?: any[];
  totalOnline?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;
  private readonly STORAGE_KEY = 'jurishub_forum_posts';
  private readonly SAVED_STORAGE_KEY = 'jurishub_saved_posts';

  private postsSignal = signal<ForumPostItem[]>([]);
  private savedPostIdsSignal = signal<string[]>(this.loadStoredSavedIds());

  readonly posts = this.postsSignal.asReadonly();
  readonly savedPostIds = this.savedPostIdsSignal.asReadonly();

  constructor() {
    this.getAllPosts().subscribe();
  }

  private loadStoredPosts(): ForumPostItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading forum posts from storage:', e);
    }
    return [
      {
        id: 'post-1',
        title: 'Thủ tục sang tên sổ đỏ thừa kế từ cha mẹ theo Luật Đất đai mới nhất',
        category: 'Luật Đất đai',
        categorySlug: 'land',
        author: 'Nguyễn Văn Hùng',
        authorId: 99,
        createdAt: '2 giờ trước',
        repliesCount: 8,
        viewsCount: 142,
        isHot: true,
        tags: ['so-do', 'thua-ke', 'dat-dai']
      },
      {
        id: 'post-2',
        title: 'Quy trình giải quyết tranh chấp hợp đồng thương mại có yếu tố nước ngoài',
        category: 'Luật Doanh nghiệp',
        categorySlug: 'corporate',
        author: 'Luật sư Trần Đức Minh',
        authorId: 88,
        createdAt: '5 giờ trước',
        repliesCount: 14,
        viewsCount: 320,
        isPinned: true,
        hasLawyerAnswer: true,
        tags: ['doanh-nghiep', 'hop-dong', 'quoc-te']
      },
      {
        id: 'post-3',
        title: 'Thời gian thử việc và quyền lợi người lao động theo Bộ luật Lao động 2019',
        category: 'Luật Lao động',
        categorySlug: 'labor',
        author: 'Lê Thuỳ Dung',
        authorId: 77,
        createdAt: '1 ngày trước',
        repliesCount: 5,
        viewsCount: 89,
        tags: ['lao-dong', 'thu-viec', 'luong']
      }
    ];
  }

  private loadStoredSavedIds(): string[] {
    try {
      const stored = localStorage.getItem(this.SAVED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private persistPosts(posts: ForumPostItem[]): void {
    this.postsSignal.set(posts);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error('Error persisting forum posts:', e);
    }
  }

  private persistSaved(ids: string[]): void {
    this.savedPostIdsSignal.set(ids);
    try {
      localStorage.setItem(this.SAVED_STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error('Error persisting saved posts:', e);
    }
  }

  getMyPosts(): ForumPostItem[] {
    const user = this.authService.currentUser();
    const currentName = user?.name || '';
    const currentId = user?.id;

    return this.postsSignal().filter(p => {
      if (currentId && p.authorId === currentId) return true;
      if (currentName && p.author.toLowerCase() === currentName.toLowerCase()) return true;
      return false;
    });
  }

  getSavedPosts(): ForumPostItem[] {
    const savedIds = this.savedPostIdsSignal();
    return this.postsSignal().filter(p => savedIds.includes(String(p.id)));
  }

  toggleSavePost(postId: string | number): boolean {
    const idStr = String(postId);
    const current = this.savedPostIdsSignal();
    let updated: string[];
    let isSaved = false;

    if (current.includes(idStr)) {
      updated = current.filter(id => id !== idStr);
      isSaved = false;
    } else {
      updated = [...current, idStr];
      isSaved = true;
    }

    this.persistSaved(updated);
    return isSaved;
  }

  isPostSaved(postId: string | number): boolean {
    return this.savedPostIdsSignal().includes(String(postId));
  }

  createPost(data: {
    title: string;
    content: string;
    category: string;
    categorySlug?: string;
    tags?: string[];
  }): ForumPostItem {
    const user = this.authService.currentUser();
    const newPost: ForumPostItem = {
      id: `post-${Date.now()}`,
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category,
      categorySlug: data.categorySlug || 'civil',
      author: user?.name || 'Nguyen Van A',
      authorId: user?.id || 1,
      createdAt: 'Vừa xong',
      repliesCount: 0,
      viewsCount: 1,
      tags: data.tags || []
    };

    const currentList = this.postsSignal();
    this.persistPosts([newPost, ...currentList]);

    // Attempt backend creation if available
    this.http.post(`${this.apiUrl}/forum/posts`, {
      title: data.title,
      content: data.content,
      categoryId: 1,
      tags: data.tags || []
    }, { withCredentials: true }).subscribe({
      error: (err) => {
        console.warn('Backend create post call failed, saved locally:', err);
      }
    });

    return newPost;
  }

  /**
   * Calls Spring Boot backend @GetMapping("/posts")
   * public ResponseEntity<Page<PostDto>> getAllPosts
   */
  getAllPosts(page = 0, size = 20, categoryId?: number, timeFilter?: string): Observable<{ posts: ForumPostItem[], totalElements: number, totalPages: number }> {
    let params: any = {
      page: page.toString(),
      size: size.toString()
    };
    if (categoryId) {
      params.categoryId = categoryId.toString();
    }
    if (timeFilter && timeFilter !== 'all') {
      params.timeFilter = timeFilter;
    }

    return this.http.get<any>(`${this.apiUrl}/forum/posts`, { params, withCredentials: true }).pipe(
      map(res => {
        const rawContent = res.content || (Array.isArray(res) ? res : []);
        const mappedList: ForumPostItem[] = rawContent.map((p: any) => this.mapDtoToForumPostItem(p));
        if (mappedList.length > 0) {
          this.postsSignal.set(mappedList);
        }
        return {
          posts: mappedList,
          totalElements: res.totalElements != null ? res.totalElements : mappedList.length,
          totalPages: res.totalPages != null ? res.totalPages : 1
        };
      }),
      catchError(err => {
        console.warn('API /api/forum/posts failed, using local posts:', err);
        return of({
          posts: this.postsSignal(),
          totalElements: this.postsSignal().length,
          totalPages: 1
        });
      })
    );
  }

  fetchPosts(page = 0, size = 20, categoryId?: number, timeFilter?: string) {
    return this.getAllPosts(page, size, categoryId, timeFilter);
  }

  private mapDtoToForumPostItem(dto: any): ForumPostItem {
    return {
      id: dto.id,
      title: dto.title,
      slug: dto.slug,
      category: dto.category?.name || dto.category || 'Chung',
      categorySlug: dto.category?.slug || 'kinh-doanh',
      author: dto.author?.name || dto.author || 'Thành viên',
      authorId: dto.author?.id,
      createdAt: this.formatRelativeTime(dto.createdAt),
      repliesCount: dto.replyCount != null ? dto.replyCount : (dto.replies ? dto.replies.length : (dto.repliesCount || 0)),
      viewsCount: dto.view != null ? dto.view : (dto.views != null ? dto.views : (dto.viewsCount || 0)),
      isPinned: dto.pinned,
      isHot: dto.isHot,
      tags: Array.isArray(dto.tags) ? dto.tags : (dto.tags ? Array.from(dto.tags) : []),
      content: dto.content
    };
  }

  formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return 'Vừa xong';
    try {
      const normalizedStr = dateStr.includes(' ') && !dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr;
      const d = new Date(normalizedStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Vừa xong';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return '1 ngày trước';
      if (diffDays < 7) return `${diffDays} ngày trước`;
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  getPostBySlug(categorySlug: string, postSlug: string): Observable<PostDetailItem> {
    return this.http.get<any>(`${this.apiUrl}/forum/categories/${categorySlug}/posts/${postSlug}`, { withCredentials: true }).pipe(
      map(dto => this.normalizePostDetail(dto)),
      catchError(err => {
        console.warn(`Backend getPostBySlug failed (${categorySlug}/${postSlug}), falling back:`, err);
        return of(this.getLocalPostDetailBySlug(categorySlug, postSlug));
      })
    );
  }

  getPopularTopics(limit = 5): Observable<PopularTopicItem[]> {
    return this.http.get<PopularTopicItem[]>(`${this.apiUrl}/forum/popular-topics`, {
      params: { limit: limit.toString() },
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.warn('getPopularTopics failed:', err);
        return of([]);
      })
    );
  }

  getCategoryStats(): Observable<CategoryStatItem[]> {
    return this.http.get<CategoryStatItem[]>(`${this.apiUrl}/forum/category-stats`, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.warn('getCategoryStats failed:', err);
        return of([]);
      })
    );
  }

  getPopularTags(limit = 10): Observable<PopularTagItem[]> {
    return this.http.get<PopularTagItem[]>(`${this.apiUrl}/forum/popular-tags`, {
      params: { limit: limit.toString() },
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.warn('getPopularTags failed:', err);
        return of([]);
      })
    );
  }

  getAllCategories(): Observable<ForumCategoryItem[]> {
    return this.http.get<ForumCategoryItem[]>(`${this.apiUrl}/forum/categories`, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.warn('getAllCategories failed:', err);
        return of([]);
      })
    );
  }

  getForumStats(): Observable<ForumStatsData> {
    return this.http.get<ForumStatsData>(`${this.apiUrl}/forum/stats`, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.warn('getForumStats failed:', err);
        return of({
          totalTopics: 10,
          totalPosts: 25,
          totalMembers: 13,
          topicsToday: 0,
          postsToday: 0,
          membersToday: 0
        });
      })
    );
  }

  getOnlineUsers(): Observable<OnlineUsersData> {
    return this.http.get<OnlineUsersData>(`${this.apiUrl}/chat/online-users`, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.warn('getOnlineUsers failed:', err);
        return of({ totalOnline: 0 });
      })
    );
  }

  getPostDetail(id: string | number): Observable<PostDetailItem> {
    const post = this.postsSignal().find(p => String(p.id) === String(id));
    if (post && post.categorySlug && post.slug) {
      return this.getPostBySlug(post.categorySlug, post.slug);
    }
    const numericId = String(id).replace(/^post-/, '');
    if (!isNaN(Number(numericId))) {
      return this.http.get<any>(`${this.apiUrl}/forum/post/${numericId}`, { withCredentials: true }).pipe(
        map(dto => this.normalizePostDetail(dto)),
        catchError(err => {
          console.warn('Backend getPostById failed, falling back to local:', err);
          return of(this.getLocalPostDetail(id));
        })
      );
    }
    return of(this.getLocalPostDetail(id));
  }

  getPostReplies(postId: string | number): Observable<PostReplyItem[]> {
    const numericId = String(postId).replace(/^post-/, '');
    if (!isNaN(Number(numericId))) {
      return this.http.get<any[]>(`${this.apiUrl}/forum/posts/${numericId}/replies`, { withCredentials: true }).pipe(
        map(dtos => this.normalizeReplies(dtos)),
        catchError(err => {
          console.warn('Backend getPostReplies failed, falling back to local:', err);
          return of(this.getLocalReplies(postId));
        })
      );
    }
    return of(this.getLocalReplies(postId));
  }

  addReply(postId: string | number, content: string, parentId?: number | string | null): Observable<PostReplyItem> {
    const numericId = String(postId).replace(/^post-/, '');
    const user = this.authService.currentUser();
    const payload = {
      content: content.trim(),
      parentId: parentId && !isNaN(Number(parentId)) ? Number(parentId) : null
    };

    if (!isNaN(Number(numericId))) {
      return this.http.post<any>(`${this.apiUrl}/forum/posts/${numericId}/replies`, payload, { withCredentials: true }).pipe(
        map(dto => this.normalizeReply(dto)),
        catchError(err => {
          console.warn('Backend addReply failed, using local reply:', err);
          return of(this.createLocalReply(postId, content, parentId, user));
        })
      );
    }

    return of(this.createLocalReply(postId, content, parentId, user));
  }

  private normalizePostDetail(dto: any): PostDetailItem {
    let author: PostAuthor = {
      id: dto.author?.id || 1,
      name: dto.author?.name || 'Thành viên',
      email: dto.author?.email,
      role: dto.author?.role || 'USER',
      avatar: dto.author?.avatar
    };

    let tagsList: string[] = [];
    if (Array.isArray(dto.tags)) {
      tagsList = dto.tags;
    } else if (dto.tags && typeof dto.tags === 'string') {
      tagsList = dto.tags.split(',').map((t: string) => t.trim());
    } else if (dto.tags instanceof Set) {
      tagsList = Array.from(dto.tags);
    }

    return {
      id: dto.id,
      title: dto.title,
      slug: dto.slug,
      content: dto.content,
      category: dto.category,
      author,
      views: dto.view != null ? dto.view : (dto.views != null ? dto.views : 0),
      replyCount: dto.replyCount != null ? dto.replyCount : 0,
      upvoteCount: dto.upvoteCount || 0,
      downvoteCount: dto.downvoteCount || 0,
      userVote: dto.userVote,
      pinned: dto.pinned,
      solved: dto.solved,
      isHot: dto.isHot,
      tags: tagsList,
      labels: dto.labels || [],
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      replies: dto.replies ? this.normalizeReplies(dto.replies) : []
    };
  }

  private normalizeReplies(dtos: any[]): PostReplyItem[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map(dto => this.normalizeReply(dto));
  }

  private normalizeReply(dto: any): PostReplyItem {
    return {
      id: dto.id,
      content: dto.content,
      postId: dto.postId,
      author: {
        id: dto.author?.id || 1,
        name: dto.author?.name || 'Thành viên',
        role: dto.author?.role || 'USER',
        avatar: dto.author?.avatar
      },
      parentId: dto.parentId,
      children: dto.children ? this.normalizeReplies(dto.children) : [],
      upvoteCount: dto.upvoteCount || 0,
      downvoteCount: dto.downvoteCount || 0,
      userVote: dto.userVote,
      isActive: dto.isActive,
      isSolution: dto.isSolution,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  private getLocalPostDetail(id: string | number): PostDetailItem {
    const post = this.postsSignal().find(p => String(p.id) === String(id));
    return {
      id: id,
      title: post ? post.title : 'Thủ tục thành lập công ty TNHH 2 thành viên và các nghĩa vụ thuế trong năm đầu tiên',
      content: post?.content || 'Tôi và một người bạn dự định cùng góp vốn 1 tỷ đồng để thành lập một công ty TNHH 2 thành viên hoạt động trong lĩnh vực dịch vụ công nghệ thông tin và truyền thông tại Hà Nội. Chúng tôi chưa từng mở doanh nghiệp nên muốn tìm hiểu rõ: 1. Hồ sơ xin cấp Giấy chứng nhận đăng ký doanh nghiệp tại Sở Kế hoạch & Đầu tư gồm những biểu mẫu gì? 2. Thời hạn góp đủ vốn điều lệ là bao nhiêu ngày kể từ khi có giấy phép? 3. Doanh nghiệp mới thành lập cần thực hiện những nghĩa vụ thuế gì ban đầu và có được miễn lệ phí môn bài năm đầu không? Rất mong được các Luật sư JurisHub giải đáp chi tiết.',
      category: post?.category || 'Kinh doanh & Doanh nghiệp',
      author: {
        id: post?.authorId || 12,
        name: post?.author || 'Nguyễn Văn Hùng',
        role: 'USER',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
      },
      views: post?.viewsCount || 330,
      replyCount: post?.repliesCount || 2,
      upvoteCount: 24,
      downvoteCount: 0,
      tags: post?.tags || ['tnhh', 'von-dieu-le', 'thanh-lap-cong-ty', 'thue-doanh-nghiep'],
      createdAt: post?.createdAt || '13:45:38 24/9/2026'
    };
  }

  private getLocalReplies(postId: string | number): PostReplyItem[] {
    return [
      {
        id: 15,
        postId,
        content: `Chào bạn! Chúc mừng hai bạn khởi nghiệp. Về thủ tục thành lập công ty TNHH 2 thành viên trở lên theo Luật Doanh nghiệp 2020:
1. Hồ sơ gồm:
- Giấy đề nghị đăng ký doanh nghiệp (Phụ lục I-3 Thông tư 01/2021/TT-BKHĐT).
- Điều lệ công ty TNHH 2 thành viên.
- Danh sách thành viên góp vốn kèm bản sao CCCD của các thành viên.
2. Vốn điều lệ:
Thời hạn góp đủ 100% số vốn đã đăng ký cam kết là KHÔNG QUÁ 90 NGÀY kể từ ngày được cấp Giấy chứng nhận đăng ký doanh nghiệp.
3. Về thuế năm đầu tiên:
- Doanh nghiệp mới thành lập được MIỄN LỆ PHÍ MÔN BÀI trong năm đầu tiên (theo Nghị định 22/2020/NĐ-CP).
- Các thủ tục ban đầu cần làm ngay: Mua chữ ký số điện tử (token), mở tài khoản ngân hàng và đăng ký nộp thuế điện tử, phát hành hóa đơn điện tử.`,
        author: {
          id: 6,
          name: 'Luật sư Lê Thị Minh',
          role: 'LAWYER',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
        },
        parentId: null,
        upvoteCount: 21,
        downvoteCount: 0,
        isSolution: true,
        createdAt: '13:45:38 25/9/2026'
      }
    ];
  }

  private createLocalReply(postId: string | number, content: string, parentId: any, user: any): PostReplyItem {
    return {
      id: Date.now(),
      content: content.trim(),
      postId,
      author: {
        id: user?.id || 1,
        name: user?.name || user?.fullName || 'Người dùng',
        role: user?.role || 'USER',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
      },
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
      upvoteCount: 0,
      downvoteCount: 0
    };
  }

  private getLocalPostDetailBySlug(categorySlug: string, postSlug: string): PostDetailItem {
    const post = this.postsSignal().find(p => p.slug === postSlug || p.categorySlug === categorySlug);
    if (post) {
      return this.getLocalPostDetail(post.id);
    }
    return this.getLocalPostDetail(10);
  }
}

