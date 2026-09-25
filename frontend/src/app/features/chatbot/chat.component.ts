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
  LoadingSpinnerComponent
} from '../../shared/components';
import { ChatService, Conversation, ChatMessage } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';

interface SuggestionPrompt {
  id: string;
  category: 'labor' | 'business' | 'contract' | 'draft';
  title: string;
  description: string;
  iconClass: string;
  iconColor: string;
  bgColor: string;
  fullPrompt: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    BadgeComponent,
    ConfirmPopupComponent,
    ToastMessageComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, AfterViewChecked {
  readonly chatService = inject(ChatService);
  readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('messagesContainer') private messagesContainerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('chatTextarea') private chatTextareaRef?: ElementRef<HTMLTextAreaElement>;

  // Input model
  userInput: string = '';
  isSidebarCollapsed: boolean = false;
  searchHistoryQuery: string = '';

  // Delete modal state
  showDeleteConfirm: boolean = false;
  conversationToDelete: Conversation | null = null;

  // Toast state
  toastVisible: boolean = false;
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';
  toastTitle: string = '';
  toastMessage: string = '';

  // Message feedback tracking
  copiedMessageId: string | null = null;
  messageFeedback: Record<string, 'like' | 'dislike'> = {};

  private shouldScrollToBottom: boolean = false;

  // 4 Suggestion Cards matching the screenshot
  readonly suggestionCards: SuggestionPrompt[] = [
    {
      id: 'labor',
      category: 'labor',
      title: 'Tư vấn luật lao động',
      description: 'Quyền lợi của người lao động khi nghỉ việc theo luật hiện hành là gì?',
      iconClass: 'bi bi-briefcase',
      iconColor: '#ea580c', // Orange
      bgColor: '#fff7ed',
      fullPrompt: 'Quyền lợi của người lao động khi nghỉ việc theo luật hiện hành là gì?'
    },
    {
      id: 'business',
      category: 'business',
      title: 'Thủ tục doanh nghiệp',
      description: 'Hướng dẫn thủ tục đăng ký kinh doanh cho công ty startup công nghệ.',
      iconClass: 'bi bi-buildings',
      iconColor: '#0284c7', // Blue
      bgColor: '#f0f9ff',
      fullPrompt: 'Hướng dẫn thủ tục đăng ký kinh doanh cho công ty startup công nghệ.'
    },
    {
      id: 'contract',
      category: 'contract',
      title: 'Tranh chấp hợp đồng',
      description: 'Tôi cần làm gì khi đối tác vi phạm hợp đồng kinh tế? Cần chuẩn bị hồ sơ gì?',
      iconClass: 'bi bi-bank',
      iconColor: '#9333ea', // Purple
      bgColor: '#faf5ff',
      fullPrompt: 'Tôi cần làm gì khi đối tác vi phạm hợp đồng kinh tế? Cần chuẩn bị hồ sơ gì?'
    },
    {
      id: 'draft',
      category: 'draft',
      title: 'Soạn thảo văn bản',
      description: 'Giúp tôi soạn thảo một mẫu hợp đồng lao động không xác định thời hạn.',
      iconClass: 'bi bi-chat-square-text',
      iconColor: '#16a34a', // Green
      bgColor: '#f0fdf4',
      fullPrompt: 'Giúp tôi soạn thảo một mẫu hợp đồng lao động không xác định thời hạn.'
    }
  ];

  ngOnInit(): void {
    // If user is not logged in, auto-login with default NV user for realistic demo
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

  // Conversation history filtered by search
  get filteredConversations(): Conversation[] {
    const list = this.chatService.conversations();
    if (!this.searchHistoryQuery.trim()) {
      return list;
    }
    const q = this.searchHistoryQuery.toLowerCase();
    return list.filter(c => c.title.toLowerCase().includes(q));
  }

  // Active conversation getter
  get activeConversation(): Conversation | null {
    return this.chatService.activeConversation();
  }

  get hasMessages(): boolean {
    const active = this.activeConversation;
    return !!active && active.messages.length > 0;
  }

  // Toggle sidebar
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // New conversation
  handleNewChat(): void {
    this.chatService.createNewConversation();
    this.userInput = '';
    this.focusInput();
    this.showToast('success', 'Cuộc trò chuyện mới', 'Đã bắt đầu phiên tư vấn pháp lý mới.');
  }

  // Select conversation
  handleSelectChat(id: string): void {
    this.chatService.selectConversation(id);
    this.shouldScrollToBottom = true;
    this.focusInput();
  }

  // Open delete popup
  openDeleteModal(conversation: Conversation, event: MouseEvent): void {
    event.stopPropagation();
    this.conversationToDelete = conversation;
    this.showDeleteConfirm = true;
  }

  // Confirm delete
  confirmDelete(): void {
    if (this.conversationToDelete) {
      const title = this.conversationToDelete.title;
      this.chatService.deleteConversation(this.conversationToDelete.id);
      this.showToast('info', 'Đã xóa hội thoại', `Đã xóa cuộc trò chuyện "${title}".`);
    }
    this.showDeleteConfirm = false;
    this.conversationToDelete = null;
  }

  // Cancel delete
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.conversationToDelete = null;
  }

  // Click suggestion card
  onSelectSuggestion(card: SuggestionPrompt): void {
    this.userInput = card.fullPrompt;
    this.sendMessage();
  }

  // Keyboard shortcut handler
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Send user message
  async sendMessage(): Promise<void> {
    const query = this.userInput.trim();
    if (!query || this.chatService.isAiThinking()) {
      return;
    }

    this.userInput = '';
    this.shouldScrollToBottom = true;
    this.resetTextareaHeight();

    await this.chatService.sendUserMessage(query);
    this.shouldScrollToBottom = true;
  }

  // Copy message text
  copyMessage(content: string, id: string): void {
    navigator.clipboard.writeText(content).then(() => {
      this.copiedMessageId = id;
      this.showToast('success', 'Sao chép thành công', 'Nội dung tư vấn đã được lưu vào bộ nhớ tạm.');
      setTimeout(() => {
        if (this.copiedMessageId === id) {
          this.copiedMessageId = null;
          this.cdr.markForCheck();
        }
      }, 2500);
    });
  }

  // Thumbs up / down feedback
  setFeedback(id: string, type: 'like' | 'dislike'): void {
    if (this.messageFeedback[id] === type) {
      delete this.messageFeedback[id];
    } else {
      this.messageFeedback[id] = type;
      const msg = type === 'like' ? 'Cảm ơn phản hồi tích cực của bạn!' : 'Cảm ơn góp ý, chúng tôi sẽ cải thiện chất lượng tư vấn.';
      this.showToast('info', 'Ghi nhận phản hồi', msg);
    }
  }

  // Auto adjust textarea height
  onTextareaInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }

  private resetTextareaHeight(): void {
    if (this.chatTextareaRef) {
      this.chatTextareaRef.nativeElement.style.height = 'auto';
    }
  }

  private focusInput(): void {
    setTimeout(() => {
      this.chatTextareaRef?.nativeElement?.focus();
    }, 100);
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

  // Format assistant markdown text to HTML safe view
  formatMessageContent(content: string): string {
    if (!content) return '';

    let formatted = content
      // Escape basic HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h4 class="ai-section-title">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 class="ai-main-title">$1</h3>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Unordered List items
      .replace(/^- (.*$)/gim, '<li class="ai-list-item">$1</li>')
      // Ordered List items (e.g. 1. 2.)
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ai-list-item-numbered" value="$1">$2</li>');

    // Wrap list items
    formatted = formatted.replace(/(<li class="ai-list-item">.*?<\/li>)+/gis, '<ul class="ai-bullet-list">$&</ul>');
    formatted = formatted.replace(/(<li class="ai-list-item-numbered".*?<\/li>)+/gis, '<ol class="ai-numbered-list">$&</ol>');

    // Paragraph line breaks
    formatted = formatted.replace(/\n\n/g, '<div class="ai-paragraph-break"></div>');

    return formatted;
  }
}
