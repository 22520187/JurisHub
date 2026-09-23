import { Injectable } from '@angular/core';
import { from, Observable, map } from 'rxjs';
import { LegalDocument, loadLegalDocuments } from '../../lib/csv-parser';

export interface LegalDocumentItem {
  id: string;
  type: string;
  typeBadgeColor: 'green' | 'blue' | 'yellow' | 'red' | 'default';
  status: string;
  code: string;
  codeBadgeColor: 'green' | 'blue' | 'yellow' | 'red' | 'default';
  title: string;
  agency: string;
  signer: string;
  issuedDate: string;
  excerpt: string;
  link?: string;
  cleanedContent?: string;
}

export interface AgencyItem {
  id: string;
  name: string;
  count: number;
  percent: number;
}

export interface DocTypeSummary {
  name: string;
  count: number;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  /**
   * Gọi hàm loadLegalDocuments() từ thư viện lib/csv-parser để lấy 50 văn bản từ CSV
   */
  getDocuments(): Observable<LegalDocumentItem[]> {
    return from(loadLegalDocuments()).pipe(
      map(rawDocs => rawDocs.map(doc => this.mapToLegalDocumentItem(doc)))
    );
  }

  private mapToLegalDocumentItem(doc: LegalDocument): LegalDocumentItem {
    return {
      id: doc._id || `doc-${Math.random()}`,
      type: doc.loai_van_ban || 'Văn bản',
      typeBadgeColor: this.getTypeBadgeColor(doc.loai_van_ban),
      status: doc.tinh_trang || 'Đã biết',
      code: doc.so_hieu || '',
      codeBadgeColor: 'blue',
      title: doc.title || 'Văn bản pháp luật',
      agency: doc.noi_ban_hanh || '',
      signer: doc.nguoi_ky || '',
      issuedDate: doc.ngay_ban_hanh || '',
      excerpt: this.generateExcerpt(doc.cleaned_content),
      link: doc.link || '',
      cleanedContent: doc.cleaned_content || ''
    };
  }

  private generateExcerpt(content: string): string {
    if (!content) return '';
    const singleLine = content
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (singleLine.length <= 220) return singleLine;
    return singleLine.substring(0, 220) + '...';
  }

  private getTypeBadgeColor(type: string): 'green' | 'blue' | 'yellow' | 'red' | 'default' {
    if (!type) return 'default';
    switch (type.trim()) {
      case 'Nghị quyết':
        return 'green';
      case 'Quyết định':
        return 'blue';
      case 'Kế hoạch':
        return 'yellow';
      case 'Chỉ thị':
        return 'red';
      default:
        return 'default';
    }
  }
}
