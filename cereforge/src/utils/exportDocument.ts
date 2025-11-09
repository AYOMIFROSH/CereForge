// src/utils/exportDocument.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    HeadingLevel,
    ImageRun,
    WidthType,
    BorderStyle,
    AlignmentType
} from 'docx';
import TurndownService from 'turndown';

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'html' | 'md';

interface ExportOptions {
    format: ExportFormat;
    getHTML: () => string;
    getText: () => string;
    documentTitle?: string;
    onProgress?: (progress: number, message: string) => void;
}

/**
 * Generate a timestamped filename
 */
export const generateFileName = (customName?: string, extension?: string): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const baseName = customName || `cereforge_document_${timestamp}`;
    return extension ? `${baseName}.${extension}` : baseName;
};

/**
 * Convert image URL to base64
 */
const imageUrlToBase64 = async (url: string): Promise<{ data: string; type: string }> => {
    try {
        // Already base64
        if (url.startsWith('data:')) {
            const matches = url.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                return { data: matches[2], type: matches[1] };
            }
        }

        // Try canvas method (works for CORS images)
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }
                    
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/png');
                    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
                    
                    if (matches) {
                        resolve({ data: matches[2], type: matches[1] });
                    } else {
                        reject(new Error('Failed to extract base64'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
            
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error('Timeout')), 10000);
        });
    } catch (error) {
        console.error('Image conversion failed:', error);
        return { data: '', type: 'image/png' };
    }
};
/**
 * Capture element as image using html2canvas
 */
const captureElementAsImage = async (element: HTMLElement): Promise<string> => {
    try {
        // Ensure element is visible
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn('Element has zero dimensions');
            return '';
        }

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: true,
            removeContainer: false,
        });
        
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        
        if (!base64 || base64.length < 100) {
            throw new Error('Captured image too small');
        }
        
        return base64;
    } catch (error) {
        console.error('Failed to capture element:', error);
        return '';
    }
};

/**
 * Export document as PDF with proper A4 dimensions and margins
 */
export const exportToPDF = async (
    element: HTMLElement,
    fileName: string,
    onProgress?: (progress: number, message: string) => void
): Promise<void> => {
    try {
        onProgress?.(10, 'Preparing document...');

        const clonedElement = element.cloneNode(true) as HTMLElement;

        const pageCounter = clonedElement.querySelector('.no-print');
        if (pageCounter) {
            pageCounter.remove();
        }

        clonedElement.style.position = 'absolute';
        clonedElement.style.left = '-9999px';
        clonedElement.style.top = '0';
        document.body.appendChild(clonedElement);

        onProgress?.(30, 'Rendering content...');

        const a4WidthPx = 794;
        clonedElement.style.width = `${a4WidthPx}px`;
        clonedElement.style.maxWidth = `${a4WidthPx}px`;

        onProgress?.(50, 'Capturing pages...');

        const canvas = await html2canvas(clonedElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: a4WidthPx,
            allowTaint: true,
        });

        document.body.removeChild(clonedElement);

        onProgress?.(70, 'Generating PDF...');

        const imgData = canvas.toDataURL('image/png');

        const pdfWidth = 210;
        const pdfHeight = 297;

        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        let heightLeft = imgHeight;
        let position = 0;
        let pageCount = 0;

        // ✅ FIXED: Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
        pageCount++;

        // ✅ FIXED: Only add pages if there's significant content remaining (more than 10mm)
        const THRESHOLD = 10; // Minimum height in mm to justify a new page
        while (heightLeft > THRESHOLD) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pdfHeight;
            pageCount++;
        }

        onProgress?.(90, `Saving ${pageCount} page(s)...`);

        pdf.save(fileName);

        onProgress?.(100, 'Complete!');
    } catch (error) {
        console.error('PDF export failed:', error);
        throw new Error('Failed to export PDF. Please try again.');
    }
};

/**
 * Parse HTML table to DOCX format
 */
