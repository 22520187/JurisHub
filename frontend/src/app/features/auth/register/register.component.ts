import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CustomInputComponent, CheckboxComponent, ButtonComponent } from '../../../shared/components';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CustomInputComponent, CheckboxComponent, ButtonComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    agreeTerms: [false, [Validators.requiredTrue]]
  }, {
    validators: this.passwordMatchValidator
  });

  showPassword = false;
  showConfirmPassword = false;
  submitted = false;
  isLoading = false;
  errorMessage = '';
  activeSlide = 0;

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (this.registerForm.invalid) {
      return;
    }

    const { fullName, email, password } = this.registerForm.value;
    this.isLoading = true;

    this.authService.register({ fullName, email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Upon successful registration, session is set and navigate home
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Register error:', err);
        if (err?.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err?.status === 0 || err?.status === 404) {
          // If server is not running or unreachable, fallback demo mock user
          this.authService.setMockUser({
            name: fullName,
            email: email
          });
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.';
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

