import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  ButtonComponent,
  BadgeComponent,
  CustomInputComponent,
  SelectDropdownComponent,
  SelectOption,
  ScrollToTopComponent,
  ModalCustomComponent
} from '../../shared/components';
import { AuthService } from '../../core/services/auth.service';
import { DocumentService, LegalDocumentItem, AgencyItem, DocTypeSummary } from '../../core/services/document.service';

export interface CategoryItem {
  id: string;
  tag: string;
  name: string;
  count: number;
  percent: number;
  tagBg?: string;
  tagColor?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    BadgeComponent,
    CustomInputComponent,
    SelectDropdownComponent,
    ScrollToTopComponent,
    ModalCustomComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly documentService = inject(DocumentService);
  private readonly router = inject(Router);

  // Search models
  heroSearchKeyword: string = '';
  docSearchKeyword: string = '';
  selectedDocTypeValue: any = 'all';

  // Dropdown options
  readonly docTypeOptions: SelectOption[] = [
    { label: 'Tất cả loại', value: 'all' },
    { label: 'Nghị quyết', value: 'Nghị quyết' },
    { label: 'Quyết định', value: 'Quyết định' },
    { label: 'Kế hoạch', value: 'Kế hoạch' },
    { label: 'Chỉ thị', value: 'Chỉ thị' },
    { label: 'Thông tư', value: 'Thông tư' }
  ];

  // News ticker
  readonly breakingNews = {
    badge: 'NÓNG',
    content: 'Bộ Tư pháp ban hành Thông tư 04/2024 về quy định mới trong đăng ký kinh doanh',
    link: '#'
  };

  // Stats Bar (Tự động cập nhật từ dữ liệu CSV)
  stats = [
    { value: '50', label: 'Văn bản pháp luật' },
    { value: '13', label: 'Cơ quan ban hành' },
    { value: '0', label: 'Văn bản hiệu lực' },
    { value: '24/7', label: 'Cập nhật thường xuyên' }
  ];

  // Lĩnh vực pháp luật (8 categories matching screenshots)
  readonly categories: CategoryItem[] = [
    { id: '1', tag: 'Bo-may-hanh-chinh', name: 'Bộ máy hành chính', count: 10, percent: 20.0, tagBg: '#dbeafe', tagColor: '#1d4ed8' },
    { id: '2', tag: 'Tai-chinh-nha-nuoc', name: 'Tài chính nhà nước', count: 10, percent: 20.0, tagBg: '#e0e7ff', tagColor: '#4338ca' },
    { id: '3', tag: 'Thue-Phi-Le-Phi', name: 'Thuế - Phí - Lệ phí', count: 9, percent: 18.0, tagBg: '#fee2e2', tagColor: '#b91c1c' },
    { id: '4', tag: 'Thuong-mai', name: 'Thương mại', count: 5, percent: 10.0, tagBg: '#f1f5f9', tagColor: '#475569' },
    { id: '5', tag: 'Dau-tu', name: 'Đầu tư', count: 3, percent: 6.0, tagBg: '#f1f5f9', tagColor: '#475569' },
    { id: '6', tag: 'Bat-dong-san', name: 'Bat dong san', count: 3, percent: 6.0, tagBg: '#f1f5f9', tagColor: '#475569' },
    { id: '7', tag: 'Giao-duc', name: 'Giáo dục', count: 2, percent: 4.0, tagBg: '#fce7f3', tagColor: '#be185d' },
    { id: '8', tag: 'Tai-nguyen-Moi-truong', name: 'Tai nguyen Moi truong', count: 2, percent: 4.0, tagBg: '#f1f5f9', tagColor: '#475569' }
  ];

  // Cơ quan ban hành phổ biến (Được tổng hợp từ CSV)
  popularAgencies: AgencyItem[] = [
    { id: 'ag-1', name: 'Tỉnh An Giang', count: 13, percent: 65 },
    { id: 'ag-2', name: 'Tỉnh Đồng Tháp', count: 11, percent: 55 },
    { id: 'ag-3', name: 'Tỉnh Lai Châu', count: 11, percent: 55 },
    { id: 'ag-4', name: 'Tỉnh Bình Định', count: 3, percent: 15 },
    { id: 'ag-5', name: 'Tỉnh Quảng Nam', count: 3, percent: 15 }
  ];

  // Loại văn bản phổ biến (Được tổng hợp từ CSV)
  popularDocTypes: DocTypeSummary[] = [
    { name: 'Nghị quyết', count: 36, icon: 'bi bi-file-text' },
    { name: 'Quyết định', count: 11, icon: 'bi bi-check2-circle' },
    { name: 'Kế hoạch', count: 2, icon: 'bi bi-calendar3' },
    { name: 'Chỉ thị', count: 1, icon: 'bi bi-exclamation-triangle' }
  ];

  // Master documents list loaded from CSV
  allDocuments: LegalDocumentItem[] = [];
  isLoadingDocuments: boolean = true;

  // Pagination
  currentPage: number = 1;
  readonly pageSize: number = 10;

  // Modal xem chi tiết
  isDetailModalOpen: boolean = false;
  selectedDoc: LegalDocumentItem | null = null;

  ngOnInit(): void {
    this.loadDocumentsFromCSV();
  }