const parseHTMLTable = async (tableElement: HTMLTableElement): Promise<Table> => {
    const rows: TableRow[] = [];

    const tableRows = tableElement.querySelectorAll('tr');
    for (const tr of Array.from(tableRows)) {
        const cells: TableCell[] = [];
        const tableCells = tr.querySelectorAll('td, th');

        for (const cell of Array.from(tableCells)) {
            const isHeader = cell.tagName === 'TH';
            const textRuns: TextRun[] = [];

            // Extract text with formatting
            const processTextNode = (node: Node): void => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent || '';
                    if (text.trim()) {
                        textRuns.push(new TextRun({
                            text,
                            bold: isHeader
                        }));
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as HTMLElement;
                    const text = el.textContent || '';
                    const isBold = el.tagName === 'STRONG' || el.tagName === 'B' || isHeader;
                    const isItalic = el.tagName === 'EM' || el.tagName === 'I';
                    const isUnderline = el.tagName === 'U';

                    if (text.trim()) {
                        textRuns.push(new TextRun({
                            text,
                            bold: isBold,
                            italics: isItalic,
                            underline: isUnderline ? {} : undefined,
                        }));
                    }
                }
            };

            cell.childNodes.forEach(processTextNode);

            cells.push(new TableCell({
                children: [new Paragraph({
                    children: textRuns.length > 0 ? textRuns : [new TextRun({ text: cell.textContent || '', bold: isHeader })]
                })],
                width: { size: 2000, type: WidthType.DXA },
                shading: isHeader ? { fill: 'E5E7EB' } : undefined,
                margins: {
                    top: 100,
                    bottom: 100,
                    left: 100,
                    right: 100,
                },
            }));
        }

        if (cells.length > 0) {
            rows.push(new TableRow({ children: cells }));
        }
    }

    return new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        margins: {
            top: 200,
            bottom: 200,
        },
    });
};

/**
 * Export document as DOCX with full formatting preservation
 */
/**
 * Export document as DOCX with full formatting preservation
 */
