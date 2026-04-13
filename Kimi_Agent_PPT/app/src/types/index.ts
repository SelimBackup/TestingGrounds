export interface ParsedItem {
  type: 'data_row';
  location: string;
  item_type: string;
  width: number;
  length: number;
  faces: number;
  meters: number;
}

export interface ExtractionResponse {
  success: boolean;
  data: ParsedItem[];
  count: number;
}

export interface ApiError {
  error: string;
}
