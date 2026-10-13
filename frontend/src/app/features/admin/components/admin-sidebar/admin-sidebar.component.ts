import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import {
  ButtonComponent,
  BadgeComponent,
  ConfirmPopupComponent,
  ToastMessageComponent,
  LoadingSpinnerComponent
} from '../../../../shared/components';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    BadgeComponent,
    ConfirmPopupComponent
  ],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  showLogoutModal = false;
  isLoggingOut = false;

  readonly logoutIcon = '<i class="bi bi-box-arrow-right"></i>';

  readonly navItems: NavItem[] = [
    {
      path: '/admin/dashboard',
      label: 'Tổng quan',
      icon: 'dashboard',
      exact: true
    },
    {
      path: '/admin/users',
      label: 'Quản lý người dùng',
      icon: 'users'
    },
    {
      path: '/admin/lawyers',
      label: 'Quản lý luật sư',
      icon: 'lawyers'
    },
    {
      path: '/admin/posts',
      label: 'Quản lý bài viết',
      icon: 'posts'
    },
    {
      path: '/admin/violations',
      label: 'Báo cáo vi phạm',
      icon: 'violations'
    },
    {
      path: '/admin/categories',
      label: 'Danh mục pháp luật',
      icon: 'categories'
    },
    {
      path: '/admin/analytics',
      label: 'Báo cáo & Phân tích',
      icon: 'analytics'
    }
  ];

  get currentUser() {
    return this.authService.currentUser();
  }

  get userInitial(): string {
    const name = this.currentUser?.name;
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'N';
  }

  isRouteActive(path: string): boolean {
    const currentUrl = this.router.url;
    if (path === '/admin/dashboard') {
      return currentUrl === '/admin' || currentUrl.startsWith('/admin/dashboard');
    }
    return currentUrl.startsWith(path);
  }

  onLogout(): void {
    this.showLogoutModal = true;
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  confirmLogout(): void {
    this.showLogoutModal = false;
    this.isLoggingOut = true;
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoggingOut = false;
        this.router.navigate(['/login']);
      }
    });
  }
}
