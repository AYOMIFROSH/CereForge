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
    BorderStyle
} from 'docx';
import TurndownService from 'turndown';

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'html' | 'md';

interface ExportOptions {
    format: ExportFormat;
    getHTML: () => string;
    getText: () => string;
    documentTitle?: string;
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
const imageUrlToBase64 = async (url: string): Promise<string> => {
    try {
        // If already base64, return as is
        if (url.startsWith('data:')) {
            return url.split(',')[1];
        }

        // Fetch and convert to base64
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                resolve(base64.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to convert image to base64:', error);
        return '';
    }
};

/**
 * Capture chart as image using html2canvas
 */
const captureChartAsImage = async (chartElement: HTMLElement): Promise<string> => {
    try {
        const canvas = await html2canvas(chartElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });
        return canvas.toDataURL('image/png').split(',')[1];
    } catch (error) {
        console.error('Failed to capture chart:', error);
        return '';
    }
};

/**
 * Export document as PDF with full formatting preservation
 */
export const exportToPDF = async (element: HTMLElement, fileName: string): Promise<void> => {
    try {
        // Configure html2canvas for high quality
        const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true, // Handle cross-origin images
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            onclone: (clonedDoc) => {
                // Ensure all images are loaded in cloned document
                const images = clonedDoc.querySelectorAll('img');
                images.forEach((img) => {
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                });
            },
        });

        const imgData = canvas.toDataURL('image/png');

        // A4 dimensions in mm
        const pdfWidth = 210;
        const pdfHeight = 297;

        // Calculate dimensions to fit A4
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;

        // Add additional pages if content is longer than one page
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pdfHeight;
        }

        // Save the PDF
        pdf.save(fileName);
    } catch (error) {
        console.error('PDF export failed:', error);
        throw new Error('Failed to export PDF. Please try again.');
    }
};

/**
 * Export document as DOCX with full formatting preservation including images, tables, and charts
 */
export const exportToDOCX = async (htmlContent: string, fileName: string): Promise<void> => {
    try {
        // Parse HTML to extract content
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        const sections: any[] = [];

        // Process each element
        const processNode = async (node: Node): Promise<any[]> => {
            const children: any[] = [];

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

                // Handle different HTML elements
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

                    case 'p':
                        const textRuns: TextRun[] = [];

                        for (const child of Array.from(element.childNodes)) {
                            if (child.nodeType === Node.TEXT_NODE) {
                                const text = child.textContent || '';
                                if (text.trim()) {
                                    textRuns.push(new TextRun({ text }));
                                }
                            } else if (child.nodeType === Node.ELEMENT_NODE) {
                                const childEl = child as HTMLElement;
                                const childText = childEl.textContent || '';

                                // Get computed styles
                                const isBold = childEl.tagName === 'STRONG' || childEl.tagName === 'B' ||
                                    getComputedStyle(childEl).fontWeight === 'bold';
                                const isItalic = childEl.tagName === 'EM' || childEl.tagName === 'I' ||
                                    getComputedStyle(childEl).fontStyle === 'italic';
                                const isUnderline = childEl.tagName === 'U' ||
                                    getComputedStyle(childEl).textDecoration.includes('underline');

                                textRuns.push(new TextRun({
                                    text: childText,
                                    bold: isBold,
                                    // This line is correct in your file:
                                    italics: isItalic, 
                                    underline: isUnderline ? {} : undefined,
                                }));
                            }
                        }

                        return [new Paragraph({
                            children: textRuns.length > 0 ? textRuns : [new TextRun({ text: element.textContent || '' })],
                            spacing: { before: 100, after: 100 },
                        })];

                    case 'ul':
                    case 'ol':
                        const listItems: Paragraph[] = [];
                        element.querySelectorAll('li').forEach((li, _index) => {
                            listItems.push(new Paragraph({
                                text: li.textContent || '',
                                bullet: tagName === 'ul' ? { level: 0 } : undefined,
                                numbering: tagName === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
                                spacing: { before: 60, after: 60 },
                            }));
                        });
                        return listItems;

                   case 'blockquote':
                        return [new Paragraph({
                            // Move paragraph-level options here
                            indent: { left: 720 },
                            border: {
                                left: { color: '2563eb', space: 1, style: BorderStyle.SINGLE },
                            },
                            spacing: { before: 120, after: 120 },
                            // Add a TextRun to the children array for styling
                            children: [
                                new TextRun({
                                    text: element.textContent || '',
                                    italics: true, // This is a valid property for IRunOptions/TextRun
                                }),
                            ],
                        })];

                    case 'img': {
                        const imgElement = element as HTMLImageElement;
                        const src = imgElement.src;

                        try {
                            const base64Image = await imageUrlToBase64(src);
                            if (base64Image) {
                                // Calculate dimensions (max width 600px = ~6 inches)
                                const maxWidth = 600;
                                const width = Math.min(imgElement.width || maxWidth, maxWidth);
                                const height = imgElement.height || (width * 0.75);

                                return [new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: Uint8Array.from(Buffer.from(base64Image, 'base64')),
                                            transformation: {
                                                width: width,
                                                height: height,
                                            },
                                            type: 'png',
                                        }),
                                    ],
                                    spacing: { before: 120, after: 120 },
                                })];
                            }
                        } catch (error) {
                            console.error('Failed to embed image:', error);
                            return [new Paragraph({
                                text: `[Image: ${imgElement.alt || 'Unable to load'}]`,
                                spacing: { before: 120, after: 120 },
                            })];
                        }
                        return [];
                    }

                    case 'table':
                        const rows: TableRow[] = [];
                        const tableElement = element as HTMLTableElement;

                        tableElement.querySelectorAll('tr').forEach((tr) => {
                            const cells: TableCell[] = [];
                            tr.querySelectorAll('td, th').forEach((cell) => {
                                const isHeader = cell.tagName === 'TH';
                                cells.push(new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({
                                            text: cell.textContent || '',
                                            bold: isHeader,
                                        })],
                                    })],
                                    width: { size: 2000, type: WidthType.DXA },
                                    shading: isHeader ? { fill: 'f2f2f2' } : undefined,
                                }));
                            });
                            rows.push(new TableRow({ children: cells }));
                        });

                        return [
                            new Table({
                                rows,
                                width: { size: 100, type: WidthType.PERCENTAGE },
                            }),
                            new Paragraph({ text: '' }), // Add spacing after table
                        ];

                    // Handle chart containers
                    case 'div': {
                        // Check if this div contains a chart
                        if (element.querySelector('svg') || element.classList.contains('chart-container')) {
                            try {
                                const chartImage = await captureChartAsImage(element);
                                if (chartImage) {
                                    return [new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: Uint8Array.from(Buffer.from(chartImage, 'base64')),
                                                transformation: {
                                                    width: 500,
                                                    height: 300,
                                                },
                                                type: 'png',
                                            }),
                                        ],
                                        spacing: { before: 120, after: 120 },
                                    })];
                                }
                            } catch (error) {
                                console.error('Failed to embed chart:', error);
                                return [new Paragraph({
                                    text: '[Chart: Unable to render]',
                                    spacing: { before: 120, after: 120 },
                                })];
                            }
                        }

                        // Process children for regular divs
                        const childResults: any[] = [];
                        for (const child of Array.from(element.childNodes)) {
                            const processed = await processNode(child);
                            childResults.push(...processed);
                        }
                        return childResults;
                    }

                    default:
                        // Process children for other elements
                        const childResults: any[] = [];
                        for (const child of Array.from(element.childNodes)) {
                            const processed = await processNode(child);
                            childResults.push(...processed);
                        }
                        return childResults;
                }
            }

            return children;
        };

        // Process body content
        const bodyElements = doc.body.childNodes;
        for (const node of Array.from(bodyElements)) {
            const processed = await processNode(node);
            sections.push(...processed);
        }

        // Create document
        const docxDocument = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,    // 1 inch
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        },
                    },
                },
                children: sections.length > 0 ? sections : [
                    new Paragraph({ text: 'Empty Document' })
                ],
            }],
        });

        // Generate and save
        const blob = await Packer.toBlob(docxDocument);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);

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
export const exportToHTML = (htmlContent: string, fileName: string): void => {
    try {
        // Wrap in a complete HTML document
        const fullHTML = `
<!DOCTYPE html>
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
    /* Chart container styling */
    .chart-container {
      margin: 1.5em 0;
      padding: 1em;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>
    `.trim();

        const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('HTML export failed:', error);
        throw new Error('Failed to export HTML file. Please try again.');
    }
};

