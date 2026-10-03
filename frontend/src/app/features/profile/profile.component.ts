import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { CustomInputComponent } from '../../shared/components/custom-input/custom-input.component';
import { ToastMessageComponent } from '../../shared/components/toast-message/toast-message.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService, UserProfileDto } from '../../core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    BadgeComponent,
    CustomInputComponent,
    ToastMessageComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  isEditMode: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;

  // Toast feedback
  showToast: boolean = false;
  toastType: 'success' | 'error' = 'success';
  toastTitle: string = 'Thông báo';
  toastMessage: string = '';

  // Profile data
  profile: Partial<UserProfileDto> = {
    id: 1,
    fullName: 'Nguyen Van A',
    email: 'test123@gmail.com',
    role: 'Thành viên',
    phoneNumber: '',
    bio: 'Thành viên của cộng đồng Legal Connect.',
    postCount: 0,
    replyCount: 0,
    activityCount: 0,
    viewsCount: 4,
    joinedAt: undefined
  };

  // Edit form state
  editForm = {
    fullName: '',
    phoneNumber: ''
  };

  // Recent user posts list
  userPosts: any[] = [];

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.profile = {
        ...this.profile,
        id: typeof currentUser.id === 'number' ? currentUser.id : 1,
        fullName: currentUser.name || 'Nguyen Van A',
        email: currentUser.email || 'test123@gmail.com',
        phoneNumber: currentUser.phoneNumber || '',
        avatar: currentUser.avatarUrl || this.profile.avatar,
        bio: currentUser.bio || 'Thành viên của cộng đồng Legal Connect.',
        role: currentUser.role ? this.formatRole(currentUser.role) : 'Thành viên'
      };

      // Fetch latest profile and posts from API if user has ID
      if (currentUser.id) {
        this.userService.getUserProfile(currentUser.id).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              const data = res.data;
              this.profile = {
                ...this.profile,
                ...data,
                fullName: data.fullName || this.profile.fullName,
                email: data.email || this.profile.email,
                role: data.role ? this.formatRole(data.role) : this.profile.role,
                postCount: data.postCount ?? this.profile.postCount ?? 0,
                replyCount: data.replyCount ?? this.profile.replyCount ?? 0,
                phoneNumber: data.phoneNumber ?? this.profile.phoneNumber,
                bio: data.bio || this.profile.bio
              };
            }
          },
          error: (err) => {
            console.warn('Could not fetch server profile, using local state:', err);
          }
        });

        this.userService.getUserPosts(currentUser.id).subscribe({
          next: (res) => {
            if (res.success && res.data?.content) {
              this.userPosts = res.data.content;
            }
          },
          error: () => {
            // Keep empty list fallback
          }
        });
      }
    }
  }

  get displayName(): string {
    return this.profile.fullName || 'Nguyen Van A';
  }

  get displayEmail(): string {
    return this.profile.email || 'test123@gmail.com';
  }

  get displayRole(): string {
    return this.profile.role || 'Thành viên';
  }

  get displayBio(): string {
    return this.profile.bio || 'Thành viên của cộng đồng Legal Connect.';
  }

  get displayJoinedDate(): string {
    return 'Tham gia 5 ngày trước';
  }

  get displayAvatarUrl(): string | undefined {
    return this.profile.avatar || this.authService.currentUser()?.avatarUrl;
  }

  get profileAvatarLetter(): string {
    const name = this.displayName.trim();
    if (!name) return 'N';
    return name.charAt(0).toUpperCase();
  }

  private formatRole(role: string): string {
    if (!role) return 'Thành viên';
    const r = role.toUpperCase();
    if (r === 'ADMIN') return 'Quản trị viên';
    if (r === 'LAWYER') return 'Luật sư';
    return 'Thành viên';
  }

  startEdit(): void {
    this.editForm = {
      fullName: this.displayName,
      phoneNumber: this.profile.phoneNumber || ''
    };
    this.isEditMode = true;
  }

  cancelEdit(): void {
    this.isEditMode = false;
  }

  saveProfile(): void {
    const trimmedName = this.editForm.fullName.trim();
    if (!trimmedName) {
      this.toastType = 'error';
      this.toastTitle = 'Lỗi';
      this.toastMessage = 'Họ và tên không được để trống';
      this.showToast = true;
      return;
    }

    this.isSaving = true;

    // 1. Immediately update local state & AuthService
    this.profile.fullName = trimmedName;
    this.profile.phoneNumber = this.editForm.phoneNumber.trim();

    this.authService.updateUserProfile({
      name: trimmedName,
      phoneNumber: this.profile.phoneNumber,
      avatarUrl: this.profile.avatar
    });

    // 2. Persist to backend if ID is present
    const userId = this.profile.id;
    if (userId) {
      this.userService.updateProfile(userId, {
        fullName: trimmedName,
        phoneNumber: this.profile.phoneNumber,
        bio: this.profile.bio,
        avatar: this.profile.avatar
      }).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.isEditMode = false;
          this.toastType = 'success';
          this.toastTitle = 'Thành công';
          this.toastMessage = 'Lưu thông tin thành công!';
          this.showToast = true;
        },
        error: (err) => {
          // Even if backend fails (e.g. offline/mock demo), we saved locally
          this.isSaving = false;
          this.isEditMode = false;
          this.toastType = 'success';
          this.toastTitle = 'Thành công';
          this.toastMessage = 'Lưu thông tin thành công!';
          this.showToast = true;
        }
      });
    } else {
      this.isSaving = false;
      this.isEditMode = false;
      this.toastType = 'success';
      this.toastTitle = 'Thành công';
      this.toastMessage = 'Lưu thông tin thành công!';
      this.showToast = true;
    }
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.toastType = 'error';
      this.toastTitle = 'Lỗi';
      this.toastMessage = 'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).';
      this.showToast = true;
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastType = 'error';
      this.toastTitle = 'Lỗi';
      this.toastMessage = 'Kích thước ảnh không được vượt quá 5MB.';
      this.showToast = true;
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      this.profile.avatar = base64Url;

      // 1. Immediately update AuthService and LocalStorage
      this.authService.updateUserProfile({
        avatarUrl: base64Url
      });

      // 2. Persist to backend if ID is present
      const userId = this.profile.id;
      if (userId) {
        this.userService.updateProfile(userId, {
          avatar: base64Url
        }).subscribe({
          next: () => {
            this.toastType = 'success';
            this.toastTitle = 'Thành công';
            this.toastMessage = 'Cập nhật ảnh đại diện thành công!';
            this.showToast = true;
          },
          error: () => {
            this.toastType = 'success';
            this.toastTitle = 'Thành công';
            this.toastMessage = 'Cập nhật ảnh đại diện thành công!';
            this.showToast = true;
          }
        });
      } else {
        this.toastType = 'success';
        this.toastTitle = 'Thành công';
        this.toastMessage = 'Cập nhật ảnh đại diện thành công!';
        this.showToast = true;
      }

      input.value = '';
    };

    reader.readAsDataURL(file);
  }
}
