/**
 * Client-side parser for PPTX and PDF files
 * Pure JavaScript - no backend required
 */

import JSZip from 'jszip';
import * as XLSX from 'xlsx';

export interface ParsedItem {
  type: 'data_row';
  location: string;
  item_type: string;
  width: number;
  length: number;
  faces: number;
  meters: number;
}

// Clean text by normalizing whitespace
function cleanText(text: string): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

// Extract location from various formats
function extractLocation(text: string): string | null {
  // Pattern: -Location : Xxx or Location: Xxx
  const match = text.match(/[-\s]*Location\s*:\s*([^\n]+?)(?=\s*Type:|\s*Size:|\n|$)/i);
  if (match) return cleanText(match[1]);
  
  // Pattern: Word ending with period like "NewCairo."
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?\.$/.test(trimmed)) {
      return trimmed.replace(/\.$/, '');
    }
  }
  
  // Pattern: City name as first line
  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('size:') || lower.startsWith('pixel:') || 
        lower.startsWith('description:') || lower.startsWith('type:') ||
        lower.startsWith('-')) continue;
    if (/^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?$/.test(trimmed)) {
      return trimmed;
    }
  }
  
  return null;
}

// Extract type/description
function extractType(text: string): string | null {
  const match = text.match(/Description\s*:\s*([^\n]+?)(?=\s*Size:|\s*Pixel:|\n|$)/i);
  if (match) return cleanText(match[1]);
  
  const typeMatch = text.match(/[-\s]*Type\s*:\s*([^\n]+?)(?=\s*Size:|\n|$)/i);
  if (typeMatch) return cleanText(typeMatch[1]);
  
  const standalone = text.match(/^\s*(Digital\s+Screen)\s*$/mi);
  if (standalone) return standalone[1];
  
  return null;
}

// Extract size entries with faces
function extractSizeAndFaces(text: string): Array<{width: number, length: number, faces: number}> {
  const entries: Array<{width: number, length: number, faces: number}> = [];
  
  // Pattern: Size: Xm x Ym [– N Face(s)]
  const pattern = /[-\s]*Size\s*:\s*(\d+(?:\.\d+)?)\s*m?\s*[xX]\s*(\d+(?:\.\d+)?)\s*m?\s*(?:[–\-]\s*(\d+)?\s*Face[s]?)?/gi;
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    try {
      const width = parseFloat(match[1]);
      const length = parseFloat(match[2]);
      const faces = match[3] ? parseInt(match[3]) : 1;
      entries.push({ width, length, faces });
    } catch (e) {
      // Skip invalid matches
    }
  }
  
  return entries;
}

// Check if text has meaningful data (contains Size:)
function hasMeaningfulData(text: string): boolean {
  return /[-\s]*size\s*:/i.test(text);
}

// Parse PPTX file
export async function parsePPTX(file: File): Promise<ParsedItem[]> {
  const items: ParsedItem[] = [];
  
  try {
    const zip = await JSZip.loadAsync(file);
    
    // Get presentation.xml to find slide order
    const presentationXml = await zip.file('ppt/presentation.xml')?.async('text');
    if (!presentationXml) throw new Error('Invalid PPTX file');
    
    // Extract slide relationships
    const slideRegex = /<p:sldId[^>]*id="(\d+)"[^>]*r:id="(rId\d+)"/g;
    const slides: Array<{id: string, rId: string}> = [];
    let match;
    while ((match = slideRegex.exec(presentationXml)) !== null) {
      slides.push({ id: match[1], rId: match[2] });
    }
    
    // Get slide paths from presentation.xml.rels
    const relsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('text');
    if (!relsXml) throw new Error('Invalid PPTX file');
    
    const slidePaths: Record<string, string> = {};
    const relRegex = /<Relationship[^>]*Id="(rId\d+)"[^>]*Target="([^"]+)"/g;
    while ((match = relRegex.exec(relsXml)) !== null) {
      slidePaths[match[1]] = match[2];
    }
    
    let currentSection: string | null = null;
    
    // Process each slide in order
    for (const slideInfo of slides) {
      const slidePath = `ppt/${slidePaths[slideInfo.rId]}`;
      const slideXml = await zip.file(slidePath)?.async('text');
      if (!slideXml) continue;
      
      // Extract all text from slide
      const textMatches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
      const texts = textMatches.map(m => m.replace(/<\/?a:t>/g, ''));
      const fullText = texts.join('\n');
      
      // Check for section header (single line, no size info)
      const isSectionHeader = texts.length === 1 && 
                              texts[0].length < 50 && 
                              !/size:|pixel:|description:/i.test(texts[0]) &&
                              !/night vision|digital screen/i.test(texts[0]) &&
                              /^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?$/.test(texts[0]);
      
      if (isSectionHeader) {
        currentSection = texts[0];
        continue;
      }
      
      // Skip slides without meaningful data
      if (!hasMeaningfulData(fullText)) continue;
      
      // Extract data
      const location = extractLocation(fullText) || currentSection || 'N/A';
      const itemType = extractType(fullText) || 'Digital Screen';
      const sizeEntries = extractSizeAndFaces(fullText);
      
      for (const entry of sizeEntries) {
        items.push({
          type: 'data_row',
          location,
          item_type: itemType,
          width: entry.width,
          length: entry.length,
          faces: entry.faces,
          meters: Math.round(entry.width * entry.length * 100) / 100
        });
      }
    }
  } catch (error) {
    console.error('Error parsing PPTX:', error);
    throw new Error('Failed to parse PPTX file');
  }
  
  return items;
}

