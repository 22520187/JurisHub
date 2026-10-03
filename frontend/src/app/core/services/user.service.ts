import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';

export interface UserProfileDto {
  id: number;
  email: string;
  fullName: string;
  avatar?: string;
  role?: string;
  postCount?: number;
  replyCount?: number;
  activityCount?: number;
  viewsCount?: number;
  joinedAt?: string;
  phoneNumber?: string;
  bio?: string;
  legalExpertise?: string[];
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
  avatar?: string;
  legalExpertise?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getUserProfile(userId: number | string): Observable<ApiResponse<UserProfileDto>> {
    return this.http.get<ApiResponse<UserProfileDto>>(
      `${this.apiUrl}/users/${userId}`,
      { withCredentials: true }
    );
  }

  updateProfile(userId: number | string, request: UpdateProfileRequest): Observable<ApiResponse<UserProfileDto>> {
    return this.http.put<ApiResponse<UserProfileDto>>(
      `${this.apiUrl}/users/${userId}`,
      request,
      { withCredentials: true }
    );
  }

  getUserPosts(userId: number | string, page = 0, size = 10): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/users/${userId}/posts?page=${page}&size=${size}`,
      { withCredentials: true }
    );
  }
}
