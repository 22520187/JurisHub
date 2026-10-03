import { Component, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ModalCustomComponent } from '../../shared/components/modal-custom/modal-custom';
import { DirectMessageService, DirectConversation, DirectParticipant } from '../../core/services/direct-message.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    BadgeComponent,
    ModalCustomComponent
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent implements AfterViewChecked {
  readonly messageService = inject(DirectMessageService);

  @ViewChild('messagesScroll') private messagesScrollContainer?: ElementRef;

  searchQuery: string = '';
  messageText: string = '';

  // New Conversation Modal State
  isNewModalOpen: boolean = false;
  contactFilter: 'ALL' | 'LAWYER' | 'USER' = 'ALL';
  selectedContact: DirectParticipant | null = null;
  initialMessageText: string = '';

  private shouldScrollBottom = false;

  get conversations(): DirectConversation[] {
    const list = this.messageService.conversations();
    if (!this.searchQuery.trim()) {
      return list;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return list.filter(c =>
      c.participant.name.toLowerCase().includes(q) ||
      (c.participant.specialty && c.participant.specialty.toLowerCase().includes(q)) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  }

  get activeConversation(): DirectConversation | null {
    return this.messageService.getActiveConversation();
  }

  get filteredContacts(): DirectParticipant[] {
    const contacts = this.messageService.availableContacts;
    if (this.contactFilter === 'ALL') return contacts;
    return contacts.filter(c => c.role === this.contactFilter);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
      this.shouldScrollBottom = false;
    }
  }

  selectConversation(id: string): void {
    this.messageService.selectConversation(id);
    this.shouldScrollBottom = true;
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.activeConversation) return;

    this.messageService.sendMessage(this.activeConversation.id, this.messageText.trim());
    this.messageText = '';
    this.shouldScrollBottom = true;
  }

  openNewModal(): void {
    this.selectedContact = null;
    this.initialMessageText = '';
    this.contactFilter = 'ALL';
    this.isNewModalOpen = true;
  }

  closeNewModal(): void {
    this.isNewModalOpen = false;
  }

  chooseContact(contact: DirectParticipant): void {
    this.selectedContact = contact;
  }

  startNewChat(): void {
    if (!this.selectedContact) return;

    this.messageService.startConversation(this.selectedContact, this.initialMessageText.trim());
    this.isNewModalOpen = false;
    this.shouldScrollBottom = true;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesScrollContainer) {
        this.messagesScrollContainer.nativeElement.scrollTop =
          this.messagesScrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // Ignore
    }
  }
}
