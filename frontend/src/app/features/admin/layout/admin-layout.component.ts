import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AdminSidebarComponent } from '../components/admin-sidebar/admin-sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AdminSidebarComponent,
    ButtonComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUrl = this.router.url;
  isLoading = false;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects || event.url;
      });
  }

  get user() {
    return this.authService.currentUser();
  }

  isAdmin(role?: string): boolean {
    return role?.toLowerCase() === 'admin';
  }

  get isAuthorized(): boolean {
    const user = this.user;
    if (!user) return false;
    return this.isAdmin(user.role);
  }

  get pageTitle(): string {
    const url = this.currentUrl;
    if (url.includes('/admin/users')) return 'Quản lý người dùng';
    if (url.includes('/admin/lawyers')) return 'Quản lý luật sư';
    if (url.includes('/admin/posts')) return 'Quản lý bài viết';
    if (url.includes('/admin/violations')) return 'Báo cáo vi phạm';
    if (url.includes('/admin/categories')) return 'Danh mục pháp luật';
    if (url.includes('/admin/analytics')) return 'Báo cáo & Phân tích';
    if (url === '/admin' || url.includes('/admin/dashboard')) return 'Dashboard';
    return 'Quản trị hệ thống';
  }

  get userInitials(): string {
    if (this.user?.initials) return this.user.initials;
    if (this.user?.name) {
      const parts = this.user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'NV';
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Helper for development environment to quickly preview admin panel
   */
  setDemoAdminSession(): void {
    this.authService.setMockUser({
      name: 'Nguyen Van Admin',
      email: 'admin@jurishub.vn',
      role: 'ADMIN',
      initials: 'NV'
    });
  }
}
