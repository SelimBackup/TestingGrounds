import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Upload, 
  Download, 
  Loader2, 
  Table2, 
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseFile, generateExcel, type ParsedItem } from '@/services/parser';
import { Toaster, toast } from 'sonner';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ParsedItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      const validExtensions = ['.pptx', '.pdf'];
      const fileExtension = uploadedFile.name.slice(uploadedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Please upload a PPTX or PDF file');
        return;
      }
      
      setFile(uploadedFile);
      setExtractedData([]);
      
      // Auto-extract data
      setIsExtracting(true);
      try {
        const result = await parseFile(uploadedFile);
        setExtractedData(result);
        toast.success(`Extracted ${result.length} data rows from presentation`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to extract data');
      } finally {
        setIsExtracting(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    noClick: true,
  });

  const handleGenerateExcel = async () => {
    if (!file) {
      toast.error('Please upload a file first');
      return;
    }

    if (extractedData.length === 0) {
      toast.error('No data to generate Excel');
      return;
    }

    setIsGenerating(true);
    try {
      generateExcel(extractedData);
      toast.success('Excel quotation generated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate Excel');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setExtractedData([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Presentation to Excel Quotation</h1>
              <p className="text-sm text-slate-500">Extract data from PPTX/PDF and generate Excel quotations (Client-side)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Upload & Settings */}
          <div className="space-y-6">
            
            {/* File Upload Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Upload Presentation
                </CardTitle>
                <CardDescription>
                  Upload a PPTX or PDF file containing billboard data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                    ${isDragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                    }
                    ${file ? 'bg-green-50 border-green-300' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {!file ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-700 font-medium">
                          {isDragActive ? 'Drop the file here' : 'Drag & drop your file here'}
                        </p>
                        <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={open}
                        className="mt-2"
                      >
                        Select File
                      </Button>
                      <p className="text-xs text-slate-400">Supports: .pptx, .pdf</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="text-green-800 font-medium">{file.name}</p>
                        <p className="text-green-600 text-sm">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                        className="text-slate-500 hover:text-red-500"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                {isExtracting && (
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Extracting data from presentation...
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  Excel Output
                </CardTitle>
                <CardDescription>
                  Generated Excel structure with live formulas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Column Structure</h4>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {['Location', 'Type', 'Width', 'Length', 'Faces', 'Meters', 'Unit Price', 'Print'].map((col, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded px-2 py-1.5 text-center text-slate-600">
                        {col}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Print = Width × Length × Faces × Unit Price (auto-calculates)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Unit Price column is empty - fill it in after downloading
                  </p>
                </div>

                <Separator />

                <div className="text-sm text-slate-600">
                  <p className="font-medium mb-1">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Upload your PPTX or PDF presentation</li>
                    <li>Data is extracted directly in your browser</li>
                    <li>Click Generate to download the Excel file</li>
                    <li>Fill in Unit Price values in the downloaded file</li>
                    <li>Print column auto-calculates the totals</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateExcel}
              disabled={!file || extractedData.length === 0 || isGenerating}
              className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Excel...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Generate Excel Quotation
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Table2 className="w-5 h-5 text-purple-600" />
                    Data Preview
                  </CardTitle>
                  {extractedData.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {extractedData.length} rows
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Preview extracted data before generating the Excel file
                </CardDescription>
              </CardHeader>
              <CardContent>
                {extractedData.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Upload a file to see data preview</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Location</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Type</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700">Width</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700">Length</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700">Faces</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700">Meters</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extractedData.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-700">{item.location}</td>
                            <td className="px-4 py-3 text-slate-600">{item.item_type}</td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {item.width.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {item.length.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {item.faces}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {item.meters.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/50 border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Supported Formats</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    PowerPoint (.pptx) and PDF files with structured data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Table2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Live Formulas</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Generated Excel contains active formulas for auto-calculation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Client-Side</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    All processing happens in your browser - no server needed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default App;
