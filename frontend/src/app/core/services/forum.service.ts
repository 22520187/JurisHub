import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
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
  categorySlug?: string;
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
  authorAvatar?: string;
  authorRole?: string;
  createdAt: string;
  repliesCount: number;
  viewsCount: number;
  upvoteCount?: number;
  downvoteCount?: number;
  userVote?: string | null;
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

export interface CategoryLabelItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  categoryId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ForumCategoryItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
  threadCount?: number;
  postCount?: number;
  labels?: CategoryLabelItem[];
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

export interface CreatePostPayload {
  title: string;
  content: string;
  categoryId?: number;
  category?: string;
  categorySlug?: string;
  labelIds?: number[];
  tags?: string[];
  pinned?: boolean;
  isHot?: boolean;
}

export type PostCreateRequest = CreatePostPayload;

export interface VoteRequestDto {
  voteType: 'UPVOTE' | 'DOWNVOTE' | 'NONE';
}

export interface VoteDto {
  voteType: string | null;
  upvoteCount: number;
  downvoteCount: number;
  userVote: string | null;
}

export type VoteResponse = VoteDto;

export interface PageResponse<T> {
  posts: T[];
  totalElements: number;
  totalPages: number;
  currentPage?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;
  private readonly SAVED_STORAGE_KEY = 'jurishub_saved_posts';

  private postsSignal = signal<ForumPostItem[]>([]);
  private categoriesSignal = signal<ForumCategoryItem[]>([]);
  private savedPostIdsSignal = signal<string[]>(this.loadStoredSavedIds());

  readonly posts = this.postsSignal.asReadonly();
  readonly categories = this.categoriesSignal.asReadonly();
  readonly savedPostIds = this.savedPostIdsSignal.asReadonly();

  // Known fallback slug to categoryId mapping in case categories are not yet fetched
  private readonly categorySlugMap: Record<string, number> = {
    civil: 1,
    criminal: 2,
    land: 3,
    marriage: 4,
    labor: 5,
    corporate: 6
  };

  constructor() {
    this.getAllCategories().subscribe();
    this.getAllPosts().subscribe();
  }

  // =========================================================================
  // 1. CATEGORIES APIS (/api/forum/categories)
  // =========================================================================

