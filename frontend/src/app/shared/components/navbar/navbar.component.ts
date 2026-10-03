import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isDropdownOpen: boolean = false;

  toggleDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-avatar-wrapper')) {
      this.closeDropdown();
    }
  }

  navigateToLogin(): void {
    this.closeDropdown();
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.closeDropdown();
    this.router.navigate(['/register']);
  }

  onNavigate(route: string): void {
    this.closeDropdown();
    this.router.navigate([route]);
  }

  onLogout(): void {
    this.closeDropdown();
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  onQuickAction(type: string): void {
    if (type === 'ai-lawyer') {
      this.router.navigate(['/chat']);
    } else if (type === 'faq') {
      this.router.navigate(['/chat-pdf']);
    }
  }
}

