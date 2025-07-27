import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileJson, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentStructure {
  title: string;
  outline: Array<{
    level: string;
    text: string;
    page: number;
  }>;
}

interface ResultsDisplayProps {
  result: DocumentStructure;
  onReset: () => void;
}

export const ResultsDisplay = ({ result, onReset }: ResultsDisplayProps) => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'preview' | 'json'>('preview');

  const jsonOutput = JSON.stringify(result, null, 2);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      toast({
        title: "Copied to clipboard",
        description: "JSON output has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadJson = () => {
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.replace(/[^a-zA-Z0-9]/g, '_')}_outline.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "JSON file has been downloaded",
    });
  };

  const getHeadingColor = (level: string) => {
    switch (level) {
      case 'H1': return 'bg-primary text-primary-foreground';
      case 'H2': return 'bg-accent text-accent-foreground';
      case 'H3': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-subtle border-border shadow-elegant">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Document Structure Extracted
            </h2>
            <p className="text-muted-foreground">
              Found {result.outline.length} headings in "{result.title}"
            </p>
          </div>
          <Button onClick={onReset} variant="outline">
            Process Another PDF
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            onClick={() => setViewMode('preview')}
            size="sm"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={viewMode === 'json' ? 'default' : 'outline'}
            onClick={() => setViewMode('json')}
            size="sm"
          >
            <FileJson className="h-4 w-4 mr-2" />
            JSON Output
          </Button>
        </div>
      </Card>

      {/* Results */}
      <Card className="p-6 bg-card border-border shadow-elegant">
        {viewMode === 'preview' ? (
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-lg font-semibold text-foreground mb-2">Document Title</h3>
              <p className="text-xl text-primary font-medium">{result.title}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Document Outline</h3>
              <div className="space-y-3">
                {result.outline.map((heading, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth">
                    <Badge variant="secondary" className={getHeadingColor(heading.level)}>
                      {heading.level}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{heading.text}</p>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      Page {heading.page}
                    </Badge>
                  </div>
                ))}
              </div>

              {result.outline.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No headings detected in this document.</p>
                  <p className="text-sm">The document may not have a clear heading structure.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">JSON Output</h3>
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={downloadJson} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <pre className="bg-muted/50 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-border">
                <code className="text-foreground">{jsonOutput}</code>
              </pre>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};