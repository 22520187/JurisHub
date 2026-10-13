import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { AdminService, AdminDashboardStats } from '../../../core/services/admin.service';
import { ButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BaseChartDirective,
    ButtonComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  stats = signal<AdminDashboardStats | null>(null);

  // Line Chart: Tăng trưởng theo tháng
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { family: 'inherit', size: 12, weight: 500 }
        }
      },
      tooltip: {
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        border: { dash: [4, 4] },
        ticks: { font: { family: 'inherit', size: 12 }, color: '#64748b' }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        border: { dash: [4, 4] },
        ticks: { font: { family: 'inherit', size: 12 }, color: '#64748b' }
      }
    }
  };

  // Bar Chart: Hoạt động theo tuần
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 2,
          padding: 20,
          font: { family: 'inherit', size: 12, weight: 500 }
        }
      },
      tooltip: {
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'inherit', size: 12 }, color: '#64748b' }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        border: { dash: [4, 4] },
        ticks: { font: { family: 'inherit', size: 12 }, color: '#64748b' }
      }
    }
  };

  // Pie Chart: Phân bố người dùng
  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: []
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { padding: 10, cornerRadius: 8 }
    }
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.data) {
          this.stats.set(res.data);
          this.updateCharts(res.data);
        } else {
          this.stats.set(null);
          this.resetCharts();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.hasError.set(true);
        this.errorMessage.set(err?.error?.message || 'Không thể kết nối đến máy chủ để lấy dữ liệu.');
        this.stats.set(null);
        this.resetCharts();
        this.cdr.markForCheck();
      }
    });
  }

  private resetCharts(): void {
    this.lineChartData = { labels: [], datasets: [] };
    this.barChartData = { labels: [], datasets: [] };
    this.pieChartData = { labels: [], datasets: [] };
  }

  private updateCharts(data: AdminDashboardStats): void {
    // 1. Monthly growth
    if (data.monthlyGrowth && data.monthlyGrowth.length > 0) {
      const labels = data.monthlyGrowth.map((m, index) => {
        if (m.month && m.month.startsWith('T')) return m.month;
        return `T${index + 1}`;
      });

      this.lineChartData = {
        labels: labels,
        datasets: [
          {
            data: data.monthlyGrowth.map(m => m.posts),
            label: 'Bài viết',
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#10b981',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4
          },
          {
            data: data.monthlyGrowth.map(m => m.lawyers),
            label: 'Luật sư',
            borderColor: '#a855f7',
            backgroundColor: 'transparent',
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#a855f7',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4
          },
          {
            data: data.monthlyGrowth.map(m => m.users),
            label: 'Người dùng',
            borderColor: '#3b82f6',
            backgroundColor: 'transparent',
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#3b82f6',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4
          }
        ]
      };
    } else {
      this.lineChartData = { labels: [], datasets: [] };
    }

    // 2. Weekly activity
    if (data.weeklyActivity && data.weeklyActivity.length > 0) {
      const dayLabels = data.weeklyActivity.map(w => {
        if (w.day.includes('2')) return 'T2';
        if (w.day.includes('3')) return 'T3';
        if (w.day.includes('4')) return 'T4';
        if (w.day.includes('5')) return 'T5';
        if (w.day.includes('6')) return 'T6';
        if (w.day.includes('7')) return 'T7';
        if (w.day.toLowerCase().includes('chủ') || w.day.toLowerCase().includes('sunday') || w.day.includes('CN')) return 'CN';
        return w.day;
      });

      this.barChartData = {
        labels: dayLabels,
        datasets: [
          {
            data: data.weeklyActivity.map(w => w.posts),
            label: 'Bài viết',
            backgroundColor: '#3b82f6',
            borderRadius: 4
          },
          {
            data: data.weeklyActivity.map(w => w.views),
            label: 'Lượt xem',
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            data: data.weeklyActivity.map(w => w.replies),
            label: 'Trả lời',
            backgroundColor: '#a855f7',
            borderRadius: 4
          }
        ]
      };
    } else {
      this.barChartData = { labels: [], datasets: [] };
    }

    // 3. User roles pie
    let userCount = 0;
    let lawyerCount = 0;
    if (data.usersByRole && data.usersByRole.length > 0) {
      data.usersByRole.forEach(r => {
        const roleName = (r.role || '').toUpperCase();
        if (roleName === 'LAWYER') lawyerCount += r.count;
        else if (roleName === 'USER') userCount += r.count;
      });
    }

    if (userCount === 0 && data.totalUsers) userCount = data.totalUsers;
    if (lawyerCount === 0 && data.totalLawyers) lawyerCount = data.totalLawyers;

    if (userCount > 0 || lawyerCount > 0) {
      this.pieChartData = {
        labels: ['Người dùng', 'Luật sư'],
        datasets: [
          {
            data: [userCount, lawyerCount],
            backgroundColor: ['#3b82f6', '#8b5cf6'],
            borderWidth: 1,
            borderColor: '#ffffff'
          }
        ]
      };
    } else {
      this.pieChartData = { labels: [], datasets: [] };
    }
  }

  onRetry(): void {
    this.loadData();
  }
}