/**
 * Export document as Markdown with tables and image links
 */
export const exportToMarkdown = (htmlContent: string, fileName: string): void => {
    try {
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
        });

        // Add custom rules for better markdown conversion
        turndownService.addRule('strikethrough', {
            filter: (node) => {
                return node.nodeName === 'S' ||
                    node.nodeName === 'STRIKE' ||
                    node.nodeName === 'DEL';
            },
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

        // Add rule for charts (convert to text representation)
        turndownService.addRule('charts', {
            filter: (node) => {
                return node.nodeName === 'DIV' &&
                    (node.classList.contains('chart-container') ||
                        node.querySelector('svg') !== null);
            },
            replacement: (_content, node) => {
                const title = (node as HTMLElement).querySelector('h4')?.textContent || 'Chart';
                return `\n\n**${title}**\n\n*(Chart visualization not supported in Markdown)*\n\n`;
            },
        });

        const markdown = turndownService.turndown(htmlContent);

        // Add metadata header
        const fullMarkdown = `---
title: ${fileName.replace('.md', '')}
date: ${new Date().toISOString().split('T')[0]}
generated: Cereforge Document Editor
---

${markdown}
`;

        const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Markdown export failed:', error);
        throw new Error('Failed to export Markdown file. Please try again.');
    }
};

/**
 * Main export handler that routes to appropriate export function
 */
export const exportDocument = async (options: ExportOptions): Promise<void> => {
    const { format, getHTML, getText, documentTitle } = options;
    const fileName = generateFileName(documentTitle, format);

    try {
        switch (format) {
            case 'pdf': {
                // Get the document editor element
                const editorElement = document.querySelector('.document-page') as HTMLElement;
                if (!editorElement) {
                    throw new Error('Document editor not found');
                }
                await exportToPDF(editorElement, fileName);
                break;
            }

            case 'docx': {
                const htmlContent = getHTML();
                await exportToDOCX(htmlContent, fileName);
                break;
            }

            case 'txt': {
                const textContent = getText();
                exportToTXT(textContent, fileName);
                break;
            }

            case 'html': {
                const htmlContent = getHTML();
                exportToHTML(htmlContent, fileName);
                break;
            }

            case 'md': {
                const htmlContent = getHTML();
                exportToMarkdown(htmlContent, fileName);
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