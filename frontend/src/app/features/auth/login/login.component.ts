import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CustomInputComponent, CheckboxComponent, ButtonComponent } from '../../../shared/components';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CustomInputComponent, CheckboxComponent, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  showPassword = false;
  submitted = false;
  isLoading = false;
  errorMessage = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;
    this.isLoading = true;

    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('API error, falling back or displaying message:', err);
        // If error message returned by backend
        if (err?.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err?.status === 0 || err?.status === 404) {
          // If server is not running, log in with mock data for local frontend demo
          this.authService.setMockUser({
            name: email.split('@')[0],
            email: email
          });
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.';
        }
      }
    });
  }

  onSocialLogin(provider: string): void {
    console.log(`Đăng nhập qua ${provider}`);
    this.authService.setMockUser({
      name: 'Nguyen Van A',
      email: 'test123@gmail.com'
    });
    this.router.navigate(['/']);
  }
}

