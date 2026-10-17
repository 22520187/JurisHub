import { Injectable, signal } from '@angular/core';
import { ToastType } from '../../shared/components/toast-message/toast-message.component';

export interface ToastConfig {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastState extends ToastConfig {
  visible: boolean;
  type: ToastType;
  title: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastSignal = signal<ToastState | null>(null);

  readonly toast = this.toastSignal.asReadonly();

  show(config: ToastConfig): void {
    this.toastSignal.set({
      visible: true,
      type: config.type || 'info',
      title: config.title ?? (config.type === 'error' ? 'Lỗi' : config.type === 'warning' ? 'Cảnh báo' : 'Thông báo'),
      message: config.message,
      duration: config.duration ?? 4
    });
  }

  success(message: string, title: string = 'Thành công', duration: number = 4): void {
    this.show({ type: 'success', title, message, duration });
  }

  error(message: string, title: string = 'Lỗi', duration: number = 4): void {
    this.show({ type: 'error', title, message, duration });
  }

  warning(message: string, title: string = 'Cảnh báo', duration: number = 4): void {
    this.show({ type: 'warning', title, message, duration });
  }

  info(message: string, title: string = 'Thông báo', duration: number = 4): void {
    this.show({ type: 'info', title, message, duration });
  }

  hide(): void {
    this.toastSignal.set(null);
  }
}
