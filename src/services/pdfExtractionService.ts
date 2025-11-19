/**
 * PDF Text Extraction Service
 * Handles extraction of text from PDF files using pdf.js (pdfjs-dist)
 * with Tesseract.js fallback for scanned PDFs
 */

import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedText {
  text: string;
  pageNumber: number;
  confidence?: number;
}

export interface PDFExtractionResult {
  success: boolean;
  pages: ExtractedText[];
  fullText: string;
  method: 'text-extraction' | 'ocr';
  error?: string;
}

/**
 * Extract text from PDF using pdf.js
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const pages: ExtractedText[] = [];
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items while preserving line breaks
      const pageText = textContent.items
        .map((item: any) => {
          const str = item.str || '';
          // pdf.js exposes hasEOL on TextItem when the string ends a line
          if (item.hasEOL === true) {
            return str + '\n';
          }
          return str + ' ';
        })
        .join('')
        // Collapse spaces but keep newlines intact
        .replace(/[\t ]+/g, ' ')
        .replace(/[ ]*\n[ ]*/g, '\n')
        .trim();
      
      pages.push({
        text: pageText,
        pageNumber: pageNum,
        confidence: 1.0 // Text extraction has full confidence
      });
      
      fullText += pageText + '\n';
    }
    
    // Check if we got meaningful text
    const hasContent = fullText.trim().length > 50;
    
    if (!hasContent) {
      console.warn('PDF appears to be scanned or has minimal text. Attempting OCR...');
      return await extractTextWithOCR(file);
    }
    
    return {
      success: true,
      pages,
      fullText: fullText.trim(),
      method: 'text-extraction'
    };
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    
    // Try OCR as fallback
    console.log('Falling back to OCR...');
    return await extractTextWithOCR(file);
  }
}

/**
 * Extract text from scanned PDF using OCR (Tesseract.js)
 */
async function extractTextWithOCR(file: File): Promise<PDFExtractionResult> {
  try {
    // Convert PDF to images first (using pdf.js)
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const pages: ExtractedText[] = [];
    let fullText = '';
    
    // Create Tesseract worker
    const worker = await createWorker('eng');
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Render page to canvas
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert canvas to blob'));
        });
      });
      
      // Perform OCR
      const { data } = await worker.recognize(blob);
      
      pages.push({
        text: data.text,
        pageNumber: pageNum,
        confidence: data.confidence / 100 // Normalize to 0-1
      });
      
      fullText += data.text + '\n';
    }
    
    // Cleanup
    await worker.terminate();
    
    return {
      success: true,
      pages,
      fullText: fullText.trim(),
      method: 'ocr'
    };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return {
      success: false,
      pages: [],
      fullText: '',
      method: 'ocr',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Quick validation to check if a file is a valid PDF
 */
export function isValidPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Estimate if PDF is text-based or scanned
 */
export async function estimatePDFType(file: File): Promise<'text-based' | 'scanned' | 'unknown'> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Sample first page
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    
    // If we get substantial text, it's likely text-based
    if (pageText.trim().length > 50) {
      return 'text-based';
    }
    
    return 'scanned';
  } catch (error) {
    console.error('Failed to estimate PDF type:', error);
    return 'unknown';
  }
}
