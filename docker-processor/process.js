#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const INPUT_DIR = '/app/input';
const OUTPUT_DIR = '/app/output';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Extract document structure from PDF
 */
function extractDocumentStructure(pdfData, filename) {
  const text = pdfData.text;
  const outline = [];
  let currentPage = 1;
  
  // Try to extract title from filename
  const title = filename.replace('.pdf', '').replace(/[_-]/g, ' ').trim();
  
  const lines = text.split('\n');
  let pageCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Simple page counting heuristic
    if (line.includes('\f') || (i > 0 && lines[i-1].trim() === '' && line.length < 50 && /^\d+$/.test(line))) {
      pageCount++;
      currentPage = Math.max(1, pageCount);
    }
    
    // Detect headings based on patterns
    if (line.length > 3 && line.length < 100) {
      // Numbered headings (1., 1.1, etc.)
      if (/^\d+\.(\d+\.)*\s+.+/.test(line)) {
        const level = (line.match(/\./g) || []).length;
        const headingLevel = level === 1 ? 'H1' : level === 2 ? 'H2' : 'H3';
        outline.push({
          level: headingLevel,
          text: line.replace(/^\d+\.(\d+\.)*\s+/, '').trim(),
          page: currentPage
        });
      }
      // ALL CAPS headings
      else if (line === line.toUpperCase() && line.length > 5 && !/\d/.test(line) && /^[A-Z\s]+$/.test(line)) {
        outline.push({
          level: 'H1',
          text: line,
          page: currentPage
        });
      }
      // Title Case headings
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
      // Chapter/Section headers
      else if (/^(chapter|section|part)\s+\d+/i.test(line)) {
        outline.push({
          level: 'H1',
          text: line,
          page: currentPage
        });
      }
    }
  }

  // If no headings found, try to extract based on font size changes (simplified)
  if (outline.length === 0) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    
    paragraphs.slice(0, 10).forEach((paragraph, index) => {
      const firstLine = paragraph.split('\n')[0].trim();
      if (firstLine.length > 0 && firstLine.length < 80) {
        // Simple heuristic: shorter lines at paragraph starts might be headings
        if (firstLine.length < 60 && !firstLine.endsWith('.')) {
          outline.push({
            level: index < 3 ? 'H1' : 'H2',
            text: firstLine,
            page: Math.floor(index / 3) + 1
          });
        }
      }
    });
  }

  return {
    title,
    outline: outline.slice(0, 50) // Limit to 50 headings for performance
  };
}

/**
 * Process a single PDF file
 */
async function processPDF(filePath, filename) {
  try {
    console.log(`Processing: ${filename}`);
    
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    const result = extractDocumentStructure(pdfData, filename);
    
    // Create output filename
    const outputFilename = filename.replace('.pdf', '.json');
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    
    // Write JSON output
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log(`✓ Processed ${filename} -> ${outputFilename}`);
    console.log(`  - Title: ${result.title}`);
    console.log(`  - Headings found: ${result.outline.length}`);
    
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${filename}:`, error.message);
    return false;
  }
}

/**
 * Main processing function
 */
async function main() {
  console.log('PDF Document Structure Extractor');
  console.log('=================================');
  console.log(`Input directory: ${INPUT_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  
  // Check if input directory exists
  if (!fs.existsSync(INPUT_DIR)) {
    console.error('Error: Input directory does not exist');
    process.exit(1);
  }
  
  // Get all PDF files from input directory
  const files = fs.readdirSync(INPUT_DIR);
  const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
  
  if (pdfFiles.length === 0) {
    console.log('No PDF files found in input directory');
    process.exit(0);
  }
  
  console.log(`Found ${pdfFiles.length} PDF file(s) to process\n`);
  
  let processed = 0;
  let failed = 0;
  
  // Process each PDF file
  for (const filename of pdfFiles) {
    const filePath = path.join(INPUT_DIR, filename);
    const success = await processPDF(filePath, filename);
    
    if (success) {
      processed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n=================================');
  console.log(`Processing complete:`);
  console.log(`✓ Successfully processed: ${processed} files`);
  console.log(`✗ Failed: ${failed} files`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});