export const exportToDOCX = async (
    htmlContent: string,
    fileName: string,
    onProgress?: (progress: number, message: string) => void
): Promise<void> => {
    try {
        onProgress?.(10, 'Parsing document...');

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const sections: any[] = [];

        let processedCount = 0;
        const totalElements = doc.body.childNodes.length;

        const processNode = async (node: Node): Promise<any[]> => {
            processedCount++;
            const progress = 10 + Math.floor((processedCount / totalElements) * 60);
            onProgress?.(progress, 'Processing content...');

            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim();
                if (text) {
                    return [new TextRun({ text })];
                }
                return [];
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                const tagName = element.tagName.toLowerCase();

                switch (tagName) {
                    case 'h1':
                        return [new Paragraph({
                            text: element.textContent || '',
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 240, after: 120 },
                        })];

                    case 'h2':
                        return [new Paragraph({
                            text: element.textContent || '',
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 200, after: 100 },
                        })];

                    case 'h3':
                        return [new Paragraph({
                            text: element.textContent || '',
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 160, after: 80 },
                        })];

                    case 'p': {
                        const textRuns: TextRun[] = [];
                        let alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT;

                        const style = element.getAttribute('style') || '';
                        if (style.includes('text-align: center') || style.includes('justify-center')) {
                            alignment = AlignmentType.CENTER;
                        } else if (style.includes('text-align: right') || style.includes('justify-end')) {
                            alignment = AlignmentType.RIGHT;
                        }

                        const processChild = (child: Node) => {
                            if (child.nodeType === Node.TEXT_NODE) {
                                const text = child.textContent || '';
                                if (text.trim()) {
                                    textRuns.push(new TextRun({ text }));
                                }
                            } else if (child.nodeType === Node.ELEMENT_NODE) {
                                const childEl = child as HTMLElement;
                                const childText = childEl.textContent || '';

                                const isBold = ['STRONG', 'B'].includes(childEl.tagName);
                                const isItalic = ['EM', 'I'].includes(childEl.tagName);
                                const isUnderline = childEl.tagName === 'U';
                                const isStrike = ['S', 'STRIKE', 'DEL'].includes(childEl.tagName);

                                if (childText.trim()) {
                                    textRuns.push(new TextRun({
                                        text: childText,
                                        bold: isBold,
                                        italics: isItalic,
                                        underline: isUnderline ? {} : undefined,
                                        strike: isStrike,
                                    }));
                                }
                            }
                        };

                        element.childNodes.forEach(processChild);

                        return [new Paragraph({
                            children: textRuns.length > 0 ? textRuns : [new TextRun({ text: element.textContent || '' })],
                            spacing: { before: 100, after: 100 },
                            alignment,
                        })];
                    }

                    case 'ul':
                    case 'ol': {
                        const listItems: Paragraph[] = [];
                        element.querySelectorAll('li').forEach((li) => {
                            listItems.push(new Paragraph({
                                text: li.textContent || '',
                                bullet: tagName === 'ul' ? { level: 0 } : undefined,
                                numbering: tagName === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
                                spacing: { before: 60, after: 60 },
                            }));
                        });
                        return listItems;
                    }

                    case 'blockquote':
                        return [new Paragraph({
                            indent: { left: 720 },
                            border: {
                                left: { color: '2563eb', space: 1, style: BorderStyle.SINGLE, size: 6 },
                            },
                            spacing: { before: 120, after: 120 },
                            children: [
                                new TextRun({
                                    text: element.textContent || '',
                                    italics: true,
                                }),
                            ],
                        })];

                    case 'img': {
    const imgElement = element as HTMLImageElement;
    const src = imgElement.src;

    if (!src || src === '' || src === 'about:blank') {
        return [];
    }

    try {
        onProgress?.(progress, 'Processing image...');

        const { data: base64Image, type } = await imageUrlToBase64(src);

        if (!base64Image || base64Image.length < 100) {
            console.warn('Image failed:', src);
            return [new Paragraph({
                text: `[Image: ${imgElement.alt || 'Unable to load'}]`,
                spacing: { before: 120, after: 120 },
            })];
        }

        let width = imgElement.width || 400;
        let height = imgElement.height || 300;
        
        if (width > 500) {
            height = (height / width) * 500;
            width = 500;
        }

        let imageType: 'png' | 'jpg' | 'gif' | 'bmp' = 'png';
        if (type.includes('jpeg') || type.includes('jpg')) {
            imageType = 'jpg';
        } else if (type.includes('gif')) {
            imageType = 'gif';
        }

        console.log(`✅ Embedded image: ${width}x${height}`);

        return [
            new Paragraph({
                children: [
                    new ImageRun({
                        data: Buffer.from(base64Image, 'base64'),
                        transformation: { width, height },
                        type: imageType,
                    }),
                ],
                spacing: { before: 200, after: 200 },
            }),
        ];
    } catch (error) {
        console.error('Image embed failed:', error);
        return [new Paragraph({
            text: `[Image: Error]`,
            spacing: { before: 120, after: 120 },
        })];
    }
}

                    case 'table': {
                        try {
                            onProgress?.(progress, 'Processing table...');
                            const tableElement = element as HTMLTableElement;
                            const table = await parseHTMLTable(tableElement);
                            return [
                                table,
                                new Paragraph({ text: '' }), // Spacing after table
                            ];
                        } catch (error) {
                            console.error('Failed to process table:', error);
                            return [new Paragraph({
                                text: '[Table: Error processing]',
                                spacing: { before: 120, after: 120 },
                            })];
                        }
                    }

                    case 'div':
                    case 'span': {
                        // Check for charts first (SVG, canvas, or chart classes)
                        // Inside case 'div': around line 500
const hasSVG = element.querySelector('svg');
const hasCanvas = element.querySelector('canvas');

if (hasSVG || hasCanvas) {
    try {
        onProgress?.(progress, 'Processing chart...');

        let captureElement = element;
        const chartContainer = element.querySelector('.p-4') || 
                             element.querySelector('svg')?.parentElement;
        
        if (chartContainer instanceof HTMLElement) {
            captureElement = chartContainer;
        }

        const chartImage = await captureElementAsImage(captureElement);

        if (chartImage && chartImage.length > 100) {
            console.log('✅ Embedded chart');
            
            return [
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: Buffer.from(chartImage, 'base64'),
                            transformation: { width: 500, height: 300 },
                            type: 'png',
                        }),
                    ],
                    spacing: { before: 200, after: 200 },
                }),
            ];
        }
    } catch (error) {
        console.error('Chart embed failed:', error);
    }
}

                        // Check for nested tables
                        const nestedTable = element.querySelector('table');
                        if (nestedTable && !element.closest('table')) {
                            try {
                                onProgress?.(progress, 'Processing nested table...');
                                const table = await parseHTMLTable(nestedTable as HTMLTableElement);
                                return [table, new Paragraph({ text: '' })];
                            } catch (error) {
                                console.error('Failed to process nested table:', error);
                            }
                        }

                        // Process children recursively
                        const childResults: any[] = [];
                        for (const child of Array.from(element.childNodes)) {
                            const processed = await processNode(child);
                            childResults.push(...processed);
                        }
                        return childResults;
                    }
                    default: {
                        // Process children for unknown elements
                        const childResults: any[] = [];
                        for (const child of Array.from(element.childNodes)) {
                            const processed = await processNode(child);
                            childResults.push(...processed);
                        }
                        return childResults;
                    }
                }
            }

            return [];
        };

        // Process body content
        console.log('Starting document processing...');
        const bodyElements = doc.body.childNodes;
        for (const node of Array.from(bodyElements)) {
            const processed = await processNode(node);
            sections.push(...processed);
        }

        console.log(`Processed ${sections.length} sections`);

        onProgress?.(80, 'Building document...');

        // Create document with proper configuration
        const docxDocument = new Document({
            creator: 'Cereforge Editor',
            description: 'Document created with Cereforge Editor',
            title: fileName.replace('.docx', ''),
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,    // 1 inch
                            right: 1440,  // 1 inch
                            bottom: 1440, // 1 inch
                            left: 1440,   // 1 inch
                        },
                        pageNumbers: {
                            start: 1,
                            formatType: 'decimal',
                        },
                    },
                },
                children: sections.length > 0 ? sections : [
                    new Paragraph({ text: 'Empty Document' })
                ],
            }],
        });

        onProgress?.(90, 'Generating file...');

        // Generate blob
        const blob = await Packer.toBlob(docxDocument);

        console.log(`Document generated: ${blob.size} bytes`);

        // Download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        requestAnimationFrame(() => {
            URL.revokeObjectURL(url);
        });

        onProgress?.(100, 'Complete!');

    } catch (error) {
        console.error('DOCX export failed:', error);
        throw new Error('Failed to export DOCX. Please try again.');
    }
};

