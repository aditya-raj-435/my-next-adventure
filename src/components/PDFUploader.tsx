import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, X } from "lucide-react";

interface PDFUploaderProps {
  onPDFProcessed: (result: any) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const PDFUploader = ({ onPDFProcessed, isProcessing, setIsProcessing }: PDFUploaderProps) => {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  const processPDF = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Import pdf-parse dynamically to avoid SSR issues
      const pdfParse = await import('pdf-parse');
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      setProgress(30);

      const pdfData = await pdfParse.default(Buffer.from(arrayBuffer));
      setProgress(70);

      // Extract document structure
      const result = extractDocumentStructure(pdfData, selectedFile.name);
      setProgress(100);

      onPDFProcessed(result);

      toast({
        title: "PDF processed successfully",
        description: `Extracted ${result.outline.length} headings from the document`,
      });

    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: "Processing failed",
        description: "Unable to process the PDF file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const extractDocumentStructure = (pdfData: any, filename: string) => {
    const text = pdfData.text;
    const pages = text.split('\n\n');
    
    // Simple heading detection based on common patterns
    const outline: Array<{level: string, text: string, page: number}> = [];
    let currentPage = 1;
    
    // Try to extract title from filename or first significant line
    const title = filename.replace('.pdf', '').replace(/[_-]/g, ' ').trim();
    
    const lines = text.split('\n');
    let pageCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Count page breaks (simple heuristic)
      if (line.includes('\f') || (i > 0 && lines[i-1].trim() === '' && line.length < 50 && /^\d+$/.test(line))) {
        pageCount++;
        currentPage = Math.max(1, pageCount);
      }
      
      // Detect headings based on patterns
      if (line.length > 3 && line.length < 100) {
        // Check for numbered headings (1., 1.1, etc.)
        if (/^\d+\.(\d+\.)*\s+.+/.test(line)) {
          const level = (line.match(/\./g) || []).length;
          const headingLevel = level === 1 ? 'H1' : level === 2 ? 'H2' : 'H3';
          outline.push({
            level: headingLevel,
            text: line.replace(/^\d+\.(\d+\.)*\s+/, '').trim(),
            page: currentPage
          });
        }
        // Check for ALL CAPS headings
        else if (line === line.toUpperCase() && line.length > 5 && !/\d/.test(line)) {
          outline.push({
            level: 'H1',
            text: line,
            page: currentPage
          });
        }
        // Check for Title Case headings at start of paragraphs
        else if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]*)*$/.test(line) && line.length > 10) {
          const nextLine = lines[i + 1]?.trim();
          if (!nextLine || nextLine.length === 0) {
            outline.push({
              level: 'H2',
              text: line,
              page: currentPage
            });
          }
        }
      }
    }

    // If no headings found, create some based on content sections
    if (outline.length === 0) {
      const sections = text.split(/\n\s*\n/).filter(section => section.trim().length > 50);
      sections.slice(0, 5).forEach((section, index) => {
        const firstLine = section.split('\n')[0].trim();
        if (firstLine.length > 0 && firstLine.length < 80) {
          outline.push({
            level: 'H1',
            text: firstLine.slice(0, 50) + (firstLine.length > 50 ? '...' : ''),
            page: index + 1
          });
        }
      });
    }

    return {
      title,
      outline: outline.slice(0, 20) // Limit to first 20 headings
    };
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-8 bg-gradient-subtle border-border shadow-elegant">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <FileText className="h-12 w-12 mx-auto text-primary" />
          <h2 className="text-2xl font-bold text-foreground">PDF Document Analyzer</h2>
          <p className="text-muted-foreground">Upload a PDF to extract its document structure and headings</p>
        </div>

        {!selectedFile ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-smooth ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-foreground font-medium mb-2">
              Drop your PDF file here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Maximum file size: 50 pages
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="pointer-events-none">
              Select PDF File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  Processing PDF... {progress}%
                </p>
              </div>
            )}

            <Button
              onClick={processPDF}
              disabled={isProcessing}
              className="w-full"
              variant="hero"
              size="lg"
            >
              {isProcessing ? "Processing..." : "Extract Document Structure"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};