// Parse PDF file using pdf.js
export async function parsePDF(file: File): Promise<ParsedItem[]> {
  const items: ParsedItem[] = [];
  
  try {
    const pdfjs = await import('pdfjs-dist');
    
    // Set worker source (using CDN)
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let currentSection: string | null = null;
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const fullText = textContent.items.map((item: any) => item.str).join('\n');
      
      // Check for section header
      const lines = fullText.split('\n').filter(l => l.trim());
      if (lines.length === 1 && lines[0].length < 50 && 
          !/size:|pixel:|description:/i.test(lines[0]) &&
          !/night vision|digital screen/i.test(lines[0]) &&
          /^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?$/.test(lines[0])) {
        currentSection = lines[0];
        continue;
      }
      
      // Skip slides without meaningful data
      if (!hasMeaningfulData(fullText)) continue;
      
      // Extract data
      const location = extractLocation(fullText) || currentSection || 'N/A';
      const itemType = extractType(fullText) || 'Digital Screen';
      const sizeEntries = extractSizeAndFaces(fullText);
      
      for (const entry of sizeEntries) {
        items.push({
          type: 'data_row',
          location,
          item_type: itemType,
          width: entry.width,
          length: entry.length,
          faces: entry.faces,
          meters: Math.round(entry.width * entry.length * 100) / 100
        });
      }
    }
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
  
  return items;
}

// Generate Excel file
export function generateExcel(items: ParsedItem[]): void {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet with headers
  const wsData: (string | number | null)[][] = [];
  wsData.push(['Location', 'Type', 'Width (m)', 'Length (m)', 'Faces', 'Meters', 'Unit Price', 'Print']);
  
  // Add data rows (with values only, formulas will be added separately)
  items.forEach((item) => {
    wsData.push([
      item.location,
      item.item_type,
      item.width,
      item.length,
      item.faces,
      item.meters, // Pre-calculated meters value
      null, // Unit Price - empty for manual entry
      null  // Print - will be formula
    ]);
  });
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Add formulas to cells
  for (let i = 0; i < items.length; i++) {
    const rowIndex = i + 2; // Excel rows are 1-indexed, header is row 1
    
    // Meters formula (column F = D * E)
    const metersCell = XLSX.utils.encode_cell({ r: rowIndex - 1, c: 5 });
    (ws as any)[metersCell] = { f: `D${rowIndex}*E${rowIndex}`, t: 'n' };
    
    // Print formula (column I = D * E * F * H)
    const printCell = XLSX.utils.encode_cell({ r: rowIndex - 1, c: 8 });
    (ws as any)[printCell] = { f: `D${rowIndex}*E${rowIndex}*F${rowIndex}*H${rowIndex}`, t: 'n' };
  }
  
  // Add grand total row
  const lastDataRow = items.length + 1;
  const totalRowIndex = lastDataRow + 1;
  
  wsData.push(['GRAND TOTAL', '', '', '', '', '', '', '']);
  
  // Update worksheet with total row
  const totalCell = XLSX.utils.encode_cell({ r: totalRowIndex - 1, c: 8 });
  (ws as any)[totalCell] = { f: `SUM(I2:I${lastDataRow})`, t: 'n' };
  
  // Merge cells for total label
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({
    s: { r: totalRowIndex - 1, c: 0 },
    e: { r: totalRowIndex - 1, c: 7 }
  });
  
  // Set column widths
  ws['!cols'] = [
    { wch: 35 }, // Location
    { wch: 20 }, // Type
    { wch: 12 }, // Width
    { wch: 12 }, // Length
    { wch: 10 }, // Faces
    { wch: 12 }, // Meters
    { wch: 14 }, // Unit Price
    { wch: 16 }  // Print
  ];
  
  // Set worksheet range
  const range = { s: { r: 0, c: 0 }, e: { r: totalRowIndex - 1, c: 8 } };
  ws['!ref'] = XLSX.utils.encode_range(range);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Quotation');
  
  // Generate filename
  const filename = `quotation_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Download file
  XLSX.writeFile(wb, filename);
}

// Main parse function that detects file type
export async function parseFile(file: File): Promise<ParsedItem[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'pptx') {
    return parsePPTX(file);
  } else if (extension === 'pdf') {
    return parsePDF(file);
  } else {
    throw new Error('Unsupported file type. Only PPTX and PDF files are allowed.');
  }
}
