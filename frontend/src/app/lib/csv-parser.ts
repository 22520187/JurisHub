export interface LegalDocument {
  _id: string;
  link: string;
  title: string;
  so_hieu: string;
  loai_van_ban: string;
  noi_ban_hanh: string;
  nguoi_ky: string;
  ngay_ban_hanh: string;
  tinh_trang: string;
  danh_sach_bang: string;
  van_ban_duoc_dan: string;
  cleaned_content: string;
  full_text_for_embedding: string;
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current);
  
  return result;
}

export function parseCSV(csvText: string): LegalDocument[] {
  const rows: string[] = [];
  let currentRow = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < csvText.length) {
    const char = csvText[i];
    
    if (char === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        currentRow += '""';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        currentRow += char;
        i++;
      }
    } else if (char === '\n' && !inQuotes) {
      if (currentRow.trim()) {
        rows.push(currentRow.trim());
      }
      currentRow = '';
      i++;
    } else {
      currentRow += char;
      i++;
    }
  }
  
  if (currentRow.trim()) {
    rows.push(currentRow.trim());
  }

  if (rows.length === 0) return [];
  
  const headers = parseCSVLine(rows[0]);
  const documents: LegalDocument[] = [];

  for (let i = 1; i < rows.length && i <= 50; i++) { // Chỉ lấy 50 rows đầu
    const values = parseCSVLine(rows[i]);
    
    if (values.length >= headers.length) {
      const doc: Record<string, string> = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        value = value.replace(/""/g, '"'); // Unescape quotes
        doc[header] = value;
      });
      documents.push(doc as unknown as LegalDocument);
    }
  }

  return documents;
}

export async function loadLegalDocuments(): Promise<LegalDocument[]> {
  try {
    console.log('Loading CSV file...');
    const response = await fetch('/50_dataset_van_ban_phap_luat.csv');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    console.log('CSV file loaded, size:', csvText.length);
    
    const documents = parseCSV(csvText);
    console.log('Parsed documents:', documents.length);
    console.log('First document:', documents[0]);
    
    return documents;
  } catch (error) {
    console.error('Error loading legal documents:', error);
    return [];
  }
}
