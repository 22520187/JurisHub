import { Injectable, signal, computed } from '@angular/core';

export interface PdfDocument {
  name: string;
  size: string;
  pages: number;
  uploadDate: string;
}

export interface PdfChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  pageReferences?: number[];
  isSummary?: boolean;
}

export interface PdfConversation {
  id: string;
  title: string;
  document: PdfDocument | null;
  messages: PdfChatMessage[];
  isAnalyzing: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatPdfService {
  private readonly STORAGE_KEY = 'jurishub_pdf_conversations';
  private readonly ACTIVE_ID_KEY = 'jurishub_active_pdf_conversation_id';

  // State Signals
  readonly conversations = signal<PdfConversation[]>([]);
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
        const parsed = JSON.parse(stored) as PdfConversation[];
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
      console.error('Error loading PDF conversations from storage:', e);
    }

    // Default initial mock data matching user screenshots
    const mockList = this.getInitialMockConversations();
    this.conversations.set(mockList);
    this.activeConversationId.set(mockList[0].id);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.conversations()));
      localStorage.setItem(this.ACTIVE_ID_KEY, this.activeConversationId());
    } catch (e) {
      console.error('Error saving PDF conversations to storage:', e);
    }
  }

  createNewConversation(title: string = 'Cuộc trò chuyện mới'): PdfConversation {
    const current = this.activeConversation();
    if (current && !current.document && current.messages.length === 0) {
      return current;
    }

    const now = new Date();
    const newChat: PdfConversation = {
      id: 'pdf_conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title,
      document: null,
      messages: [],
      isAnalyzing: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.conversations.update(list => [newChat, ...list]);
    this.activeConversationId.set(newChat.id);
    this.saveToStorage();
    return newChat;
  }

  selectConversation(id: string): void {
    this.activeConversationId.set(id);
    this.saveToStorage();
  }

  deleteConversation(id: string): void {
    const currentList = this.conversations();
    const updatedList = currentList.filter(c => c.id !== id);

    if (updatedList.length === 0) {
      const freshChat = this.createNewConversation();
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

  removeDocumentFromActiveChat(): void {
    const active = this.activeConversation();
    if (!active) return;

    this.conversations.update(list =>
      list.map(c => {
        if (c.id === active.id) {
          return {
            ...c,
            title: 'Cuộc trò chuyện mới',
            document: null,
            messages: [],
            isAnalyzing: false,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      })
    );
    this.saveToStorage();
  }

  async attachPdfAndSummarize(file: { name: string; size: string; pages: number }): Promise<void> {
    let active = this.activeConversation();
    if (!active) {
      active = this.createNewConversation(file.name);
    }

    const now = new Date();
    const docInfo: PdfDocument = {
      name: file.name,
      size: file.size,
      pages: file.pages,
      uploadDate: now.toLocaleDateString('vi-VN')
    };

    // Update conversation with document and start analyzing state
    this.conversations.update(list =>
      list.map(c => {
        if (c.id === active!.id) {
          return {
            ...c,
            title: file.name,
            document: docInfo,
            isAnalyzing: true,
            messages: [],
            updatedAt: now.toISOString()
          };
        }
        return c;
      })
    );
    this.saveToStorage();

    // Simulate AI document processing and summary generation
    await new Promise(resolve => setTimeout(resolve, 1600));

    const summaryText = this.generateDocumentSummary(file.name);
    const summaryMsg: PdfChatMessage = {
      id: 'msg_summary_' + Date.now(),
      sender: 'assistant',
      content: summaryText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isSummary: true,
      pageReferences: [1, 2, 3]
    };

    this.conversations.update(list =>
      list.map(c => {
        if (c.id === active!.id) {
          return {
            ...c,
            isAnalyzing: false,
            messages: [summaryMsg],
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      })
    );
    this.saveToStorage();
  }

  async sendUserQuestion(query: string): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) return;

    const active = this.activeConversation();
    if (!active || !active.document) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const userMsg: PdfChatMessage = {
      id: 'msg_u_' + Date.now(),
      sender: 'user',
      content: trimmed,
      timestamp: timeStr
    };

    this.conversations.update(list =>
      list.map(c => {
        if (c.id === active.id) {
          return {
            ...c,
            updatedAt: now.toISOString(),
            messages: [...c.messages, userMsg]
          };
        }
        return c;
      })
    );
    this.saveToStorage();

    this.isAiThinking.set(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

      const aiResponse = this.generateDocumentAnswer(trimmed, active.document.name);
      const aiMsg: PdfChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        pageReferences: aiResponse.pages
      };

      this.conversations.update(list =>
        list.map(c => {
          if (c.id === active.id) {
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

  private generateDocumentSummary(fileName: string): string {
    const lower = fileName.toLowerCase();

    if (lower.includes('pattern') || lower.includes('design')) {
      return `### 📑 Báo Cáo Phân Tích & Tóm Tắt Tài Liệu
**Tài liệu**: \`${fileName}\`
**Trạng thái**: Đã trích xuất và chỉ mục hóa toàn bộ nội dung.

---

### 1. Tổng Quan Nội Dung
Tài liệu trình bày tổng quan và chi tiết về **Design Patterns (Mẫu thiết kế phần mềm)** trong kiến trúc hướng đối tượng, bao gồm:
- Khái niệm, lịch sử ra đời bởi nhóm Gang of Four (GoF).
- Tầm quan trọng của việc tái sử dụng cấu trúc phần mềm giải quyết các bài toán thiết kế kinh điển.

### 2. Ba Nhóm Mẫu Thiết Kế Trọng Tâm
1. **Creational Patterns (Nhóm khởi tạo)**: Singleton, Factory Method, Abstract Factory, Builder, Prototype.
2. **Structural Patterns (Nhóm cấu trúc)**: Adapter, Bridge, Composite, Decorator, Facade, Proxy.
3. **Behavioral Patterns (Nhóm hành vi)**: Observer, Strategy, Command, Iterator, State, Template Method.

### 3. Nhận Định & Ứng Dụng Thực Tiễn
- Tài liệu cung cấp sơ đồ UML chuẩn, mã nguồn minh họa và so sánh ưu nhược điểm của từng Pattern khi áp dụng vào các hệ thống lớn.
- Các nguyên tắc thiết kế SOLID được lồng ghép để hỗ trợ việc áp dụng mẫu thiết kế linh hoạt.

---
💡 *Bạn có thể đặt câu hỏi chi tiết về bất kỳ mẫu thiết kế, sơ đồ lớp hoặc mã nguồn nào trong tài liệu này!*`;
    }

    if (lower.includes('hợp đồng') || lower.includes('contract')) {
      return `### 📑 Tóm Tắt Pháp Lý Văn Bản Hợp Đồng
**Tài liệu**: \`${fileName}\`
**Kết quả kiểm tra sơ bộ**: Hợp đồng có đầy đủ các chủ thể pháp lý và điều khoản bắt buộc.

---

### 1. Thông Tin Các Bên Giao Kết
- **Bên A (Bên giao việc / Mua)**: Người đại diện theo pháp luật, MST và địa chỉ trụ sở đầy đủ.
- **Bên B (Bên thực hiện / Bán)**: Đơn vị cung cấp dịch vụ chuyên nghiệp.

### 2. Các Điều Khoản Cốt Lõi
- **Phạm vi công việc (Điều 1)**: Quy định chi tiết các hạng mục bàn giao, tiêu chuẩn kỹ thuật và tiến độ thực hiện.
- **Giá trị & Phương thức thanh toán (Điều 3)**: Thanh toán thành 03 đợt theo biên bản nghiệm thu từng giai đoạn.
- **Bảo hành & Nghiệm thu (Điều 5)**: Thời hạn bảo hành là 12 tháng kể từ ngày ký biên bản bàn giao hoàn thành.

### 3. Điểm Pháp Lý & Rủi Ro Cần Lưu Ý
- **Chế tài vi phạm**: Phạt vi phạm hợp đồng mức **8%** giá trị vi phạm (phù hợp với Điều 301 Luật Thương mại 2005).
- **Điều khoản bảo mật (NDA)**: Cam kết bảo mật vô thời hạn sau khi hợp đồng chấm dứt.
- **Giải quyết tranh chấp**: Thẩm quyền thuộc Tòa án nhân dân có thẩm quyền tại địa bàn Bên A.`;
    }

    // General Legal Document Summary
    return `### 📑 Báo Cáo Tóm Tắt Văn Bản Pháp Luật
**Tài liệu**: \`${fileName}\`
**Độ tin cậy văn bản**: Đã thẩm định cấu trúc điều khoản.

---

### 1. Mục Đích & Phạm Vi Áp Dụng
Văn bản quy định các nguyên tắc, quy trình thực hiện, quyền hạn và trách nhiệm của các bên liên quan theo quy định của pháp luật Việt Nam hiện hành.

### 2. Nội Dung Trọng Tâm
- **Chương I**: Quy định chung, các định nghĩa và phạm vi điều chỉnh.
- **Chương II**: Quyền và nghĩa vụ cụ thể của từng chủ thể tham gia.
- **Chương III**: Trình tự, thủ tục hành chính và hồ sơ yêu cầu.
- **Chương IV**: Điều khoản chuyển tiếp và hiệu lực thi hành.

### 3. Khuyến Nghị Áp Dụng
Văn bản có hiệu lực thi hành kể từ ngày ký. Các tổ chức, cá nhân liên quan cần rà soát lại quy trình nội bộ để đảm bảo tuân thủ đầy đủ.

---
💡 *Bạn có thể hỏi bất kỳ thắc mắc nào về các điều khoản, thời hiệu hoặc nghĩa vụ trong văn bản này.*`;
  }

  private generateDocumentAnswer(query: string, docName: string): { content: string; pages: number[] } {
    const lower = query.toLowerCase();

    if (lower.includes('nghĩa vụ') || lower.includes('trách nhiệm') || lower.includes('bên b') || lower.includes('bên a')) {
      return {
        content: `Dựa trên nội dung tài liệu **${docName}**:

1. **Nghĩa vụ của Bên cung cấp / thực hiện**:
   - Hoàn thành các hạng mục đúng tiến độ và tiêu chuẩn chất lượng đã cam kết.
   - Bàn giao đầy đủ hồ sơ, tài liệu hướng dẫn và mã nguồn liên quan.
   - Bảo mật tuyệt đối mọi dữ liệu, thông tin kinh doanh của đối tác theo thỏa thuận bảo mật.

2. **Nghĩa vụ thanh toán & hỗ trợ**:
   - Cung cấp môi trường, tài liệu và nhân sự phối hợp kiểm thử nghiệm thu.
   - Thanh toán đúng hạn theo tiến độ các đợt đã thỏa thuận trong hợp đồng.

*Căn cứ trích dẫn: Mục 4.2 và Điều 7 của tài liệu.*`,
        pages: [4, 7]
      };
    }

    if (lower.includes('phạt') || lower.includes('bồi thường') || lower.includes('vi phạm')) {
      return {
        content: `Theo quy định tại **Điều khoản chế tài vi phạm** trong tài liệu **${docName}**:

- **Mức phạt vi phạm**: Trường hợp chậm trễ tiến độ hoặc vi phạm nghĩa vụ cơ bản, bên vi phạm phải chịu phạt **0.05% giá trị hợp đồng/mỗi ngày chậm trễ**, nhưng tổng mức phạt không vượt quá **8%** giá trị phần nghĩa vụ bị vi phạm (tuân thủ quy định tại Luật Thương mại).
- **Bồi thường thiệt hại**: Bên có lỗi phải bồi thường toàn bộ thiệt hại thực tế, trực tiếp phát sinh do hành vi vi phạm gây ra cho bên còn lại.

*Căn cứ trích dẫn: Trang 8, Mục 9.1 - 9.3 của văn bản.*`,
        pages: [8, 9]
      };
    }

    if (lower.includes('singleton') || lower.includes('factory') || lower.includes('observer') || lower.includes('pattern')) {
      return {
        content: `Theo phân tích trong tài liệu **${docName}**:

- **Mục đích**: Giải quyết bài toán đảm bảo một lớp chỉ có duy nhất một thể hiện (Instance) và cung cấp một điểm truy cập toàn cục đến thể hiện đó.
- **Cách cài đặt chuẩn**:
  1. Đặt Constructor ở phạm vi \`private\` để ngăn chặn việc khởi tạo từ bên ngoài.
  2. Khai báo một biến tĩnh \`static instance\` để lưu trữ thể hiện duy nhất.
  3. Cung cấp phương thức tĩnh \`getInstance()\` có cơ chế đồng bộ hóa (Thread-Safe) khi cần thiết.
- **Ứng dụng thực tế**: Database Connection Pool, Logger, Configuration Manager.

*Căn cứ trích dẫn: Trang 5-6 của tài liệu.*`,
        pages: [5, 6]
      };
    }

    // Default Answer
    return {
      content: `Dựa trên kết quả tra cứu trong văn bản **${docName}** cho câu hỏi: *"@${query}"*:

- Nội dung liên quan được đề cập tại các phần chính của tài liệu.
- Tài liệu quy định các nguyên tắc tuân thủ, điều kiện áp dụng và các bước thực hiện cụ thể.
- Đề nghị bạn đối chiếu thêm với các phụ lục đi kèm để đảm bảo tính chuẩn xác nhất khi vận dụng.

*Căn cứ trích dẫn: Trang 2 và Trang 5 của tài liệu.*`,
      pages: [2, 5]
    };
  }

  private getInitialMockConversations(): PdfConversation[] {
    return [
      {
        id: 'pdf_conv_1',
        title: '01. Gioi thieu Design Patterns.pdf',
        document: {
          name: '01. Gioi thieu Design Patterns.pdf',
          size: '2.4 MB',
          pages: 28,
          uploadDate: '25/09/2026'
        },
        messages: [
          {
            id: 'm_init_summary',
            sender: 'assistant',
            content: `### 📑 Báo Cáo Phân Tích & Tóm Tắt Tài Liệu
**Tài liệu**: \`01. Gioi thieu Design Patterns.pdf\`
**Trạng thái**: Đã phân tích toàn bộ 28 trang tài liệu.

---

### 1. Tổng Quan Tài Liệu
Tài liệu cung cấp kiến thức nền tảng và chuyên sâu về các mẫu thiết kế hướng đối tượng (GoF Design Patterns), phân loại thành 3 nhóm:
- **Creational Patterns**: Singleton, Factory Method, Abstract Factory, Builder.
- **Structural Patterns**: Adapter, Decorator, Facade, Proxy.
- **Behavioral Patterns**: Observer, Strategy, State, Command.

### 2. Các Câu Hỏi Gợi Ý Bạn Có Thể Hỏi
- *"Singleton Pattern hoạt động như thế nào và cách xử lý đa luồng?"*
- *"Khi nào nên sử dụng Factory Method thay vì khởi tạo trực tiếp?"*
- *"Phân biệt Adapter Pattern và Facade Pattern trong tài liệu?"*`,
            timestamp: '14:30',
            isSummary: true,
            pageReferences: [1, 2, 5]
          }
        ],
        isAnalyzing: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'pdf_conv_empty',
        title: 'Cuộc trò chuyện mới',
        document: null,
        messages: [],
        isAnalyzing: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}
