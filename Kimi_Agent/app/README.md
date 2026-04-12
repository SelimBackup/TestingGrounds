# Presentation to Excel Quotation Generator

A full-stack web application that extracts structured data from presentation files (PPTX/PDF) and generates professional Excel quotations with live formulas.

## Features

- **File Upload**: Drag-and-drop interface for PPTX and PDF files
- **Data Extraction**: Automatically extracts Location, Type, Width, Length, and Meters
- **Section Recognition**: Identifies section headers (e.g., "Ring Road") as row separators
- **Live Excel Formulas**: Generated Excel files contain active formulas for automatic recalculation
- **Professional Formatting**: Clean, styled Excel output with headers and section dividers

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui components
- react-dropzone (file upload)
- Lucide React (icons)

### Backend
- Python Flask
- python-pptx (PPTX parsing)
- pdfplumber (PDF parsing)
- OpenPyXL (Excel generation with formulas)

## Project Structure

```
app/
├── backend/
│   ├── app.py              # Flask API with parsing and Excel generation logic
│   ├── uploads/            # Temporary upload storage
│   └── outputs/            # Generated Excel files
├── src/
│   ├── App.tsx             # Main React component
│   ├── services/
│   │   └── api.ts          # API client functions
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   └── components/ui/      # shadcn/ui components
├── dist/                   # Built frontend files
├── start.sh                # Startup script
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.8+
- pip

### 1. Clone and Navigate
```bash
cd /mnt/okcomputer/output/app
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Python Dependencies
```bash
pip install flask flask-cors python-pptx pdfplumber openpyxl
```

### 4. Start the Application

**Option A: Using the startup script (recommended)**
```bash
./start.sh
```

**Option B: Manual startup**
```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend (from project root)
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

### Health Check
```
GET /api/health
```

### Extract Data (Preview)
```
POST /api/extract
Content-Type: multipart/form-data
Body: { file: <PPTX or PDF file> }

Response: {
  success: true,
  data: [...],
  count: 5
}
```

### Generate Excel
```
POST /api/generate
Content-Type: multipart/form-data
Body: { 
  file: <PPTX or PDF file>,
  unitPrice: <number>
}

Response: Excel file download
```

## Data Extraction Logic

### Supported Field Patterns

The parser looks for the following patterns in your presentation:

| Field | Patterns Recognized |
|-------|---------------------|
| Location | "Location:", "Loc:", "Site:", "Place:" |
| Type | "Type:", "Category:", "Item Type:" |
| Width | "Width:", "W:" (followed by number) |
| Length | "Length:", "L:" (followed by number) |
| Meters | "Meters:", "Meterage:", "Qty:", "Quantity:", "Total Meters:" |

### Section Headers
Slides with short text (less than 50 characters) in title shapes are recognized as section headers.

### Auto-Calculation
If Meters is not found but Width and Length are present, Meters is automatically calculated as Width × Length.

## Excel Output Structure

| Column | Content | Formula |
|--------|---------|---------|
| A | (padding) | - |
| B | Location | Static value |
| C | Type | Static value |
| D | Width (m) | Static value |
| E | Length (m) | Static value |
| F | Meters | Static value |
| G | Unit Price | `=$C$4` (references input price) |
| H | Total Price | `=F*G` (Meters × Unit Price) |

### Formula Behavior
- Changing the **Base Price per Meter** in cell C4 updates all Unit Price cells
- Modifying individual **Unit Price** cells updates only that row's Total Price
- Changing **Meters** values recalculates the Total Price automatically

## Example Input Format

Your presentation slides should contain data in this format:

```
Location: Main Highway
Type: Asphalt Road
Width: 12
Length: 5000
Meters: 60000
```

Or with calculated meters:
```
Location: Ring Road Section A
Type: Concrete Road  
Width: 10
Length: 3000
```
(Meters will be auto-calculated as 10 × 3000 = 30000)

## Customization

### Modifying Field Patterns
Edit the regex patterns in `backend/app.py` in the `parse_slide_data()` function:

```python
location_patterns = [
    r'[Ll]ocation[:\s]+([^\n,]+)',
    # Add your custom pattern here
]
```

### Changing Excel Styling
Modify the `generate_excel_quotation()` function in `backend/app.py`:

```python
# Change header color
header_fill = PatternFill(start_color="YOUR_COLOR", ...)

# Modify column widths
column_widths = {
    'B': 30,  # Wider Location column
    ...
}
```

## Troubleshooting

### "No data could be extracted"
- Check that your presentation follows the supported field patterns
- Ensure field labels are clearly visible and not in images
- Try using explicit "Meters:" field instead of relying on auto-calculation

### Excel formulas not working
- Ensure you're using Microsoft Excel 2013+ or compatible software
- Some mobile spreadsheet apps may not support all formula features

### CORS errors
- Ensure both frontend and backend are running
- Check that the backend is accessible at http://localhost:5000

## License

MIT License - Free for personal and commercial use.