  /**
   * GET /api/forum/categories
   * Retrieve all active forum categories
   */
  getAllCategories(): Observable<ForumCategoryItem[]> {
    return this.http.get<ForumCategoryItem[]>(`${this.apiUrl}/forum/categories`, {
      withCredentials: true
    }).pipe(
      tap(categories => {
        if (Array.isArray(categories)) {
          this.categoriesSignal.set(categories);
        }
      }),
      catchError(err => {
        console.error('API /api/forum/categories failed:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * GET /api/forum/categories/{slug}
   * Retrieve category details by slug
   */
  getCategoryBySlug(slug: string): Observable<ForumCategoryItem> {
    return this.http.get<ForumCategoryItem>(`${this.apiUrl}/forum/categories/${slug}`, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.error(`API /api/forum/categories/${slug} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  // =========================================================================
  // 2. POSTS LIST & SEARCH APIS
  // =========================================================================

  /**
   * GET /api/forum/posts
   * Retrieve paged list of posts with optional category & time filters
   */
  getAllPosts(
    page = 0,
    size = 20,
    categoryId?: number,
    timeFilter?: string,
    sort?: string
  ): Observable<PageResponse<ForumPostItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }
    if (categoryId != null) {
      params = params.set('categoryId', categoryId.toString());
    }
    if (timeFilter && timeFilter !== 'all') {
      params = params.set('timeFilter', timeFilter);
    }

    return this.http.get<any>(`${this.apiUrl}/forum/posts`, { params, withCredentials: true }).pipe(
      map(res => this.mapPageResponse(res)),
      tap(result => {
        if (page === 0 && (!categoryId && (!timeFilter || timeFilter === 'all'))) {
          this.postsSignal.set(result.posts);
        }
      }),
      catchError(err => {
        console.error('API /api/forum/posts failed:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Alias for getAllPosts
   */
  fetchPosts(page = 0, size = 20, categoryId?: number, timeFilter?: string, sort?: string) {
    return this.getAllPosts(page, size, categoryId, timeFilter, sort);
  }

  /**
   * GET /api/forum/categories/{categorySlug}/posts
   * Retrieve paged list of posts by category slug
   */
  getPostsByCategory(
    categorySlug: string,
    page = 0,
    size = 20,
    sort = 'createdAt,desc'
  ): Observable<PageResponse<ForumPostItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<any>(`${this.apiUrl}/forum/categories/${categorySlug}/posts`, {
      params,
      withCredentials: true
    }).pipe(
      map(res => this.mapPageResponse(res)),
      catchError(err => {
        console.error(`API /api/forum/categories/${categorySlug}/posts failed:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * GET /api/forum/posts/search
   * Search posts across all categories by keyword
   */
  searchPosts(
    keyword: string,
    page = 0,
    size = 20,
    sort = 'createdAt,desc'
  ): Observable<PageResponse<ForumPostItem>> {
    let params = new HttpParams()
      .set('keyword', keyword.trim())
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<any>(`${this.apiUrl}/forum/posts/search`, {
      params,
      withCredentials: true
    }).pipe(
      map(res => this.mapPageResponse(res)),
      catchError(err => {
        console.error(`API /api/forum/posts/search failed for keyword "${keyword}":`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * GET /api/forum/categories/{categorySlug}/posts/search
   * Search posts within a specific category by keyword
   */
  searchPostsByCategory(
    keyword: string,
    categorySlug: string,
    page = 0,
    size = 20,
    sort = 'createdAt,desc'
  ): Observable<PageResponse<ForumPostItem>> {
    let params = new HttpParams()
      .set('keyword', keyword.trim())
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<any>(`${this.apiUrl}/forum/categories/${categorySlug}/posts/search`, {
      params,
      withCredentials: true
    }).pipe(
      map(res => this.mapPageResponse(res)),
      catchError(err => {
        console.error(`API /api/forum/categories/${categorySlug}/posts/search failed:`, err);
        return throwError(() => err);
      })
    );
  }

  // =========================================================================
  // 3. POST DETAILS & MUTATIONS
  // =========================================================================

  /**
   * GET /api/forum/post/{id}
   * Get post detail by numeric ID
   */
  getPostById(id: number | string): Observable<PostDetailItem> {
    const numericId = String(id).replace(/^post-/, '');
    return this.http.get<any>(`${this.apiUrl}/forum/post/${numericId}`, {
      withCredentials: true
    }).pipe(
      map(dto => this.normalizePostDetail(dto)),
      catchError(err => {
        console.error(`API /api/forum/post/${numericId} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * GET /api/forum/categories/{categorySlug}/posts/{postSlug}
   * Get post detail by category slug & post slug
   */
  getPostBySlug(categorySlug: string, postSlug: string): Observable<PostDetailItem> {
    return this.http.get<any>(`${this.apiUrl}/forum/categories/${categorySlug}/posts/${postSlug}`, {
      withCredentials: true
    }).pipe(
      map(dto => this.normalizePostDetail(dto)),
      catchError(err => {
        console.error(`API /api/forum/categories/${categorySlug}/posts/${postSlug} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Smart loader: retrieves post either by slug or by id
   */
  getPostDetail(idOrSlug: string | number, categorySlug?: string): Observable<PostDetailItem> {
    if (categorySlug && typeof idOrSlug === 'string' && isNaN(Number(idOrSlug))) {
      return this.getPostBySlug(categorySlug, idOrSlug);
    }
    const post = this.postsSignal().find(p => String(p.id) === String(idOrSlug));
    if (post && post.categorySlug && post.slug) {
      return this.getPostBySlug(post.categorySlug, post.slug);
    }
    return this.getPostById(idOrSlug);
  }

  /**
   * POST /api/forum/categories/{categorySlug}/posts/{postSlug}/increment-views
   * Increment view counter for a post
   */
  incrementPostViews(categorySlug: string, postSlug: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/forum/categories/${categorySlug}/posts/${postSlug}/increment-views`,
      {},
      { withCredentials: true }
    ).pipe(
      catchError(err => {
        console.warn('API increment-views failed:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * POST /api/forum/posts
   * Create a new forum post
   */
  createPost(data: CreatePostPayload): Observable<PostDetailItem> {
    const categoryId = data.categoryId ?? this.resolveCategoryId(data.categorySlug || data.category);

    const payload = {
      title: data.title.trim(),
      content: data.content.trim(),
      categoryId: categoryId,
      labelIds: data.labelIds && data.labelIds.length > 0 ? Array.from(new Set(data.labelIds)) : undefined,
      tags: data.tags && data.tags.length > 0 ? Array.from(new Set(data.tags)) : [],
      pinned: data.pinned ?? false,
      isHot: data.isHot ?? false
    };

    return this.http.post<any>(`${this.apiUrl}/forum/posts`, payload, {
      withCredentials: true
    }).pipe(
      map(dto => this.normalizePostDetail(dto)),
      tap(newPost => {
        const mappedItem = this.mapDtoToForumPostItem(newPost);
        this.postsSignal.update(list => [mappedItem, ...list]);
      }),
      catchError(err => {
        console.error('API POST /api/forum/posts failed:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * PUT /api/forum/posts/{id}
   * Update an existing forum post
   */
  updatePost(id: number | string, data: CreatePostPayload): Observable<PostDetailItem> {
    const numericId = String(id).replace(/^post-/, '');
    const categoryId = data.categoryId ?? this.resolveCategoryId(data.categorySlug || data.category);

    const payload = {
      title: data.title.trim(),
      content: data.content.trim(),
      categoryId: categoryId,
      labelIds: data.labelIds && data.labelIds.length > 0 ? Array.from(new Set(data.labelIds)) : undefined,
      tags: data.tags && data.tags.length > 0 ? Array.from(new Set(data.tags)) : [],
      pinned: data.pinned ?? false,
      isHot: data.isHot ?? false
    };

    return this.http.put<any>(`${this.apiUrl}/forum/posts/${numericId}`, payload, {
      withCredentials: true
    }).pipe(
      map(dto => this.normalizePostDetail(dto)),
      tap(updatedPost => {
        const mappedItem = this.mapDtoToForumPostItem(updatedPost);
        this.postsSignal.update(list =>
          list.map(p => String(p.id) === String(mappedItem.id) ? mappedItem : p)
        );
      }),
      catchError(err => {
        console.error(`API PUT /api/forum/posts/${numericId} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * DELETE /api/forum/posts/{id}
   * Delete a post
   */
  deletePost(id: number | string): Observable<void> {
    const numericId = String(id).replace(/^post-/, '');
    return this.http.delete<void>(`${this.apiUrl}/forum/posts/${numericId}`, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.postsSignal.update(list => list.filter(p => String(p.id) !== String(numericId)));
      }),
      catchError(err => {
        console.error(`API DELETE /api/forum/posts/${numericId} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  // =========================================================================
  // 4. REPLIES APIS
  // =========================================================================

  /**
   * GET /api/forum/posts/{postId}/replies
   * Get all replies for a post
   */
  getRepliesByPost(postId: number | string): Observable<PostReplyItem[]> {
    const numericId = String(postId).replace(/^post-/, '');
    return this.http.get<any[]>(`${this.apiUrl}/forum/posts/${numericId}/replies`, {
      withCredentials: true
    }).pipe(
      map(dtos => this.normalizeReplies(dtos)),
      catchError(err => {
        console.error(`API /api/forum/posts/${numericId}/replies failed:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Alias for getRepliesByPost
   */
  getPostReplies(postId: number | string): Observable<PostReplyItem[]> {
    return this.getRepliesByPost(postId);
  }

  /**
   * POST /api/forum/posts/{postId}/replies
   * Add a new reply / comment to a post
   */
  addReply(postId: number | string, content: string, parentId?: number | string | null): Observable<PostReplyItem> {
    const numericId = String(postId).replace(/^post-/, '');
    const payload = {
      content: content.trim(),
      parentId: parentId && !isNaN(Number(parentId)) ? Number(parentId) : null
    };

    return this.http.post<any>(`${this.apiUrl}/forum/posts/${numericId}/replies`, payload, {
      withCredentials: true
    }).pipe(
      map(dto => this.normalizeReply(dto)),
      tap(() => {
        // Increment reply count in local signal if present
        this.postsSignal.update(list =>
          list.map(p => {
            if (String(p.id) === String(numericId)) {
              return { ...p, repliesCount: (p.repliesCount || 0) + 1 };
            }
            return p;
          })
        );
      }),
      catchError(err => {
        console.error(`API POST /api/forum/posts/${numericId}/replies failed:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * DELETE /api/forum/replies/{replyId}
   * Delete a reply
   */
  deleteReply(replyId: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/forum/replies/${replyId}`, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.error(`API DELETE /api/forum/replies/${replyId} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  // =========================================================================
  // 5. VOTING APIS
  // =========================================================================

  /**
   * POST /api/forum/posts/{postId}/vote
   * Vote on a post (UPVOTE, DOWNVOTE, or NONE)
   */
  votePost(postId: number | string, voteType: 'UPVOTE' | 'DOWNVOTE' | 'NONE'): Observable<VoteDto> {
    const numericId = String(postId).replace(/^post-/, '');
    return this.http.post<VoteDto>(`${this.apiUrl}/forum/posts/${numericId}/vote`, { voteType }, {
      withCredentials: true
    }).pipe(
      tap(result => {
        this.postsSignal.update(list =>
          list.map(p => {
            if (String(p.id) === String(numericId)) {
              return {
                ...p,
                upvoteCount: result.upvoteCount,
                downvoteCount: result.downvoteCount,
                userVote: result.userVote
              };
            }
            return p;
          })
        );
      }),
      catchError(err => {
        console.error(`API POST /api/forum/posts/${numericId}/vote failed:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * POST /api/forum/replies/{replyId}/vote
   * Vote on a reply (UPVOTE, DOWNVOTE, or NONE)
   */
  voteReply(replyId: number | string, voteType: 'UPVOTE' | 'DOWNVOTE' | 'NONE'): Observable<VoteDto> {
    return this.http.post<VoteDto>(`${this.apiUrl}/forum/replies/${replyId}/vote`, { voteType }, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.error(`API POST /api/forum/replies/${replyId}/vote failed:`, err);
        return throwError(() => err);
      })
    );
  }

  // =========================================================================
  // 6. STATISTICS & SIDEBAR APIS
  // =========================================================================

  /**
   * GET /api/forum/stats
   * Overall forum stats
   */
  getForumStats(): Observable<ForumStatsData> {
    return this.http.get<ForumStatsData>(`${this.apiUrl}/forum/stats`, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.error('API /api/forum/stats failed:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * GET /api/forum/popular-topics
   * Popular topics for forum sidebar
   */
  getPopularTopics(limit = 5): Observable<PopularTopicItem[]> {
    return this.http.get<PopularTopicItem[]>(`${this.apiUrl}/forum/popular-topics`, {
      params: { limit: limit.toString() },
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.error('API /api/forum/popular-topics failed:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * GET /api/forum/category-stats
   * Category stats breakdown
   */
  getCategoryStats(): Observable<CategoryStatItem[]> {
    return this.http.get<CategoryStatItem[]>(`${this.apiUrl}/forum/category-stats`, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.error('API /api/forum/category-stats failed:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * GET /api/forum/popular-tags
   * Popular tags ranking
   */
  getPopularTags(limit = 10): Observable<PopularTagItem[]> {
    return this.http.get<PopularTagItem[]>(`${this.apiUrl}/forum/popular-tags`, {
      params: { limit: limit.toString() },
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.error('API /api/forum/popular-tags failed:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * GET /api/chat/online-users
   * Online users statistics
   */
  getOnlineUsers(): Observable<OnlineUsersData> {
    return this.http.get<OnlineUsersData>(`${this.apiUrl}/chat/online-users`, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.warn('API /api/chat/online-users failed:', err);
        return throwError(() => err);
      })
    );
  }

  // =========================================================================
  // 7. USER SAVED / BOOKMARKED POSTS & MY POSTS HELPERS
  // =========================================================================

  getMyPosts(): ForumPostItem[] {
    const user = this.authService.currentUser();
    const currentName = user?.name || '';
    const currentId = user?.id;

    return this.postsSignal().filter(p => {
      if (currentId != null && p.authorId != null && String(p.authorId) === String(currentId)) return true;
      if (currentName && p.author && p.author.toLowerCase() === currentName.toLowerCase()) return true;
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

  private loadStoredSavedIds(): string[] {
    try {
      const stored = localStorage.getItem(this.SAVED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
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

  // =========================================================================
  // 8. HELPERS & NORMALIZERS
  // =========================================================================

  resolveCategoryId(slugOrName?: string): number {
    if (!slugOrName) return 1;
    const clean = slugOrName.toLowerCase().trim();

    // Check loaded categories signal
    const found = this.categoriesSignal().find(
      c => c.slug?.toLowerCase() === clean || c.name?.toLowerCase() === clean
    );
    if (found && found.id) {
      return Number(found.id);
    }

    // Check slug fallback map
    if (this.categorySlugMap[clean]) {
      return this.categorySlugMap[clean];
    }

    return 1;
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

  private mapPageResponse(res: any): PageResponse<ForumPostItem> {
    const rawContent = res?.content || (Array.isArray(res) ? res : []);
    const mappedList: ForumPostItem[] = rawContent.map((p: any) => this.mapDtoToForumPostItem(p));
    return {
      posts: mappedList,
      totalElements: res?.totalElements != null ? res.totalElements : mappedList.length,
      totalPages: res?.totalPages != null ? res.totalPages : 1,
      currentPage: res?.number != null ? res.number : 0
    };
  }

  mapDtoToForumPostItem(dto: any): ForumPostItem {
    const cat = dto.category;
    const author = dto.author;
    const tagsList = Array.isArray(dto.tags) ? dto.tags : (dto.tags ? Array.from(dto.tags as any) : []);

    return {
      id: dto.id,
      title: dto.title,
      slug: dto.slug,
      category: typeof cat === 'object' && cat ? (cat.name || 'Chung') : (cat || 'Chung'),
      categorySlug: typeof cat === 'object' && cat ? (cat.slug || 'kinh-doanh') : 'kinh-doanh',
      author: typeof author === 'object' && author ? (author.name || 'Thành viên') : (author || 'Thành viên'),
      authorId: typeof author === 'object' && author ? author.id : undefined,
      authorAvatar: typeof author === 'object' && author ? author.avatar : undefined,
      authorRole: typeof author === 'object' && author ? author.role : undefined,
      createdAt: this.formatRelativeTime(dto.createdAt),
      repliesCount: dto.replyCount != null ? dto.replyCount : (dto.replies ? dto.replies.length : (dto.repliesCount || 0)),
      viewsCount: dto.view != null ? dto.view : (dto.views != null ? dto.views : (dto.viewsCount || 0)),
      upvoteCount: dto.upvoteCount || 0,
      downvoteCount: dto.downvoteCount || 0,
      userVote: dto.userVote,
      isPinned: !!dto.pinned,
      isHot: !!dto.isHot,
      tags: tagsList as string[],
      content: dto.content
    };
  }

  private normalizePostDetail(dto: any): PostDetailItem {
    if (!dto) {
      throw new Error('Post not found');
    }

    const author: PostAuthor = {
      id: dto.author?.id || 0,
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
      category: dto.category?.name || dto.category || 'Chung',
      categorySlug: dto.category?.slug,
      author,
      view: dto.view != null ? dto.view : (dto.views != null ? dto.views : 0),
      views: dto.view != null ? dto.view : (dto.views != null ? dto.views : 0),
      replyCount: dto.replyCount != null ? dto.replyCount : (dto.replies ? dto.replies.length : 0),
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
        id: dto.author?.id || 0,
        name: dto.author?.name || 'Thành viên',
        email: dto.author?.email,
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
}