  loadDocumentsFromCSV(): void {
    this.isLoadingDocuments = true;
    this.documentService.getDocuments().subscribe({
      next: docs => {
        this.allDocuments = docs;
        this.isLoadingDocuments = false;

        // Cập nhật số liệu thống kê từ CSV
        this.stats[0].value = String(docs.length);

        // Tính toán danh sách cơ quan ban hành phổ biến từ CSV
        this.computeAgencies(docs);

        // Tính toán loại văn bản phổ biến từ CSV
        this.computeDocTypes(docs);
      },
      error: err => {
        console.error('Lỗi khi đọc file CSV văn bản pháp luật:', err);
        this.isLoadingDocuments = false;
      }
    });
  }

  private computeAgencies(docs: LegalDocumentItem[]): void {
    const agencyMap = new Map<string, number>();
    docs.forEach(d => {
      if (d.agency) {
        agencyMap.set(d.agency, (agencyMap.get(d.agency) || 0) + 1);
      }
    });

    // Cập nhật tổng số cơ quan ban hành
    this.stats[1].value = String(agencyMap.size);

    // Lấy top 5 cơ quan
    const sorted = Array.from(agencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
    this.popularAgencies = sorted.map(([name, count], idx) => ({
      id: `ag-${idx}`,
      name,
      count,
      percent: Math.round((count / maxCount) * 100)
    }));
  }

  private computeDocTypes(docs: LegalDocumentItem[]): void {
    const typeMap = new Map<string, number>();
    docs.forEach(d => {
      if (d.type) {
        typeMap.set(d.type, (typeMap.get(d.type) || 0) + 1);
      }
    });

    const iconMap: Record<string, string> = {
      'Nghị quyết': 'bi bi-file-text',
      'Quyết định': 'bi bi-check2-circle',
      'Kế hoạch': 'bi bi-calendar3',
      'Chỉ thị': 'bi bi-exclamation-triangle',
      'Thông tư': 'bi bi-file-earmark-ruled'
    };

    const sorted = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]);
    this.popularDocTypes = sorted.map(([name, count]) => ({
      name,
      count,
      icon: iconMap[name] || 'bi bi-file-earmark-text'
    }));
  }

  // Filtered documents theo tìm kiếm và dropdown
  get filteredDocuments(): LegalDocumentItem[] {
    let list = this.allDocuments;
    const query = (this.docSearchKeyword || '').trim().toLowerCase();

    if (query) {
      list = list.filter(
        d =>
          d.title.toLowerCase().includes(query) ||
          d.code.toLowerCase().includes(query) ||
          d.agency.toLowerCase().includes(query) ||
          d.signer.toLowerCase().includes(query) ||
          d.excerpt.toLowerCase().includes(query)
      );
    }

    if (this.selectedDocTypeValue && this.selectedDocTypeValue !== 'all') {
      list = list.filter(d => d.type === this.selectedDocTypeValue);
    }

    return list;
  }

  // Documents sau phân trang (10 văn bản / trang)
  get paginatedDocuments(): LegalDocumentItem[] {
    const filtered = this.filteredDocuments;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    const total = Math.ceil(this.filteredDocuments.length / this.pageSize);
    return total > 0 ? total : 1;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Navigation & Actions
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  onHeroSearch(): void {
    if (this.heroSearchKeyword) {
      this.docSearchKeyword = this.heroSearchKeyword;
    }
    this.currentPage = 1;
    this.scrollToElement('latest-documents-section');
  }

  scrollToElement(elementId: string): void {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onDocTypeFilterChange(selected: any): void {
    this.selectedDocTypeValue = selected;
    this.currentPage = 1;
  }

  filterByCategory(cat: CategoryItem): void {
    this.docSearchKeyword = cat.name;
    this.currentPage = 1;
    this.scrollToElement('latest-documents-section');
  }

  filterByAgency(agency: AgencyItem): void {
    this.docSearchKeyword = agency.name;
    this.currentPage = 1;
    this.scrollToElement('latest-documents-section');
  }

  filterByDocTypeSummary(type: DocTypeSummary): void {
    this.selectedDocTypeValue = type.name;
    this.currentPage = 1;
    this.scrollToElement('latest-documents-section');
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.scrollToElement('latest-documents-section');
    }
  }

  handleViewDetail(doc: LegalDocumentItem): void {
    this.selectedDoc = doc;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedDoc = null;
  }

  handleDownload(doc: LegalDocumentItem): void {
    const filename = `${doc.code.replace(/[^a-zA-Z0-9_-]/g, '_') || 'van_ban'}.txt`;
    const content = `TIÊU ĐỀ: ${doc.title}\nSỐ HIỆU: ${doc.code}\nLOẠI: ${doc.type}\nCƠ QUAN BAN HÀNH: ${doc.agency}\nNGƯỜI KÝ: ${doc.signer}\nNGÀY BAN HÀNH: ${doc.issuedDate}\n\nNỘI DUNG:\n${doc.cleanedContent || doc.excerpt}`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  handleSource(doc: LegalDocumentItem): void {
    if (doc.link) {
      window.open(doc.link, '_blank');
    } else {
      alert(`Văn bản ${doc.code} không có đường dẫn nguồn gốc.`);
    }
  }

  handleQuickAction(action: string): void {
    switch (action) {
      case 'question':
        alert('Chức năng: Đặt câu hỏi pháp lý');
        break;
      case 'ai-lawyer':
        alert('Chức năng: Chat với AI Lawyer');
        break;
      case 'search-doc':
        this.scrollToElement('latest-documents-section');
        break;
      case 'find-lawyer':
        alert('Chức năng: Tìm luật sư');
        break;
      default:
        break;
    }
  }
}
