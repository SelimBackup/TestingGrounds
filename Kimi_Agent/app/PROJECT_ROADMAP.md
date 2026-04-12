# Project Roadmap: Presentation to Excel Quotation Generator

## Executive Summary

This document outlines the architecture, implementation details, and future enhancements for the Presentation to Excel Quotation Generator web application.

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                     React Frontend                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ File Upload │  │ Price Input │  │ Data Preview Table      │  │
│  │ (Dropzone)  │  │  (Numeric)  │  │ (Section Headers + Rows)│  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ API Calls (REST)
┌───────────────────────────▼─────────────────────────────────────┐
│                     Flask Backend                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ PPTX Parser │  │ PDF Parser  │  │ Excel Generator         │  │
│  │(python-pptx)│  │(pdfplumber) │  │ (OpenPyXL + Formulas)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

1. **Upload Phase**: User uploads PPTX/PDF file via drag-and-drop
2. **Extraction Phase**: Backend parses file and extracts structured data
3. **Preview Phase**: Frontend displays extracted data with section headers
4. **Configuration Phase**: User sets base price per meter
5. **Generation Phase**: Backend creates Excel with live formulas
6. **Download Phase**: User receives formatted Excel quotation

## 2. Technical Implementation

### 2.1 Frontend (React + TypeScript)

**Key Components:**
- `App.tsx`: Main application container with state management
- `services/api.ts`: API client for backend communication
- `types/index.ts`: TypeScript type definitions

**State Management:**
```typescript
interface AppState {
  file: File | null;                    // Uploaded file
  unitPrice: string;                    // Base price input
  extractedData: ExtractedData[];       // Parsed data from backend
  isExtracting: boolean;                // Loading state for extraction
  isGenerating: boolean;                // Loading state for Excel generation
}
```

**UI Components (shadcn/ui):**
- Card: Container components
- Button: Action triggers
- Input: Price entry
- Alert: Status notifications
- Badge: Data counts
- ScrollArea: Data preview table
- Separator: Visual dividers

### 2.2 Backend (Python Flask)

**Core Modules:**

#### 2.2.1 PPTX Parser (`extract_data_from_pptx`)
```python
def extract_data_from_pptx(file_path: str) -> List[Dict]:
    """
    Parses PowerPoint slides to extract:
    - Section headers (title shapes with < 50 chars)
    - Data rows (Location, Type, Width, Length, Meters)
    
    Returns: List of dicts with 'type' field distinguishing headers from data
    """
```

**Algorithm:**
1. Iterate through all slides in presentation
2. For each slide, extract text from all shapes
3. Identify section headers by shape type and text length
4. Apply regex patterns to extract data fields
5. Auto-calculate meters if width × length available

#### 2.2.2 PDF Parser (`extract_data_from_pdf`)
```python
def extract_data_from_pdf(file_path: str) -> List[Dict]:
    """
    Parses PDF pages using pdfplumber
    Similar output format to PPTX parser for consistency
    """
```

**Algorithm:**
1. Open PDF with pdfplumber
2. Extract text from each page
3. Check first few lines for section headers
4. Apply same regex patterns as PPTX parser

#### 2.2.3 Data Parser (`parse_slide_data`)

**Regex Patterns:**

| Field | Patterns | Example Match |
|-------|----------|---------------|
| Location | `Location:`, `Loc:`, `Site:`, `Place:` | "Location: Main Highway" |
| Type | `Type:`, `Category:`, `Item Type:` | "Type: Asphalt Road" |
| Width | `Width:`, `W:` | "Width: 12" → 12.0 |
| Length | `Length:`, `L:` | "Length: 5000" → 5000.0 |
| Meters | `Meters:`, `Qty:`, `Quantity:` | "Meters: 60000" → 60000.0 |

**Auto-Calculation Logic:**
```python
if meters is None and width is not None and length is not None:
    meters = width * length
```

#### 2.2.4 Excel Generator (`generate_excel_quotation`)

