# Presentation to Excel Quotation Generator

A pure client-side web application that extracts billboard data from PPTX/PDF presentations and generates Excel quotations with live formulas.

**No backend server required** - everything runs in your browser!

## Features

- **Client-Side Processing**: All parsing and Excel generation happens in your browser
- **PPTX Support**: Extracts data from PowerPoint presentations
- **PDF Support**: Extracts data from PDF files
- **Live Excel Formulas**: Generated Excel contains formulas that auto-calculate
- **Faces Column**: Extracts number of faces from billboard descriptions
- **Print Calculation**: `Width × Length × Faces × Unit Price`

## How It Works

1. Upload your PPTX or PDF presentation
2. Data is extracted directly in your browser using JavaScript
3. Preview the extracted data
4. Click "Generate Excel" to download the quotation file
5. Fill in Unit Price values in the downloaded Excel
6. Print column auto-calculates totals

## Excel Output Structure

| Column | Content | Formula |
|--------|---------|---------|
| Location | Static | - |
| Type | Static | - |
| Width (m) | Static | - |
| Length (m) | Static | - |
| Faces | Static | - |
| Meters | Formula | `=Width×Length` |
| Unit Price | **EMPTY** | Fill manually |
| Print | Formula | `=Width×Length×Faces×UnitPrice` |

## Supported Data Formats

The parser recognizes these patterns in your presentations:

```
Location: New Cairo
Description: Jumia
Size: 8m x 17m – 1 Face

-Location : Galleria Mall
-Type: Twin-pole
-Size : 10m x 19m – Digital Screen
```

## Deployment

### Netlify (Recommended)

1. Push code to GitHub
2. Connect repo to Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy!

### Any Static Host

The `dist/` folder contains a fully static website that can be deployed anywhere:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Any web server

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technologies Used

- **React + TypeScript + Vite** - Frontend framework
- **Tailwind CSS + shadcn/ui** - Styling
- **JSZip** - PPTX file parsing
- **pdfjs-dist** - PDF file parsing
- **SheetJS (xlsx)** - Excel generation
- **react-dropzone** - File upload

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge
- Firefox
- Safari

## Privacy

Your files are processed entirely in your browser. **No data is sent to any server**.
