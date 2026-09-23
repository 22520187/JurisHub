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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    console.log('Dữ liệu đăng nhập (Chưa gọi API):', this.loginForm.value);
    const email = this.loginForm.value.email;
    const namePart = email.split('@')[0];
    this.authService.login({
      id: 'usr_' + Date.now(),
      name: namePart,
      email: email,
      initials: 'NV',
      role: 'User'
    });
    this.router.navigate(['/']);
  }

  onSocialLogin(provider: string): void {
    console.log(`Đăng nhập qua ${provider}`);
    this.authService.login();
    this.router.navigate(['/']);
  }
}

