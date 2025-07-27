import { useState } from 'react';
import { PDFUploader } from '@/components/PDFUploader';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { FileText, Zap, Target, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DocumentStructure {
  title: string;
  outline: Array<{
    level: string;
    text: string;
    page: number;
  }>;
}

const Index = () => {
  const [result, setResult] = useState<DocumentStructure | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePDFProcessed = (processedResult: DocumentStructure) => {
    setResult(processedResult);
  };

  const handleReset = () => {
    setResult(null);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
        <ResultsDisplay result={result} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="relative px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                PDF Document
                <span className="text-primary block">Structure Extractor</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Extract structured outlines from PDF documents with AI-powered heading detection.
                Perfect for creating table of contents and document analysis.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Zap className="h-4 w-4 mr-2" />
                Fast Processing
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Target className="h-4 w-4 mr-2" />
                Accurate Detection
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Award className="h-4 w-4 mr-2" />
                JSON Output
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 bg-card border-border shadow-elegant hover:shadow-glow transition-smooth">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Smart Detection</h3>
                <p className="text-muted-foreground">
                  Automatically identifies H1, H2, and H3 headings with page numbers using advanced text analysis.
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border shadow-elegant hover:shadow-glow transition-smooth">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Process documents up to 50 pages in seconds with optimized parsing algorithms.
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border shadow-elegant hover:shadow-glow transition-smooth">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">JSON Format</h3>
                <p className="text-muted-foreground">
                  Export results in clean JSON format for easy integration with other tools and systems.
                </p>
              </div>
            </Card>
          </div>

          {/* Main Upload Component */}
          <PDFUploader
            onPDFProcessed={handlePDFProcessed}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Built for the "Connecting the Dots Through Docs" hackathon challenge
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;