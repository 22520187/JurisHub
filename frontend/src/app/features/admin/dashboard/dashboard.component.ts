import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  // Can simulate loading / error / normal state for demo
  isLoading = signal(false);
  hasError = signal(false);
  errorMessage = signal('Request failed with status code 500');

  readonly stats: StatCard[] = [
    {
      title: 'Tổng người dùng',
      value: '1,284',
      change: '+12.5%',
      isPositive: true,
      icon: 'people'
    },
    {
      title: 'Luật sư xác thực',
      value: '142',
      change: '+4.2%',
      isPositive: true,
      icon: 'shield-check'
    },
    {
      title: 'Bài viết diễn đàn',
      value: '3,892',
      change: '+18.1%',
      isPositive: true,
      icon: 'file-text'
    },
    {
      title: 'Báo cáo vi phạm',
      value: '18',
      change: '-5.0%',
      isPositive: false,
      icon: 'alert-triangle'
    }
  ];

  onRetry(): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.hasError.set(false);
    }, 600);
  }
}
