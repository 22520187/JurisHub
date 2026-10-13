import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface UserManagement {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatar?: string;
  role: 'ADMIN' | 'LAWYER' | 'USER' | string;
  authProvider?: string;
  isEmailVerified?: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
  postsCount?: number;
  messagesCount?: number;
  [key: string]: unknown;
}

export interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
  userEmail?: string;
  entityId?: number;
}

export interface PopularContent {
  postId: number;
  title: string;
  categoryName: string;
  views: number;
  replies: number;
  createdAt: string;
}

export interface UserRoleStats {
  role: string;
  count: number;
  activeCount: number;
}

export interface MonthlyGrowth {
  month: string;
  users: number;
  lawyers: number;
  posts: number;
}

export interface WeeklyActivity {
  day: string;
  posts: number;
  replies: number;
  views: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalLawyers: number;
  totalCategories: number;
  pendingApplications: number;
  activeUsers: number;
  reportedPosts: number;
  unresolvedReports: number;
  newUsersThisMonth: number;
  newPostsThisMonth: number;
  newLawyersThisMonth: number;
  totalMessages: number;
  totalConversations: number;
  recentActivities: RecentActivity[];
  popularPosts: PopularContent[];
  usersByRole: UserRoleStats[];
  monthlyGrowth: MonthlyGrowth[];
  weeklyActivity: WeeklyActivity[];
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * GET /api/admin/dashboard/stats
   */
  getDashboardStats(): Observable<ApiResponse<AdminDashboardStats>> {
    return this.http.get<ApiResponse<AdminDashboardStats>>(
      `${this.apiUrl}/admin/dashboard/stats`,
      { withCredentials: true }
    );
  }

  /**
   * GET /api/admin/users
   */
  getAllUsers(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    role?: string;
  }): Observable<ApiResponse<SpringPage<UserManagement>>> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    if (params.search && params.search.trim()) httpParams = httpParams.set('search', params.search.trim());
    if (params.role && params.role.trim() && params.role !== 'ALL') httpParams = httpParams.set('role', params.role.trim());

    return this.http.get<ApiResponse<SpringPage<UserManagement>>>(
      `${this.apiUrl}/admin/users`,
      { params: httpParams, withCredentials: true }
    );
  }

  /**
   * PUT /api/admin/users/{userId}/status?isEnabled={true|false}
   */
  updateUserStatus(userId: number, isEnabled: boolean): Observable<ApiResponse<string>> {
    const params = new HttpParams().set('isEnabled', isEnabled.toString());
    return this.http.put<ApiResponse<string>>(
      `${this.apiUrl}/admin/users/${userId}/status`,
      {},
      { params, withCredentials: true }
    );
  }

  /**
   * GET /api/admin/posts
   */
  getPostsForModeration(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    isActive?: boolean;
  }): Observable<ApiResponse<SpringPage<PostModeration>>> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    if (params.search && params.search.trim()) httpParams = httpParams.set('search', params.search.trim());
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());

    return this.http.get<ApiResponse<SpringPage<PostModeration>>>(
      `${this.apiUrl}/admin/posts`,
      { params: httpParams, withCredentials: true }
    );
  }

  /**
   * PUT /api/admin/posts/{postId}/status?isActive={true|false}
   */
  updatePostStatus(postId: number, isActive: boolean): Observable<ApiResponse<string>> {
    const params = new HttpParams().set('isActive', isActive.toString());
    return this.http.put<ApiResponse<string>>(
      `${this.apiUrl}/admin/posts/${postId}/status`,
      {},
      { params, withCredentials: true }
    );
  }

  /**
   * DELETE /api/admin/posts/{postId}
   */
  deletePost(postId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(
      `${this.apiUrl}/admin/posts/${postId}`,
      { withCredentials: true }
    );
  }

  /**
   * PUT /api/admin/posts/{postId}/pin?isPinned={true|false}
   */
  updatePostPinStatus(postId: number, isPinned: boolean): Observable<ApiResponse<string>> {
    const params = new HttpParams().set('isPinned', isPinned.toString());
    return this.http.put<ApiResponse<string>>(
      `${this.apiUrl}/admin/posts/${postId}/pin`,
      {},
      { params, withCredentials: true }
    );
  }

  /**
   * PUT /api/admin/posts/{postId}/hot?isHot={true|false}
   */
  updatePostHotStatus(postId: number, isHot: boolean): Observable<ApiResponse<string>> {
    const params = new HttpParams().set('isHot', isHot.toString());
    return this.http.put<ApiResponse<string>>(
      `${this.apiUrl}/admin/posts/${postId}/hot`,
      {},
      { params, withCredentials: true }
    );
  }

  /**
   * GET /api/admin/posts/{postId}
   */
  getPostDetails(postId: number): Observable<ApiResponse<PostModeration>> {
    return this.http.get<ApiResponse<PostModeration>>(
      `${this.apiUrl}/admin/posts/${postId}`,
      { withCredentials: true }
    );
  }
}

export interface PostAuthor {
  id: number;
  fullName: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface PostModeration {
  id: number;
  title: string;
  content: string;
  categoryName: string;
  author: PostAuthor;
  views: number;
  replyCount: number;
  isActive: boolean;
  isPinned: boolean;
  isHot: boolean;
  createdAt: string;
  updatedAt?: string;
  violationReason?: string;
  isReported?: boolean;
  reportCount?: number;
  reportReasons?: string[];
  [key: string]: unknown;
}