/**
 * Export document as plain text
 */
export const exportToTXT = (textContent: string, fileName: string): void => {
    try {
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('TXT export failed:', error);
        throw new Error('Failed to export text file. Please try again.');
    }
};

/**
 * Export document as HTML with full preservation
 */
export const exportToHTML = (
    htmlContent: string,
    fileName: string,
    onProgress?: (progress: number, message: string) => void
): void => {
    try {
        onProgress?.(20, 'Preparing HTML...');

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Inline all images as base64
        const images = doc.querySelectorAll('img');
        const imagePromises = Array.from(images).map(async (img) => {
            try {
                const { data: base64, type } = await imageUrlToBase64(img.src);
                if (base64) {
                    img.src = `data:${type};base64,${base64}`;
                }
            } catch (error) {
                console.error('Failed to inline image:', error);
            }
        });

        Promise.all(imagePromises).then(() => {
            onProgress?.(60, 'Building HTML file...');

            const processedHTML = doc.body.innerHTML;

            const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName.replace('.html', '')}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    h1 { font-size: 2em; margin: 0.67em 0; font-weight: bold; }
    h2 { font-size: 1.5em; margin: 0.75em 0; font-weight: bold; }
    h3 { font-size: 1.17em; margin: 0.83em 0; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    blockquote { 
      border-left: 4px solid #2563eb; 
      padding-left: 1em; 
      margin: 1em 0; 
      font-style: italic; 
      color: #666; 
    }
    img { 
      max-width: 100%; 
      height: auto; 
      display: block;
      margin: 1em 0;
    }
    ul, ol { padding-left: 2em; margin: 1em 0; }
    li { margin: 0.5em 0; }
    strong, b { font-weight: bold; }
    em, i { font-style: italic; }
    u { text-decoration: underline; }
    s, strike, del { text-decoration: line-through; }
    sub { vertical-align: sub; font-size: smaller; }
    sup { vertical-align: super; font-size: smaller; }
  </style>
</head>
<body>
${processedHTML}
</body>
</html>`;

            onProgress?.(90, 'Saving file...');

            const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(url);

            onProgress?.(100, 'Complete!');
        });
    } catch (error) {
        console.error('HTML export failed:', error);
        throw new Error('Failed to export HTML file. Please try again.');
    }
};

/**
 * Export document as Markdown
 */
export const exportToMarkdown = (
    htmlContent: string,
    fileName: string,
    onProgress?: (progress: number, message: string) => void
): void => {
    try {
        onProgress?.(30, 'Converting to Markdown...');

        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
        });

        turndownService.addRule('strikethrough', {
            filter: (node) => ['S', 'STRIKE', 'DEL'].includes(node.nodeName),
            replacement: (content) => `~~${content}~~`,
        });

        turndownService.addRule('subscript', {
            filter: 'sub',
            replacement: (content) => `~${content}~`,
        });

        turndownService.addRule('superscript', {
            filter: 'sup',
            replacement: (content) => `^${content}^`,
        });

        const markdown = turndownService.turndown(htmlContent);

        onProgress?.(70, 'Finalizing...');

        const fullMarkdown = `---
title: ${fileName.replace('.md', '')}
date: ${new Date().toISOString().split('T')[0]}
generated: Cereforge Document Editor
---

${markdown}
`;

        onProgress?.(90, 'Saving file...');

        const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);

        onProgress?.(100, 'Complete!');
    } catch (error) {
        console.error('Markdown export failed:', error);
        throw new Error('Failed to export Markdown file. Please try again.');
    }
};

/**
 * Main export handler with progress tracking
 */
export const exportDocument = async (options: ExportOptions): Promise<void> => {
    const { format, getHTML, getText, documentTitle, onProgress } = options;
    const fileName = generateFileName(documentTitle, format);

    try {
        onProgress?.(5, 'Initializing export...');

        switch (format) {
            case 'pdf': {
                const editorElement = document.querySelector('.document-page') as HTMLElement;
                if (!editorElement) {
                    throw new Error('Document editor not found');
                }
                await exportToPDF(editorElement, fileName, onProgress);
                break;
            }

            case 'docx': {
                const htmlContent = getHTML();
                await exportToDOCX(htmlContent, fileName, onProgress);
                break;
            }

            case 'txt': {
                onProgress?.(50, 'Preparing text...');
                const textContent = getText();
                exportToTXT(textContent, fileName);
                onProgress?.(100, 'Complete!');
                break;
            }

            case 'html': {
                const htmlContent = getHTML();
                exportToHTML(htmlContent, fileName, onProgress);
                break;
            }

            case 'md': {
                const htmlContent = getHTML();
                exportToMarkdown(htmlContent, fileName, onProgress);
                break;
            }

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    } catch (error) {
        console.error(`Export failed for format ${format}:`, error);
        throw error;
    }
};