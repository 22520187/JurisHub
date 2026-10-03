import { Injectable, signal, computed } from '@angular/core';

export interface LegalReference {
  lawName: string;
  article: string;
  summary: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  date: string;
  legalReferences?: LegalReference[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  category?: 'labor' | 'business' | 'contract' | 'draft' | 'general';
  messages: ChatMessage[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly STORAGE_KEY = 'jurishub_conversations';
  private readonly ACTIVE_ID_KEY = 'jurishub_active_conversation_id';

  // Signals
  readonly conversations = signal<Conversation[]>([]);
  readonly activeConversationId = signal<string>('');
  readonly isAiThinking = signal<boolean>(false);

  readonly activeConversation = computed(() => {
    const list = this.conversations();
    const activeId = this.activeConversationId();
    return list.find(c => c.id === activeId) || list[0] || null;
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const activeId = localStorage.getItem(this.ACTIVE_ID_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.conversations.set(parsed);
          if (activeId && parsed.some(c => c.id === activeId)) {
            this.activeConversationId.set(activeId);
          } else {
            this.activeConversationId.set(parsed[0].id);
          }
          return;
        }
      }
    } catch (e) {
      console.error('Error loading conversations from storage:', e);
    }

    // Default mock data with rich Vietnamese legal content
    const initialList = this.getInitialMockConversations();
    this.conversations.set(initialList);
    // Set a new empty conversation as default active to match welcome screen
    const emptyChat = this.createEmptyConversation('Cuộc trò chuyện mới');
    this.conversations.set([emptyChat, ...initialList]);
    this.activeConversationId.set(emptyChat.id);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.conversations()));
      localStorage.setItem(this.ACTIVE_ID_KEY, this.activeConversationId());
    } catch (e) {
      console.error('Error saving conversations to storage:', e);
    }
  }

  createNewConversation(title: string = 'Cuộc trò chuyện mới'): Conversation {
    // If the currently active conversation is already empty, just reuse it
    const current = this.activeConversation();
    if (current && current.messages.length === 0) {
      return current;
    }

    const newChat = this.createEmptyConversation(title);
    this.conversations.update(list => [newChat, ...list]);
    this.activeConversationId.set(newChat.id);
    this.saveToStorage();
    return newChat;
  }

  private createEmptyConversation(title: string): Conversation {
    const now = new Date();
    return {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      category: 'general',
      messages: []
    };
  }

  selectConversation(id: string): void {
    this.activeConversationId.set(id);
    this.saveToStorage();
  }

  deleteConversation(id: string): void {
    const currentList = this.conversations();
    const updatedList = currentList.filter(c => c.id !== id);

    if (updatedList.length === 0) {
      const freshChat = this.createEmptyConversation('Cuộc trò chuyện mới');
      this.conversations.set([freshChat]);
      this.activeConversationId.set(freshChat.id);
    } else {
      this.conversations.set(updatedList);
      if (this.activeConversationId() === id) {
        this.activeConversationId.set(updatedList[0].id);
      }
    }

    this.saveToStorage();
  }

  async sendUserMessage(content: string): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) return;

    let active = this.activeConversation();
    if (!active) {
      active = this.createNewConversation();
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      content: trimmed,
      timestamp: timeStr,
      date: now.toISOString()
    };

    // Update conversation title if this is the first message
    const isFirstMessage = active.messages.length === 0;
    const newTitle = isFirstMessage ? this.generateConversationTitle(trimmed) : active.title;

    // Add user message
    this.conversations.update(list =>
      list.map(c => {
        if (c.id === active!.id) {
          return {
            ...c,
            title: newTitle,
            updatedAt: now.toISOString(),
            messages: [...c.messages, userMsg]
          };
        }
        return c;
      })
    );
    this.saveToStorage();

    // Trigger AI response with realistic delay
    this.isAiThinking.set(true);

    try {
      await this.simulateDelay(800 + Math.random() * 600);
      const aiResponse = this.generateAiLegalResponse(trimmed);

      const aiMsgTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: aiResponse.content,
        timestamp: aiMsgTime,
        date: new Date().toISOString(),
        legalReferences: aiResponse.references
      };

      this.conversations.update(list =>
        list.map(c => {
          if (c.id === active!.id) {
            return {
              ...c,
              updatedAt: new Date().toISOString(),
              messages: [...c.messages, aiMsg]
            };
          }
          return c;
        })
      );
      this.saveToStorage();
    } finally {
      this.isAiThinking.set(false);
    }
  }

  private generateConversationTitle(query: string): string {
    const lower = query.toLowerCase();
    if (lower.includes('lao động') || lower.includes('nghỉ việc') || lower.includes('thôi việc') || lower.includes('lương')) {
      return 'Tư vấn luật lao động';
    }
    if (lower.includes('doanh nghiệp') || lower.includes('thành lập') || lower.includes('đăng ký kinh doanh') || lower.includes('công ty')) {
      return 'Thủ tục đăng ký doanh nghiệp';
    }
    if (lower.includes('hợp đồng') || lower.includes('vi phạm') || lower.includes('tranh chấp') || lower.includes('bồi thường')) {
      return 'Tranh chấp hợp đồng kinh tế';
    }
    if (lower.includes('soạn thảo') || lower.includes('mẫu') || lower.includes('văn bản') || lower.includes('hợp đồng lao động')) {
      return 'Soạn thảo mẫu hợp đồng';
    }
    if (lower.includes('đất đai') || lower.includes('sổ đỏ') || lower.includes('nhà đất')) {
      return 'Tư vấn pháp luật đất đai';
    }
    if (lower.includes('hôn nhân') || lower.includes('ly hôn') || lower.includes('tài sản chung')) {
      return 'Tư vấn hôn nhân & gia đình';
    }
    return query.length > 38 ? query.substring(0, 35) + '...' : query;
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateAiLegalResponse(query: string): { content: string; references: LegalReference[] } {
    const lower = query.toLowerCase();

    // 1. Labor Law / Nghỉ việc
    if (lower.includes('lao động') || lower.includes('nghỉ việc') || lower.includes('thôi việc') || lower.includes('chấm dứt hợp đồng')) {
      return {
        content: `Dựa trên quy định của **Bộ luật Lao động 2019** hiện hành, khi người lao động chấm dứt hợp đồng lao động đúng pháp luật, người lao động được hưởng các quyền lợi tài chính và thủ tục sau:

### 1. Tiền lương và chế độ chưa thanh toán
- Người sử dụng lao động có trách nhiệm thanh toán đầy đủ các khoản tiền liên quan đến quyền lợi của người lao động trong thời hạn **14 ngày làm việc** kể từ ngày chấm dứt HĐLĐ (có thể kéo dài tối đa 30 ngày trong trường hợp thiên tai, hỏa hoạn, tái cơ cấu...).

### 2. Trợ cấp thôi việc (Điều 46 BLLĐ 2019)
- Áp dụng đối với người lao động đã làm việc thường xuyên từ **đủ 12 tháng trở lên**.
- Mức hưởng: **Mỗi năm làm việc được trợ cấp 1/2 tháng tiền lương**.
- Thời gian tính trợ cấp thôi việc là tổng thời gian làm việc thực tế trừ đi thời gian đã tham gia bảo hiểm thất nghiệp (BHTN) theo quy định của Luật Việc làm và thời gian làm việc đã được chi trả trợ cấp thôi việc/mất việc trước đó.

### 3. Trợ cấp thất nghiệp (từ Quỹ Bảo hiểm Xã hội)
- Điều kiện: Đóng BHTN từ đủ 12 tháng trở lên trong vòng 24 tháng trước khi chấm dứt HĐLĐ.
- Mức hưởng hàng tháng: Bằng **60% mức bình quân tiền lương tháng đóng BHTN** của 06 tháng liền kề trước khi thất nghiệp (tối đa không quá 05 lần mức lương tối thiểu vùng).

### 4. Tiền phép năm chưa nghỉ hết (Khoản 3 Điều 113 BLLĐ 2019)
- Trường hợp người lao động do thôi việc, bị mất việc làm mà chưa nghỉ hằng năm hoặc chưa nghỉ hết số ngày nghỉ hằng năm thì được người sử dụng lao động thanh toán tiền lương cho những ngày chưa nghỉ.

### 5. Thủ tục xác nhận và trả lại sổ BHXH
- Doanh nghiệp có nghĩa vụ hoàn thành thủ tục xác nhận thời gian đóng BHXH, BHTN và trả lại cùng với bản chính giấy tờ khác đã giữ của người lao động.`,
        references: [
          { lawName: 'Bộ luật Lao động 2019', article: 'Điều 46, Điều 48, Điều 113', summary: 'Quy định về trợ cấp thôi việc, trách nhiệm khi chấm dứt HĐLĐ và thanh toán ngày phép' },
          { lawName: 'Luật Việc làm 2013', article: 'Điều 49, Điều 50', summary: 'Điều kiện và mức hưởng trợ cấp thất nghiệp' }
        ]
      };
    }

    // 2. Business registration / Thủ tục doanh nghiệp
    if (lower.includes('doanh nghiệp') || lower.includes('thành lập') || lower.includes('đăng ký kinh doanh') || lower.includes('công ty')) {
      return {
        content: `Chào bạn, theo quy định của **Luật Doanh nghiệp 2020** và **Nghị định 01/2021/NĐ-CP**, quy trình đăng ký thành lập doanh nghiệp (đặc biệt là công ty công nghệ/startup) bao gồm các bước sau:

### 1. Chuẩn bị thông tin pháp lý ban đầu
- **Tên công ty**: Không được trùng hoặc gây nhầm lẫn với doanh nghiệp đã đăng ký trên phạm vi toàn quốc.
- **Trụ sở chính**: Có địa chỉ rõ ràng tại Việt Nam (lưu ý: căn hộ chung cư dùng để ở không được đăng ký làm trụ sở).
- **Vốn điều lệ**: Tự kê khai và chịu trách nhiệm; cần góp đủ trong vòng **90 ngày** kể từ ngày được cấp GCN ĐKDN.
- **Mã ngành nghề**: Đối với CNTT thường đăng ký: Mã 6201 (Lập trình máy vi tính), 6202 (Tư vấn máy vi tính), 6311 (Xử lý dữ liệu, cho thuê hosting).

### 2. Hồ sơ đăng ký kinh doanh
- Giấy đề nghị đăng ký doanh nghiệp (theo mẫu quy định).
- Điều lệ công ty.
- Danh sách thành viên (đối với Công ty TNHH 2 TV trở lên) hoặc Danh sách cổ đông sáng lập (đối với Công ty Cổ phần).
- Bản sao hợp lệ CCCD/Hộ chiếu của người đại diện pháp luật và các thành viên góp vốn.

### 3. Nộp hồ sơ và nhận kết quả
- Nộp trực tuyến 100% qua Cổng thông tin quốc gia về đăng ký doanh nghiệp (*dangkykinhdoanh.gov.vn*) bằng Chữ ký số công cộng hoặc Tài khoản đăng ký kinh doanh.
- Thời gian giải quyết: **03 ngày làm việc** kể từ ngày nhận đủ hồ sơ hợp lệ.

### 4. Các thủ tục sau khi thành lập
- Khắc dấu pháp nhân (doanh nghiệp tự quyết định số lượng, hình thức con dấu).
- Mở tài khoản ngân hàng và thông báo với cơ quan thuế.
- Mua chữ ký số (Token) và hóa đơn điện tử.
- Treo biển hiệu tại trụ sở chính và nộp tờ khai lệ phí môn bài.`,
        references: [
          { lawName: 'Luật Doanh nghiệp 2020', article: 'Điều 19 - Điều 24', summary: 'Hồ sơ, trình tự, thủ tục đăng ký doanh nghiệp' },
          { lawName: 'Nghị định 01/2021/NĐ-CP', article: 'Điều 32', summary: 'Quy định chi tiết về đăng ký doanh nghiệp qua mạng thông tin điện tử' }
        ]
      };
    }

    // 3. Contract dispute / Tranh chấp hợp đồng
    if (lower.includes('hợp đồng') || lower.includes('tranh chấp') || lower.includes('vi phạm') || lower.includes('bồi thường')) {
      return {
        content: `Khi đối tác có hành vi vi phạm hợp đồng kinh tế, theo quy định của **Bộ luật Dân sự 2015** và **Luật Thương mại 2005**, bạn cần thực hiện tuần tự các bước sau để bảo vệ quyền lợi tối đa:

### Bước 1: Rà soát điều khoản hợp đồng & lập biên bản vi phạm
- Kiểm tra kỹ các điều khoản về nghĩa vụ, thời hạn thực hiện, điều kiện bất khả kháng và điều khoản giải quyết tranh chấp.
- Gửi văn bản thông báo vi phạm nghĩa vụ (Notice of Default), yêu cầu đối tác khắc phục vi phạm trong một khoảng thời hạn hợp lý.

### Bước 2: Thu thập và cố định chứng cứ pháp lý
- Hợp đồng gốc, phụ lục hợp đồng, biên bản bàn giao, phiếu nghiệm thu.
- Hóa đơn tài chính, ủy nhiệm chi, sao kê ngân hàng chứng minh thanh toán.
- Email trao đổi, tin nhắn, công văn qua lại giữa hai bên (có thể lập vi bằng Thừa phát lại nếu cần thiết).

### Bước 3: Thương lượng & Hòa giải
- Ưu tiên phương thức đàm phán trực tiếp để giảm thiểu chi phí và thời gian tố tụng.
- Mọi thỏa thuận đạt được cần được lập thành biên bản có chữ ký của người đại diện theo pháp luật.

### Bước 4: Áp dụng các chế tài tài chính
- **Phạt vi phạm**: Chỉ được áp dụng nếu trong hợp đồng có thỏa thuận. Mức phạt trong thương mại tối đa là **8% giá trị phần nghĩa vụ hợp đồng bị vi phạm** (Điều 301 Luật Thương mại 2005).
- **Bồi thường thiệt hại**: Bên vi phạm phải bồi thường toàn bộ tổn thất thực tế, trực tiếp và khoản lợi nhuận mà bên bị vi phạm lẽ ra được hưởng.

### Bước 5: Khởi kiện tại Tòa án hoặc Trọng tài thương mại
- Nếu hợp đồng có điều khoản trọng tài: nộp đơn tại Trung tâm Trọng tài (như VIAC).
- Nếu không có thỏa thuận trọng tài: nộp đơn khởi kiện tại Tòa án nhân dân cấp có thẩm quyền.
- **Lưu ý thời hiệu khởi kiện**: Thông thường là **09 tháng** đối với tranh chấp thương mại (Điều 319 Luật Thương mại) hoặc **03 năm** theo Bộ luật Dân sự.`,
        references: [
          { lawName: 'Luật Thương mại 2005', article: 'Điều 300, 301, 319', summary: 'Chế tài phạt vi phạm, bồi thường thiệt hại và thời hiệu khởi kiện' },
          { lawName: 'Bộ luật Dân sự 2015', article: 'Điều 351, 418', summary: 'Trách nhiệm dân sự do vi phạm nghĩa vụ hợp đồng' }
        ]
      };
    }

    // 4. Contract drafting / Soạn thảo hợp đồng
    if (lower.includes('soạn thảo') || lower.includes('mẫu') || lower.includes('văn bản')) {
      return {
        content: `Khi soạn thảo **Hợp đồng lao động không xác định thời hạn** (hoặc bất kỳ hợp đồng thương mại nào), bạn cần đảm bảo các điều khoản cốt lõi theo **Điều 21 Bộ luật Lao động 2019**:

### 1. Thông tin chủ thể các bên
- **Bên sử dụng lao động**: Tên công ty, Mã số thuế, Địa chỉ trụ sở, Họ tên & chức danh người đại diện theo pháp luật.
- **Bên người lao động**: Họ và tên, Ngày tháng năm sinh, Giới tính, Số CCCD, Ngày cấp, Nơi cấp, Nơi cư trú.

### 2. Các điều khoản bắt buộc phải có
1. **Công việc và địa điểm làm việc**: Mô tả vị trí công tác, nhiệm vụ chính và địa điểm làm việc cụ thể.
2. **Thời hạn hợp đồng**: Ghi rõ *"Hợp đồng lao động không xác định thời hạn kể từ ngày... /... /202..."*.
3. **Mức lương, hình thức trả lương**:
   - Lương cơ bản đóng BHXH.
   - Các khoản phụ cấp lương và khoản bổ sung khác.
   - Kỳ hạn trả lương (ví dụ: ngày 05 đến ngày 10 hàng tháng).
4. **Thời giờ làm việc, thời giờ nghỉ ngơi**: Tiêu chuẩn không quá 8 giờ/ngày và 48 giờ/tuần.
5. **Trang bị bảo hộ lao động** và an toàn vệ sinh lao động.
6. **Bảo hiểm xã hội, bảo hiểm y tế và bảo hiểm thất nghiệp**: Doanh nghiệp và NLĐ trích đóng theo tỷ lệ pháp luật quy định.
7. **Đào tạo, bồi dưỡng nâng cao trình độ kỹ năng nghề**.

### 3. Điều khoản thỏa thuận bảo mật thông tin & sở hữu trí tuệ (NDA)
- Đối với nhân sự công nghệ, quản lý, nên bổ sung điều khoản cam kết bảo mật bí mật kinh doanh, bí mật công nghệ và không cạnh tranh trong phạm vi cho phép của pháp luật.`,
        references: [
          { lawName: 'Bộ luật Lao động 2019', article: 'Điều 21', summary: 'Nội dung bắt buộc phải có của Hợp đồng lao động' },
          { lawName: 'Thông tư 10/2020/TT-BLĐTBXH', article: 'Điều 3', summary: 'Hướng dẫn chi tiết về nội dung hợp đồng lao động' }
        ]
      };
    }

    // Default General Legal Response
    return {
      content: `Cảm ơn câu hỏi của bạn về: **"${query}"**.

Dưới góc độ pháp lý Việt Nam hiện hành, Trợ lý AI xin cung cấp nhận định và hướng dẫn sơ bộ như sau:

### 1. Phân tích pháp lý
- Vấn đề bạn nêu thuộc phạm vi điều chỉnh của pháp luật chuyên ngành tương ứng. Để giải quyết thỏa đáng, cần căn cứ vào các sự kiện pháp lý thực tế, giấy tờ, văn bản thỏa thuận đã xác lập giữa các bên liên quan.
- Mọi hành vi pháp lý cần tuân thủ nguyên tắc tự nguyện, thiện chí, không vi phạm điều cấm của luật và không trái đạo đức xã hội.

### 2. Các bước khuyến nghị thực hiện
1. **Rà soát hồ sơ**: Tập hợp đầy đủ các văn bản, giấy tờ, hợp đồng, chứng từ thanh toán hoặc biên bản trao đổi có liên quan.
2. **Kiểm tra thời hiệu**: Lưu ý thời hiệu yêu cầu giải quyết hoặc khởi kiện theo luật định để không làm mất quyền khởi kiện.
3. **Thương lượng hòa giải**: Ưu tiên giải pháp trao đổi thiện chí giữa các bên để tìm phương án hòa giải tối ưu chi phí và thời gian.
4. **Tham vấn luật sư**: Nếu vụ việc có yếu tố phức tạp, tranh chấp tài sản giá trị lớn hoặc có nguy cơ tố tụng, bạn nên liên hệ luật sư chuyên trách để được bảo vệ quyền lợi tốt nhất.`,
      references: [
        { lawName: 'Bộ luật Dân sự 2015', article: 'Điều 3', summary: 'Các nguyên tắc cơ bản của pháp luật dân sự' }
      ]
    };
  }

  private getInitialMockConversations(): Conversation[] {
    return [
      {
        id: 'conv_labor_1',
        title: 'Tư vấn luật lao động & thôi việc',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        category: 'labor',
        messages: [
          {
            id: 'm1',
            sender: 'user',
            content: 'Quyền lợi của người lao động khi nghỉ việc theo luật hiện hành là gì?',
            timestamp: '14:20',
            date: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 'm2',
            sender: 'assistant',
            content: `Theo quy định của **Bộ luật Lao động 2019**, khi người lao động chấm dứt hợp đồng lao động hợp pháp sẽ có các quyền lợi chính:

1. **Thanh toán tiền lương**: Trong vòng 14 ngày làm việc kể từ ngày chấm dứt HĐLĐ.
2. **Trợ cấp thôi việc** (Điều 46 BLLĐ): 1/2 tháng tiền lương cho mỗi năm làm việc đối với thời gian không tham gia BHTN.
3. **Trợ cấp thất nghiệp**: 60% mức bình quân lương 6 tháng liền kề đóng BHTN.
4. **Tiền phép năm chưa nghỉ**: Được hoàn trả bằng tiền theo quy định.
5. **Chốt và trả sổ BHXH**: Doanh nghiệp có nghĩa vụ chốt sổ và hoàn trả toàn bộ giấy tờ bản chính.`,
            timestamp: '14:21',
            date: new Date(Date.now() - 3600000 * 2).toISOString(),
            legalReferences: [
              { lawName: 'Bộ luật Lao động 2019', article: 'Điều 46, Điều 48', summary: 'Trợ cấp thôi việc và trách nhiệm khi chấm dứt HĐLĐ' }
            ]
          }
        ]
      },
      {
        id: 'conv_business_2',
        title: 'Thủ tục đăng ký kinh doanh startup',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        category: 'business',
        messages: [
          {
            id: 'm3',
            sender: 'user',
            content: 'Hướng dẫn thủ tục đăng ký kinh doanh cho công ty startup công nghệ.',
            timestamp: '10:15',
            date: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'm4',
            sender: 'assistant',
            content: `Quy trình đăng ký doanh nghiệp công nghệ theo **Luật Doanh nghiệp 2020**:

- **Bước 1**: Chuẩn bị tên công ty, địa chỉ trụ sở (không được là chung cư nhà ở), vốn điều lệ và ngành nghề (mã 6201, 6202...).
- **Bước 2**: Lập hồ sơ gồm Giấy đề nghị ĐKDN, Điều lệ công ty, Danh sách thành viên/cổ đông và bản sao CCCD.
- **Bước 3**: Nộp trực tuyến tại *dangkykinhdoanh.gov.vn*. Thời gian cấp giấy phép là 03 ngày làm việc.
- **Bước 4**: Khắc dấu, mở tài khoản ngân hàng, mua chữ ký số và nộp tờ khai môn bài.`,
            timestamp: '10:16',
            date: new Date(Date.now() - 86400000).toISOString(),
            legalReferences: [
              { lawName: 'Luật Doanh nghiệp 2020', article: 'Điều 19 - 24', summary: 'Hồ sơ và thủ tục đăng ký doanh nghiệp' }
            ]
          }
        ]
      }
    ];
  }
}