**Column Structure:**
| Col | Header | Content Type | Formula |
|-----|--------|--------------|---------|
| B | Location | Static text | - |
| C | Type | Static text | - |
| D | Width (m) | Numeric | - |
| E | Length (m) | Numeric | - |
| F | Meters | Numeric | - |
| G | Unit Price | Formula | `=$C$4` |
| H | Total Price | Formula | `=F{row}*G{row}` |

**Formula Strategy:**
- Unit Price column references cell C4 (user-editable base price)
- Total Price uses relative references for per-row calculation
- Grand Total uses SUMIF to exclude section header rows

**Styling:**
- Headers: Dark blue background (#1F4E79), white text
- Section headers: Light blue background (#D9E1F2), blue text
- Currency values: Blue font (#0066CC)
- Borders: Thin gray for all data cells

### 2.3 API Endpoints

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/api/health` | GET | Health check | - | `{status: "healthy"}` |
| `/api/extract` | POST | Extract data preview | `multipart/form-data` with file | JSON with extracted data |
| `/api/generate` | POST | Generate Excel | `multipart/form-data` with file + unitPrice | Excel file download |

## 3. Project Structure

```
/mnt/okcomputer/output/app/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── uploads/               # Temporary upload storage
│   └── outputs/               # Generated Excel files
├── src/
│   ├── App.tsx               # Main React component
│   ├── services/
│   │   └── api.ts            # API client
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── components/ui/        # shadcn/ui components
├── dist/                     # Built frontend (production)
├── start.sh                  # Development startup script
├── deploy.sh                 # Production deployment script
├── README.md                 # User documentation
└── PROJECT_ROADMAP.md        # This document
```

## 4. Deployment Options

### 4.1 Development Mode
```bash
./start.sh
# Starts:
# - Flask backend on http://localhost:5000
# - React dev server on http://localhost:5173
```

### 4.2 Production Mode (Single Server)
```bash
npm run build          # Build frontend
cd backend
pip install -r requirements.txt
gunicorn -w 4 -b 0.0.0.0:5000 app:app
# Serves both API and static frontend on port 5000
```

### 4.3 Docker Deployment
```dockerfile
# Multi-stage build recommended
# Stage 1: Build React frontend
# Stage 2: Python + Flask with copied frontend
```

## 5. Future Enhancements

### 5.1 Short Term (v1.1)
- [ ] Support for more field patterns (custom regex configuration)
- [ ] Bulk upload (multiple files at once)
- [ ] Excel template selection (different output formats)
- [ ] Data validation warnings (missing fields detection)

### 5.2 Medium Term (v1.2)
- [ ] User authentication and saved configurations
- [ ] History of generated quotations
- [ ] Multi-language support (i18n)
- [ ] Cloud storage integration (S3, Google Drive)

### 5.3 Long Term (v2.0)
- [ ] AI-powered field detection (no regex needed)
- [ ] OCR for image-based presentations
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)

## 6. Testing Strategy

### 6.1 Unit Tests
```python
# Test parsers with sample data
def test_parse_slide_data():
    text = "Location: Test\nWidth: 10\nLength: 20"
    result = parse_slide_data(text, 1)
    assert result['location'] == "Test"
    assert result['meters'] == 200.0  # Auto-calculated
```

### 6.2 Integration Tests
- End-to-end file upload → Excel download flow
- Formula validation in generated Excel
- Error handling for corrupted files

### 6.3 Performance Tests
- Large file handling (100+ slides)
- Concurrent user load
- Memory usage optimization

## 7. Security Considerations

- File type validation (whitelist: .pptx, .pdf)
- File size limits (50MB max)
- Secure filename handling (werkzeug.secure_filename)
- Temporary file cleanup after processing
- CORS configuration for production

## 8. Monitoring & Logging

Recommended additions:
- Structured logging (JSON format)
- Request/response timing
- Error tracking (Sentry integration)
- Usage metrics (files processed, generation time)

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintainer:** Development Team
