import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { LawyersComponent } from './lawyers/lawyers.component';
import { PostsComponent } from './posts/posts.component';
import { ViolationsComponent } from './violations/violations.component';
import { CategoriesComponent } from './categories/categories.component';
import { AnalyticsComponent } from './analytics/analytics.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, title: 'Dashboard - Admin Panel' },
      { path: 'users', component: UsersComponent, title: 'Quản lý người dùng - Admin Panel' },
      { path: 'lawyers', component: LawyersComponent, title: 'Quản lý luật sư - Admin Panel' },
      { path: 'posts', component: PostsComponent, title: 'Quản lý bài viết - Admin Panel' },
      { path: 'violations', component: ViolationsComponent, title: 'Báo cáo vi phạm - Admin Panel' },
      { path: 'categories', component: CategoriesComponent, title: 'Danh mục pháp luật - Admin Panel' },
      { path: 'analytics', component: AnalyticsComponent, title: 'Báo cáo & Phân tích - Admin Panel' }
    ]
  }
];
