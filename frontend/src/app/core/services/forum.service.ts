import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ForumPostItem {
  id: string | number;
  title: string;
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

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;
  private readonly STORAGE_KEY = 'jurishub_forum_posts';
  private readonly SAVED_STORAGE_KEY = 'jurishub_saved_posts';

  private postsSignal = signal<ForumPostItem[]>(this.loadStoredPosts());
  private savedPostIdsSignal = signal<string[]>(this.loadStoredSavedIds());

  readonly posts = this.postsSignal.asReadonly();
  readonly savedPostIds = this.savedPostIdsSignal.asReadonly();

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
}
