import { Component, OnInit, inject, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  ForumService,
  PostDetailItem,
  PostReplyItem,
  PostAuthor
} from '../../../core/services/forum.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastMessageComponent } from '../../../shared/components';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToastMessageComponent
  ],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly forumService = inject(ForumService);
  readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('replyTextarea') replyTextareaRef!: ElementRef<HTMLTextAreaElement>;

  postId: string | number = '';
  post: PostDetailItem | null = null;
  replies: PostReplyItem[] = [];
  isLoading: boolean = true;
  isSaved: boolean = false;

  // Comment / Reply Form state
  replyContent: string = '';
  replyingTo: PostReplyItem | null = null;
  isSubmitting: boolean = false;

  // Undo / Redo history for editor
  private historyStack: string[] = [];
  private redoStack: string[] = [];

  // Toast
  showToast: boolean = false;
  toastType: 'success' | 'error' = 'success';
  toastMessage: string = '';

  // Report Modal
  isReportModalOpen: boolean = false;
  reportReason: string = 'Spam hoặc quảng cáo trái phép';
  reportDetails: string = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const categorySlug = params.get('categorySlug');
      const postSlug = params.get('postSlug');
      const id = params.get('id');

      if (categorySlug && postSlug) {
        this.loadPostBySlug(categorySlug, postSlug);
      } else if (postSlug) {
        this.loadPostBySlug('kinh-doanh', postSlug);
      } else if (id) {
        this.loadPostById(id);
      } else {
        this.loadPostBySlug('kinh-doanh', 'thu-tuc-thanh-lap-cong-ty-tnhh-2-thanh-vien-va-cac-nghia-vu-thue-trong-nam-dau-tien');
      }
    });
  }

  loadPostBySlug(categorySlug: string, postSlug: string): void {
    this.isLoading = true;
    this.forumService.getPostBySlug(categorySlug, postSlug).subscribe({
      next: (postData) => {
        this.post = postData;
        this.postId = postData.id;
        this.isSaved = this.forumService.isPostSaved(postData.id);
        this.isLoading = false;
        this.loadReplies(postData.id);
        this.forumService.incrementPostViews(categorySlug, postSlug).subscribe({
          error: () => {}
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi khi tải chi tiết bài viết theo slug:', err);
        this.post = null;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadPostById(id: string | number): void {
    this.isLoading = true;
    this.postId = id;
    this.isSaved = this.forumService.isPostSaved(id);

    this.forumService.getPostDetail(id).subscribe({
      next: (postData) => {
        this.post = postData;
        this.isLoading = false;
        this.loadReplies(postData.id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi khi tải chi tiết bài viết:', err);
        this.post = null;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadReplies(postId: string | number): void {
    this.forumService.getPostReplies(postId).subscribe({
      next: (repliesList) => {
        this.replies = repliesList;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi khi tải câu trả lời:', err);
        this.replies = [];
        this.cdr.markForCheck();
      }
    });
  }

  toggleSave(): void {
    if (!this.post) return;
    this.isSaved = this.forumService.toggleSavePost(this.post.id);
    this.triggerToast(
      'success',
      this.isSaved ? 'Đã lưu bài viết vào mục Đã lưu' : 'Đã bỏ lưu bài viết'
    );
  }

  setReplyingTo(reply: PostReplyItem): void {
    this.replyingTo = reply;
    this.saveEditorHistory();

    // Scroll smoothly to editor
    setTimeout(() => {
      const editorElement = document.getElementById('reply-editor-box');
      if (editorElement) {
        editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (this.replyTextareaRef) {
        this.replyTextareaRef.nativeElement.focus();
      }
    }, 100);
  }

  cancelReplying(): void {
    this.replyingTo = null;
  }

  applyFormat(formatType: string): void {
    const textarea = this.replyTextareaRef?.nativeElement;
    if (!textarea) return;

    this.saveEditorHistory();

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    let replacement = '';

    switch (formatType) {
      case 'bold':
        replacement = `**${selected || 'Văn bản in đậm'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'Văn bản in nghiêng'}*`;
        break;
      case 'heading':
        replacement = `\n## ${selected || 'Tiêu đề'}\n`;
        break;
      case 'ul':
        replacement = `\n- ${selected || 'Mục danh sách'}\n`;
        break;
      case 'ol':
        replacement = `\n1. ${selected || 'Mục số'}\n`;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'Đoạn trích dẫn'}\n`;
        break;
      case 'link':
        replacement = `[${selected || 'Tên liên kết'}](https://)`;
        break;
      default:
        break;
    }

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    this.replyContent = before + replacement + after;

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      this.cdr.markForCheck();
    }, 0);
  }

  saveEditorHistory(): void {
    if (this.historyStack.length > 20) {
      this.historyStack.shift();
    }
    this.historyStack.push(this.replyContent);
    this.redoStack = [];
  }

  undo(): void {
    if (this.historyStack.length > 0) {
      const prev = this.historyStack.pop()!;
      this.redoStack.push(this.replyContent);
      this.replyContent = prev;
      this.cdr.markForCheck();
    }
  }

  redo(): void {
    if (this.redoStack.length > 0) {
      const next = this.redoStack.pop()!;
      this.historyStack.push(this.replyContent);
      this.replyContent = next;
      this.cdr.markForCheck();
    }
  }

  submitReply(): void {
    const content = this.replyContent.trim();
    if (!content) {
      this.triggerToast('error', 'Vui lòng nhập nội dung câu trả lời!');
      return;
    }

    this.isSubmitting = true;
    const parentId = this.replyingTo ? this.replyingTo.id : null;

    this.forumService.addReply(this.postId, content, parentId).subscribe({
      next: (newReply) => {
        this.replies.push(newReply);
        if (this.post) {
          this.post.replyCount = (this.post.replyCount || 0) + 1;
        }
        this.replyContent = '';
        this.replyingTo = null;
        this.isSubmitting = false;
        this.triggerToast('success', 'Gửi câu trả lời thành công!');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi khi gửi câu trả lời:', err);
        this.isSubmitting = false;
        this.triggerToast('error', 'Có lỗi xảy ra khi gửi trả lời. Vui lòng thử lại!');
        this.cdr.markForCheck();
      }
    });
  }

  openReportModal(): void {
    this.isReportModalOpen = true;
  }

  closeReportModal(): void {
    this.isReportModalOpen = false;
    this.reportDetails = '';
  }

  submitReport(): void {
    this.triggerToast('success', 'Đã ghi nhận báo cáo bài viết. Ban quản trị sẽ kiểm duyệt sớm!');
    this.closeReportModal();
  }

  getRoleLabel(role?: string): string {
    if (!role) return 'Thành viên';
    const r = role.toUpperCase();
    if (r === 'LAWYER') return 'Luật sư';
    if (r === 'ADMIN') return 'Quản trị viên';
    return 'Thành viên';
  }

  isLawyer(role?: string): boolean {
    return role?.toUpperCase() === 'LAWYER';
  }

  getAvatar(author?: PostAuthor): string {
    if (author?.avatar) return author.avatar;
    const name = author?.name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=08544e&color=fff&rounded=true&size=128`;
  }

  formatDateTime(dateStr?: string): string {
    if (!dateStr) return 'Vừa xong';
    try {
      const normalizedStr = dateStr.includes(' ') && !dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr;
      const d = new Date(normalizedStr);
      if (isNaN(d.getTime())) return dateStr;
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  truncateSnippet(text?: string, length = 110): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  private triggerToast(type: 'success' | 'error', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      this.cdr.markForCheck();
    }, 3500);
  }
}
