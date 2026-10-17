import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

export interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
  phoneNumber?: string;
  role?: string;
  authProvider?: string;
  bio?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthResponse {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatar?: string;
  role?: string;
  authProvider?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = environment.apiUrl;
  private readonly STORAGE_KEY = 'jurishub_user';

  private isHandlingSessionExpiry = false;

  // State signals
  private currentUserSignal = signal<UserProfile | null>(this.getStoredUser());

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);

  constructor() {
    // Check session validity with backend on app init
    this.checkSession();
  }

  private getStoredUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private calculateInitials(nameOrEmail: string): string {
    if (!nameOrEmail) return 'NV';
    const clean = nameOrEmail.trim();
    if (!clean) return 'NV';

    // If it's an email, take the part before @
    const namePart = clean.includes('@') ? clean.split('@')[0] : clean;
    const words = namePart.split(/\s+/).filter(w => w.length > 0);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    // Take first letter of first word and first letter of second word (e.g. Nguyen Van -> NV)
    const first = words[0][0];
    const second = words[1][0];
    return (first + second).toUpperCase();
  }

  private mapAuthResponseToProfile(data: AuthResponse): UserProfile {
    const fullName = data.fullName || data.email.split('@')[0];
    return {
      id: data.id,
      name: fullName,
      email: data.email,
      initials: this.calculateInitials(fullName),
      avatarUrl: data.avatar,
      phoneNumber: data.phoneNumber,
      role: data.role,
      authProvider: data.authProvider
    };
  }

  private setUserProfile(profile: UserProfile): void {
    this.currentUserSignal.set(profile);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving user profile to storage:', e);
    }
  }

  private clearUserProfile(): void {
    this.currentUserSignal.set(null);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error('Error removing user profile from storage:', e);
    }
  }

  /**
   * Handle expired session: clear state, show toast notification, and auto logout/redirect
   */
  handleSessionExpired(): void {
    if (this.isHandlingSessionExpiry) return;
    this.isHandlingSessionExpiry = true;

    const hadUser = !!this.currentUserSignal();
    this.clearUserProfile();

    if (hadUser) {
      this.toastService.warning(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        'Hết phiên làm việc'
      );
    }

    // Call backend logout to clear any server-side cookies/session
    this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(null))
    ).subscribe();

    // Redirect to login page if on protected or non-auth route
    const currentUrl = this.router.url;
    if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
      this.router.navigate(['/login']);
    }

    setTimeout(() => {
      this.isHandlingSessionExpiry = false;
    }, 1500);
  }

  /**
   * Check current authenticated session with backend GET /api/auth/me
   */
  checkSession(): void {
    const hadSession = !!this.currentUserSignal();

    this.getMe().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const profile = this.mapAuthResponseToProfile(res.data);
          this.setUserProfile(profile);
        } else if (hadSession) {
          this.handleSessionExpired();
        }
      },
      error: (err) => {
        // If 401 Unauthorized or 403 Forbidden, session has expired on backend
        if (err.status === 401 || err.status === 403) {
          if (hadSession) {
            this.handleSessionExpired();
          } else {
            this.clearUserProfile();
          }
        } else {
          // If server is unreachable in dev environment, log warning and preserve offline state
          console.warn('Backend session check unavailable:', err);
        }
      }
    });
  }

  /**
   * POST /api/auth/login
   */
  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/auth/login`,
      request,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const profile = this.mapAuthResponseToProfile(response.data);
          this.setUserProfile(profile);
        }
      }),
      catchError(err => {
        // If backend server is down or error, provide fallback simulation for testing if needed
        console.error('Login API error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * POST /api/auth/register
   */
  register(request: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/auth/register`,
      request,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const profile = this.mapAuthResponseToProfile(response.data);
          this.setUserProfile(profile);
        }
      })
    );
  }

  /**
   * POST /api/auth/logout
   */
  logout(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.apiUrl}/auth/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.clearUserProfile();
      }),
      catchError(err => {
        // Always clear client-side state on logout even if backend errors out
        this.clearUserProfile();
        return of({ success: true, data: 'Logged out locally' });
      })
    );
  }

  /**
   * GET /api/auth/me
   */
  getMe(): Observable<ApiResponse<AuthResponse>> {
    return this.http.get<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const profile = this.mapAuthResponseToProfile(response.data);
          this.setUserProfile(profile);
        }
      })
    );
  }

  /**
   * Helper mock login (useful for direct demo or fallback)
   */
  setMockUser(user?: Partial<UserProfile>): void {
    const defaultUser: UserProfile = {
      id: 1,
      name: 'Nguyen Van A',
      email: 'test123@gmail.com',
      initials: 'NV',
      role: 'USER'
    };
    const profile: UserProfile = {
      ...defaultUser,
      ...user,
      initials: this.calculateInitials(user?.name || defaultUser.name)
    };
    this.setUserProfile(profile);
  }

  /**
   * Update current user profile and sync to storage
   */
  updateUserProfile(updated: Partial<UserProfile>): UserProfile {
    const current = this.currentUserSignal() || {
      id: 1,
      name: 'Nguyen Van A',
      email: 'test123@gmail.com',
      initials: 'NV',
      role: 'USER'
    };
    const newName = updated.name !== undefined ? updated.name : current.name;
    const profile: UserProfile = {
      ...current,
      ...updated,
      initials: this.calculateInitials(newName)
    };
    this.setUserProfile(profile);
    return profile;
  }
}
