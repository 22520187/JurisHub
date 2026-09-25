import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  ButtonComponent,
  BadgeComponent,
  ConfirmPopupComponent,
  ToastMessageComponent,
  LoadingSpinnerComponent,
  ModalCustomComponent
} from '../../shared/components';
import {
  ChatPdfService,
  PdfConversation,
  PdfChatMessage,
  PdfDocument
} from '../../core/services/chat-pdf.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chat-pdf',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    BadgeComponent,
    ConfirmPopupComponent,
    ToastMessageComponent,
    LoadingSpinnerComponent,
    ModalCustomComponent
  ],
  templateUrl: './chat-pdf.component.html',
  styleUrl: './chat-pdf.component.scss'
})
export class ChatPdfComponent implements OnInit, AfterViewChecked {
  readonly chatPdfService = inject(ChatPdfService);
  readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('messagesContainer') private messagesContainerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') private fileInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('chatTextarea') private chatTextareaRef?: ElementRef<HTMLTextAreaElement>;

  // Input & UI State
  userInput: string = '';
  isSidebarCollapsed: boolean = false;
  searchHistoryQuery: string = '';
  isDraggingFile: boolean = false;

  // Modal / Popup state
  showDeleteConfirm: boolean = false;
  conversationToDelete: PdfConversation | null = null;
  isPreviewModalOpen: boolean = false;

  // Toast state
  toastVisible: boolean = false;
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';
  toastTitle: string = '';
  toastMessage: string = '';

  // Message feedback & copy
  copiedMessageId: string | null = null;
  messageFeedback: Record<string, 'like' | 'dislike'> = {};

  private shouldScrollToBottom: boolean = false;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.authService.login();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  get activeConversation(): PdfConversation | null {
    return this.chatPdfService.activeConversation();
  }

  get currentDocument(): PdfDocument | null {
    return this.activeConversation?.document || null;
  }

  get isAnalyzing(): boolean {
    return !!this.activeConversation?.isAnalyzing;
  }

  get hasDocument(): boolean {
    return !!this.currentDocument;
  }

  get filteredConversations(): PdfConversation[] {
    const list = this.chatPdfService.conversations();
    if (!this.searchHistoryQuery.trim()) {
      return list;
    }
    const q = this.searchHistoryQuery.toLowerCase();
    return list.filter(c => c.title.toLowerCase().includes(q));
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  handleNewChat(): void {
    this.chatPdfService.createNewConversation();
    this.userInput = '';
    this.showToast('success', 'Phiên làm việc mới', 'Vui lòng tải lên tài liệu PDF để bắt đầu.');
  }

  handleSelectChat(id: string): void {
    this.chatPdfService.selectConversation(id);
    this.shouldScrollToBottom = true;
  }

  // Trigger file input dialog
  triggerFileInput(): void {
    this.fileInputRef?.nativeElement?.click();
  }

  // File chosen via input
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processFile(file);
    }
    // Reset value so re-uploading same file works
    input.value = '';
  }

  // Drag & drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        this.processFile(file);
      } else {
        this.showToast('error', 'Định dạng không hợp lệ', 'Vui lòng chỉ tải lên tài liệu có định dạng PDF.');
      }
    }
  }

  // Quick sample file selection
  selectSampleFile(sampleName: string, size: string, pages: number): void {
    this.chatPdfService.attachPdfAndSummarize({
      name: sampleName,
      size: size,
      pages: pages
    });
    this.showToast('info', 'Đang xử lý tài liệu', `Đang phân tích và tóm tắt "${sampleName}"...`);
    this.shouldScrollToBottom = true;
  }

  private processFile(file: File): void {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    // Estimate page count based on size for realistic simulation
    const estimatedPages = Math.max(3, Math.min(60, Math.round(file.size / 70000)));

    this.chatPdfService.attachPdfAndSummarize({
      name: file.name,
      size: sizeInMB,
      pages: estimatedPages
    });

    this.showToast('info', 'Đang phân tích', `Hệ thống đang tự động trích xuất và tóm tắt văn bản "${file.name}"...`);
    this.shouldScrollToBottom = true;
  }

  // Delete conversation modal
  openDeleteModal(conv: PdfConversation, event: MouseEvent): void {
    event.stopPropagation();
    this.conversationToDelete = conv;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (this.conversationToDelete) {
      const title = this.conversationToDelete.title;
      this.chatPdfService.deleteConversation(this.conversationToDelete.id);
      this.showToast('info', 'Đã xóa hội thoại', `Đã xóa cuộc trò chuyện "${title}".`);
    }
    this.showDeleteConfirm = false;
    this.conversationToDelete = null;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.conversationToDelete = null;
  }

  // Remove document from current chat
  removeCurrentDocument(): void {
    this.chatPdfService.removeDocumentFromActiveChat();
    this.showToast('info', 'Đã gỡ tài liệu', 'Bạn có thể tải lên tài liệu PDF mới.');
  }

  // Download simulation
  downloadDocument(): void {
    if (!this.currentDocument) return;
    this.showToast('success', 'Tải tài liệu', `Đang tải xuống "${this.currentDocument.name}"...`);
  }

  // Preview modal
  openPreviewModal(): void {
    this.isPreviewModalOpen = true;
  }

  closePreviewModal(): void {
    this.isPreviewModalOpen = false;
  }

  // Send message
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage(): Promise<void> {
    const query = this.userInput.trim();
    if (!query || this.isAnalyzing || this.chatPdfService.isAiThinking()) {
      return;
    }

    this.userInput = '';
    this.shouldScrollToBottom = true;
    this.resetTextareaHeight();

    await this.chatPdfService.sendUserQuestion(query);
    this.shouldScrollToBottom = true;
  }

  // Quick ask suggested prompt
  askSampleQuestion(prompt: string): void {
    this.userInput = prompt;
    this.sendMessage();
  }

  copyMessage(content: string, id: string): void {
    navigator.clipboard.writeText(content).then(() => {
      this.copiedMessageId = id;
      this.showToast('success', 'Đã sao chép', 'Nội dung phản hồi đã được lưu vào bộ nhớ tạm.');
      setTimeout(() => {
        if (this.copiedMessageId === id) {
          this.copiedMessageId = null;
          this.cdr.markForCheck();
        }
      }, 2500);
    });
  }

  setFeedback(id: string, type: 'like' | 'dislike'): void {
    if (this.messageFeedback[id] === type) {
      delete this.messageFeedback[id];
    } else {
      this.messageFeedback[id] = type;
      this.showToast('info', 'Ghi nhận phản hồi', 'Cảm ơn bạn đã phản hồi chất lượng câu trả lời!');
    }
  }

  onTextareaInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  private resetTextareaHeight(): void {
    if (this.chatTextareaRef) {
      this.chatTextareaRef.nativeElement.style.height = 'auto';
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainerRef) {
      const el = this.messagesContainerRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  private showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string): void {
    this.toastType = type;
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastVisible = true;
  }

  formatMessageContent(content: string): string {
    if (!content) return '';

    let formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h4 class="ai-section-title">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 class="ai-main-title">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
      .replace(/^- (.*$)/gim, '<li class="ai-list-item">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ai-list-item-numbered" value="$1">$2</li>');

    formatted = formatted.replace(/(<li class="ai-list-item">.*?<\/li>)+/gis, '<ul class="ai-bullet-list">$&</ul>');
    formatted = formatted.replace(/(<li class="ai-list-item-numbered".*?<\/li>)+/gis, '<ol class="ai-numbered-list">$&</ol>');
    formatted = formatted.replace(/\n\n/g, '<div class="ai-paragraph-break"></div>');

    return formatted;
  }
}
