export interface ExtractedData {
  type: 'data_row' | 'section_header';
  slide_num: number;
  section?: string;
  location?: string;
  item_type?: string;
  width?: number;
  length?: number;
  faces?: number;
  meters?: number;
}

export interface ExtractionResponse {
  success: boolean;
  data: ExtractedData[];
  count: number;
}

export interface ApiError {
  error: string;
}
