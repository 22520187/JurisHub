import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';

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
}
