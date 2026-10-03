import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string | number;
  senderName: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

export interface DirectParticipant {
  id: string | number;
  name: string;
  email?: string;
  role: 'LAWYER' | 'USER';
  roleDisplay: string; // 'Luật sư' | 'Thành viên'
  avatarUrl?: string;
  specialty?: string;
  isOnline?: boolean;
}

export interface DirectConversation {
  id: string;
  participant: DirectParticipant;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  messages: DirectMessage[];
}

@Injectable({
  providedIn: 'root'
})
export class DirectMessageService {
  private readonly authService = inject(AuthService);
  private readonly STORAGE_KEY = 'jurishub_direct_conversations';

  private conversationsSignal = signal<DirectConversation[]>(this.loadStoredConversations());
  private activeConversationIdSignal = signal<string | null>(null);

  readonly conversations = this.conversationsSignal.asReadonly();
  readonly activeConversationId = this.activeConversationIdSignal.asReadonly();

  // Contacts available for starting a conversation
  readonly availableContacts: DirectParticipant[] = [
    {
      id: 'lawyer-1',
      name: 'Luật sư Trần Đức Minh',
      email: 'minh.tran@legalconnect.vn',
      role: 'LAWYER',
      roleDisplay: 'Luật sư',
      specialty: 'Luật Doanh nghiệp & Thương mại',
      isOnline: true
    },
    {
      id: 'lawyer-2',
      name: 'Luật sư Nguyễn Văn Hùng',
      email: 'hung.nguyen@legalconnect.vn',
      role: 'LAWYER',
      roleDisplay: 'Luật sư',
      specialty: 'Luật Đất đai & Nhà ở',
      isOnline: true
    },
    {
      id: 'lawyer-3',
      name: 'Luật sư Lê Thuỳ Dung',
      email: 'dung.le@legalconnect.vn',
      role: 'LAWYER',
      roleDisplay: 'Luật sư',
      specialty: 'Hôn nhân & Gia đình',
      isOnline: false
    },
    {
      id: 'user-1',
      name: 'Lê Hoàng Nam',
      email: 'nam.le@gmail.com',
      role: 'USER',
      roleDisplay: 'Thành viên',
      isOnline: true
    },
    {
      id: 'user-2',
      name: 'Phạm Thu Trang',
      email: 'trang.pham@gmail.com',
      role: 'USER',
      roleDisplay: 'Thành viên',
      isOnline: false
    }
  ];

  private loadStoredConversations(): DirectConversation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading conversations:', e);
    }
    return [];
  }

  private persist(convs: DirectConversation[]): void {
    this.conversationsSignal.set(convs);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(convs));
    } catch (e) {
      console.error('Error persisting conversations:', e);
    }
  }

  selectConversation(id: string | null): void {
    this.activeConversationIdSignal.set(id);
    if (id) {
      // Mark as read
      const list = this.conversationsSignal().map(c => {
        if (c.id === id) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      });
      this.persist(list);
    }
  }

  getActiveConversation(): DirectConversation | null {
    const id = this.activeConversationIdSignal();
    if (!id) return null;
    return this.conversationsSignal().find(c => c.id === id) || null;
  }

  startConversation(participant: DirectParticipant, initialMessage?: string): DirectConversation {
    const list = this.conversationsSignal();
    // Check if conversation already exists with this participant
    const existing = list.find(c => c.participant.id === participant.id);
    if (existing) {
      if (initialMessage && initialMessage.trim()) {
        this.sendMessage(existing.id, initialMessage.trim());
      }
      this.selectConversation(existing.id);
      return existing;
    }

    const convId = `conv-${Date.now()}`;
    const newConv: DirectConversation = {
      id: convId,
      participant: participant,
      messages: [],
      unreadCount: 0,
      lastMessage: initialMessage || '',
      lastMessageTime: 'Vừa xong'
    };

    if (initialMessage && initialMessage.trim()) {
      const user = this.authService.currentUser();
      const msg: DirectMessage = {
        id: `msg-${Date.now()}`,
        conversationId: convId,
        senderId: user?.id || 'current-user',
        senderName: user?.name || 'Nguyen Van A',
        content: initialMessage.trim(),
        timestamp: this.formatTimeNow(),
        isMine: true
      };
      newConv.messages.push(msg);
    }

    const updated = [newConv, ...list];
    this.persist(updated);
    this.selectConversation(convId);
    return newConv;
  }

  sendMessage(conversationId: string, content: string): void {
    if (!content || !content.trim()) return;

    const user = this.authService.currentUser();
    const timeNow = this.formatTimeNow();
    const list = this.conversationsSignal();

    const convIndex = list.findIndex(c => c.id === conversationId);
    if (convIndex === -1) return;

    const conv = list[convIndex];
    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: user?.id || 'current-user',
      senderName: user?.name || 'Nguyen Van A',
      content: content.trim(),
      timestamp: timeNow,
      isMine: true
    };

    const updatedConv: DirectConversation = {
      ...conv,
      lastMessage: content.trim(),
      lastMessageTime: timeNow,
      messages: [...conv.messages, newMsg]
    };

    // Move updated conversation to top of list
    const updatedList = [
      updatedConv,
      ...list.filter(c => c.id !== conversationId)
    ];
    this.persist(updatedList);

    // Auto-reply simulation for interactive demo if talking with lawyer
    if (conv.participant.role === 'LAWYER') {
      setTimeout(() => {
        this.simulateReply(conversationId, conv.participant);
      }, 1500);
    }
  }

  private simulateReply(conversationId: string, partner: DirectParticipant): void {
    const list = this.conversationsSignal();
    const conv = list.find(c => c.id === conversationId);
    if (!conv) return;

    const replyMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: partner.id,
      senderName: partner.name,
      content: `Chào bạn, tôi là ${partner.name}. Tôi đã nhận được yêu cầu tư vấn của bạn và sẽ phản hồi chi tiết trong thời gian sớm nhất.`,
      timestamp: this.formatTimeNow(),
      isMine: false
    };

    const updatedConv: DirectConversation = {
      ...conv,
      lastMessage: replyMsg.content,
      lastMessageTime: replyMsg.timestamp,
      messages: [...conv.messages, replyMsg]
    };

    const updatedList = [
      updatedConv,
      ...list.filter(c => c.id !== conversationId)
    ];
    this.persist(updatedList);
  }

  private formatTimeNow(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
