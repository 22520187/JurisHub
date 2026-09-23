import { Injectable, signal, computed } from '@angular/core';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'jurishub_user';

  // State signals
  private currentUserSignal = signal<UserProfile | null>(this.getStoredUser());

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);

  constructor() {}

  private getStoredUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  login(user?: UserProfile): void {
    const defaultUser: UserProfile = {
      id: 'usr_1',
      name: 'Nguyễn Văn',
      email: 'nguyenvan@example.com',
      initials: 'NV',
      role: 'User'
    };
    const loggedUser = user || defaultUser;
    this.currentUserSignal.set(loggedUser);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(loggedUser));
    } catch (e) {
      console.error(e);
    }
  }

  logout(): void {
    this.currentUserSignal.set(null);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  }

  toggleAuthState(): void {
    if (this.isLoggedIn()) {
      this.logout();
    } else {
      this.login();
    }
  }
}
