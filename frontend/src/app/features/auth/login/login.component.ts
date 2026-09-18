import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomInputComponent, CheckboxComponent, ButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CustomInputComponent, CheckboxComponent, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);

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
    alert('Đăng nhập thử nghiệm thành công! (Dữ liệu đã ghi nhận, sẵn sàng kết nối API)');
  }

  onSocialLogin(provider: string): void {
    console.log(`Đăng nhập qua ${provider}`);
  }
}
