import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  DecoratorNode,
  EditorState,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { INSERT_TABLE_COMMAND } from '@lexical/table';

// A4 Page Constants
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_TOP_MM = 25;
const MARGIN_BOTTOM_MM = 25;
const MARGIN_LEFT_MM = 20;
const MARGIN_RIGHT_MM = 20;

const mmToPx = (mm: number) => (mm * 96) / 25.4;
const PAGE_HEIGHT_PX = mmToPx(A4_HEIGHT_MM);

// Custom Image Node
export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
  },
  SerializedLexicalNode
>;

class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__width, node.__height, node.__key);
  }

  constructor(src: string, altText: string, width?: number, height?: number, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'inline-block';
    div.style.margin = '10px 0';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        style={{
          maxWidth: this.__width ? `${this.__width}px` : '100%',
          height: this.__height ? `${this.__height}px` : 'auto',
          display: 'block',
          borderRadius: '8px',
        }}
      />
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height } = serializedNode;
    return $createImageNode(src, altText, width, height);
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      type: 'image',
      version: 1,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (element: HTMLElement): DOMConversionOutput | null => {
          const img = element as HTMLImageElement;
          const src = img.getAttribute('src');
          const alt = img.getAttribute('alt') || '';
          if (src) {
            const node = $createImageNode(src, alt);
            return { node };
          }
          return null;
        },
        priority: 0,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width) element.setAttribute('width', String(this.__width));
    if (this.__height) element.setAttribute('height', String(this.__height));
    return { element };
  }
}

function $createImageNode(src: string, altText: string, width?: number, height?: number): ImageNode {
  return new ImageNode(src, altText, width, height);
}

// Enhanced Page Break Node
export type SerializedPageBreakNode = SerializedLexicalNode;

class PageBreakNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'pagebreak';
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key);
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'page-break';
    div.style.cssText = `
      page-break-after: always;
      break-after: page;
      height: 60px;
      position: relative;
      margin: 20px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    `;
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(to right, transparent, #3b82f6 20%, #3b82f6 80%, transparent)',
          transform: 'translateY(-50%)',
        }} />
        <div style={{
          background: 'white',
          padding: '6px 16px',
          borderRadius: '16px',
          border: '2px solid #3b82f6',
          fontSize: '12px',
          fontWeight: '600',
          color: '#3b82f6',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
          </svg>
          Page Break
        </div>
      </div>
    );
  }

  static importJSON(): PageBreakNode {
    return $createPageBreakNode();
  }

  exportJSON(): SerializedPageBreakNode {
    return {
      type: 'pagebreak',
      version: 1,
    };
  }
}

function $createPageBreakNode(): PageBreakNode {
  return new PageBreakNode();
}

// Command to insert page break
export const INSERT_PAGE_BREAK_COMMAND: LexicalCommand<void> = createCommand();

// Plugin to handle page break insertion
function PageBreakPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_PAGE_BREAK_COMMAND,
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const pageBreak = $createPageBreakNode();
          selection.insertNodes([pageBreak]);

          const paragraph = $createParagraphNode();
          pageBreak.insertAfter(paragraph);
          paragraph.select();
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}

// Keyboard shortcut plugin
function PageBreakKeyboardPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined);
        return true;
      }
      return false;
    };

    return editor.registerRootListener((rootElement, prevRootElement) => {
      if (prevRootElement) {
        prevRootElement.removeEventListener('keydown', handleKeyDown);
      }
      if (rootElement) {
        rootElement.addEventListener('keydown', handleKeyDown);
      }
    });
  }, [editor]);

  return null;
}

// Visual Page Guides Plugin - Shows where pages would end with actual spacing
function VisualPageGuidesPlugin() {
  const [editor] = useLexicalComposerContext();
  const [guides, setGuides] = useState<number[]>([]);

  useEffect(() => {
    const updateGuides = () => {
      const editorElement = editor.getRootElement();
      if (!editorElement) return;

      const contentHeight = editorElement.scrollHeight;
      const pageCount = Math.ceil(contentHeight / PAGE_HEIGHT_PX);

      const guidePositions: number[] = [];
      for (let i = 1; i < pageCount; i++) {
        // Position guides at the end of content area (before bottom margin)
        const guidePosition = (i * PAGE_HEIGHT_PX) - mmToPx(MARGIN_BOTTOM_MM);
        guidePositions.push(guidePosition);
      }

      setGuides(guidePositions);
    };

    const unregister = editor.registerUpdateListener(() => {
      setTimeout(updateGuides, 100);
    });

    updateGuides();

    return unregister;
  }, [editor]);

  return (
    <>
      {guides.map((position, index) => (
        <div
          key={index}
          className="no-print"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${position}px`,
            height: `${mmToPx(MARGIN_BOTTOM_MM + MARGIN_TOP_MM)}px`,
            pointerEvents: 'none',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              background: 'repeating-linear-gradient(90deg, #94a3b8 0px, #94a3b8 10px, transparent 10px, transparent 20px)',
              transform: 'translateY(-50%)',
            }}
          />
          <div
            style={{
              background: '#f1f5f9',
              color: '#64748b',
              fontSize: '11px',
              fontWeight: '500',
              padding: '4px 12px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              whiteSpace: 'nowrap',
              zIndex: 1,
            }}
          >
            Page {index + 1} ends here
          </div>
        </div>
      ))}
    </>
  );
}

// Editor Theme
const editorTheme = {
  paragraph: 'mb-3 leading-relaxed',
  quote: 'border-l-4 border-blue-600 pl-4 italic my-4 text-gray-600',
  heading: {
    h1: 'text-3xl font-bold my-4 text-gray-900',
    h2: 'text-2xl font-bold my-3 text-gray-900',
    h3: 'text-xl font-bold my-2 text-gray-900',
  },
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal pl-6 my-3',
    ul: 'list-disc pl-6 my-3',
    listitem: 'my-1',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
  link: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
  code: 'bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm',
  table: 'border-collapse border border-gray-300 my-4',
  tableCell: 'border border-gray-300 p-2 min-w-[100px]',
  tableCellHeader: 'border border-gray-300 p-2 min-w-[100px] bg-gray-50 font-bold',
};

// Enhanced Page Counter with page break detection - WORKING VERSION
function PageCounterPlugin() {
  const [editor] = useLexicalComposerContext();
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const calculatePages = () => {
      try {
        const editorElement = editor.getRootElement();
        if (!editorElement) return;

        // Calculate pages based on content height
        const contentHeight = editorElement.scrollHeight;
        const naturalPages = Math.ceil(contentHeight / PAGE_HEIGHT_PX);

        // Count manual page breaks and find cursor position
        let manualPageBreaks = 0;
        let cursorPageFromBreaks = 1;
        let cursorDomElement: HTMLElement | null = null;

        editor.getEditorState().read(() => {
          const root = $getRoot();
          const selection = $getSelection();

          // Early return if no selection
          if (!selection || !$isRangeSelection(selection)) {
            return;
          }

          // Get the anchor node (where cursor is)
          const anchorNode = selection.anchor.getNode();
          const anchorKey = anchorNode.getKey();

          // Get DOM element for cursor position calculation
          try {
            const domNode = editor.getElementByKey(anchorKey);
            if (domNode && domNode instanceof HTMLElement) {
              cursorDomElement = domNode;
            }
          } catch (e) {
            // Silent fail
          }

          // Get all children
          const children = root.getChildren();
          let foundCursor = false;

          for (let i = 0; i < children.length; i++) {
            const child = children[i];

            // If we found the cursor in a previous iteration, just count remaining breaks
            if (foundCursor) {
              if (child.getType() === 'pagebreak') {
                manualPageBreaks++;
              }
              continue;
            }

            // Check if cursor is in this node BEFORE counting breaks
            const isInThisNode = child.getKey() === anchorKey;
            let isInDescendant = false;

            if (!isInThisNode) {
              // Check descendants
              try {
                if ('getAllTextNodes' in child && typeof child.getAllTextNodes === 'function') {
                  const textNodes = child.getAllTextNodes();
                  for (const textNode of textNodes) {
                    if (textNode.getKey() === anchorKey) {
                      isInDescendant = true;
                      break;
                    }
                  }
                }
              } catch (e) {
                // Silent fail
              }
            }

            if (isInThisNode || isInDescendant) {
              foundCursor = true;
              continue;
            }

            // Count page breaks that are BEFORE the cursor
            if (child.getType() === 'pagebreak') {
              manualPageBreaks++;
              cursorPageFromBreaks++;
            }
          }
        });

        // Total pages = max of natural pages or manual breaks + 1
        const totalPages = Math.max(naturalPages, manualPageBreaks + 1);
        setPageCount(totalPages);

        // Calculate current page based on cursor DOM position
        let calculatedPage = cursorPageFromBreaks;

        if (cursorDomElement !== null) {
          try {
            // Get the Y position of the cursor relative to the editor
            const editorRect = editorElement.getBoundingClientRect();
            const cursorRect = (cursorDomElement as HTMLElement).getBoundingClientRect();

            // Calculate which page the cursor is on based on its Y position
            const relativeY = cursorRect.top - editorRect.top + editorElement.scrollTop;
            const pageFromPosition = Math.floor(relativeY / PAGE_HEIGHT_PX) + 1;

            // Use the maximum of manual page breaks count or position-based calculation
            calculatedPage = Math.max(cursorPageFromBreaks, pageFromPosition);
          } catch (e) {
            // Fallback to manual page breaks count
            calculatedPage = cursorPageFromBreaks;
          }
        }

        // Set current page
        setCurrentPage(Math.min(calculatedPage, totalPages));
      } catch (error) {
        console.error('Error calculating pages:', error);
      }
    };

    const unregisterListener = editor.registerUpdateListener(() => {
      setTimeout(calculatePages, 100);
    });

    const editorElement = editor.getRootElement();
    const parentElement = editorElement?.parentElement;

    if (parentElement) {
      parentElement.addEventListener('scroll', calculatePages);
    }

    calculatePages();

    return () => {
      unregisterListener();
      if (parentElement) {
        parentElement.removeEventListener('scroll', calculatePages);
      }
    };
  }, [editor]);

  return (
    <div className="fixed bottom-6 right-8 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 text-sm font-medium text-gray-700 pointer-events-none select-none z-10 no-print">
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="15" x2="13" y2="15" />
        </svg>
        Page {currentPage} of {pageCount}
      </div>
    </div>
  );
}

// Export interface
export interface LexicalDocumentEditorHandle {
  editor: LexicalEditor | null;
  insertImage: (url: string) => void;
  insertTable: (rows: number, cols: number) => void;
  insertPageBreak: () => void;
  getHTML: () => string;
  getText: () => string;
}

interface LexicalDocumentEditorProps {
  showPageGuides?: boolean;
}

const LexicalDocumentEditor = forwardRef<LexicalDocumentEditorHandle, LexicalDocumentEditorProps>(({ showPageGuides = true }, ref) => {
  const [editor, setEditor] = useState<LexicalEditor | null>(null);

  const initialConfig = {
    namespace: 'CereforgeDocumentEditor',
    theme: editorTheme,
    onError: (error: Error) => console.error(error),
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      TableNode,
      TableRowNode,
      TableCellNode,
      CodeNode,
      CodeHighlightNode,
      ImageNode,
      PageBreakNode,
    ],
  };

  useImperativeHandle(ref, () => ({
    editor,
    insertImage: (url: string) => {
      if (editor) {
        editor.update(() => {
          const imageNode = $createImageNode(url, 'Inserted image', 400);
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([imageNode]);
          } else {
            const root = $getRoot();
            root.append(imageNode);
          }
        });
      }
    },
    insertTable: (rows: number, cols: number) => {
      if (editor) {
        editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: String(rows), columns: String(cols) });
      }
    },
    insertPageBreak: () => {
      if (editor) {
        editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined);
      }
    },
    getHTML: () => {
      if (!editor) return '';
      let html = '';
      editor.getEditorState().read(() => {
        html = $generateHtmlFromNodes(editor, null);
      });
      return html;
    },
    getText: () => {
      if (!editor) return '';
      let text = '';
      editor.getEditorState().read(() => {
        text = $getRoot().getTextContent();
      });
      return text;
    },
  }));

  const EditorCapturePlugin = () => {
    const [localEditor] = useLexicalComposerContext();

    useEffect(() => {
      setEditor(localEditor);

      // Auto-focus on mount
      setTimeout(() => {
        localEditor.focus();
      }, 100);
    }, [localEditor]);

    return null;
  };

  const onChange = useCallback((_editorState: EditorState) => {
    // Handle content changes
  }, []);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only focus if clicking on the container itself, not on the editor content
    const target = e.target as HTMLElement;
    const isEditorContent = target.closest('[contenteditable="true"]');

    if (!isEditorContent && editor) {
      editor.focus();
      // Move cursor to end
      editor.update(() => {
        const root = $getRoot();
        root.selectEnd();
      });
    }
  }, [editor]);

  return (
    <div
      className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 py-8 relative cursor-text"
      onClick={handleContainerClick}
    >
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex justify-center">
        <div
          className="relative bg-white shadow-2xl"
          style={{
            width: `${A4_WIDTH_MM}mm`,
            minHeight: `${A4_HEIGHT_MM}mm`,
          }}
        >
          <div
            style={{
              width: `${A4_WIDTH_MM}mm`,
              minHeight: `${A4_HEIGHT_MM}mm`,
              padding: `${MARGIN_TOP_MM}mm ${MARGIN_RIGHT_MM}mm ${MARGIN_BOTTOM_MM}mm ${MARGIN_LEFT_MM}mm`,
              position: 'relative',
            }}
          >
            <LexicalComposer initialConfig={initialConfig}>
              <div className="relative min-h-full">
                {showPageGuides && <VisualPageGuidesPlugin />}

                <EditorCapturePlugin />
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      className="outline-none min-h-full prose prose-sm max-w-none focus:outline-none relative z-10"
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        color: '#1f2937',
                      }}
                    />
                  }
                  placeholder={
                    <div className="absolute top-0 left-0 text-gray-400 pointer-events-none text-base z-0">
                      Start typing your document... (Press Ctrl+Enter to insert a page break)
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <ListPlugin />
                <LinkPlugin />
                <TablePlugin />
                <PageBreakPlugin />
                <PageBreakKeyboardPlugin />
                <OnChangePlugin onChange={onChange} />
                <PageCounterPlugin />
              </div>
            </LexicalComposer>
          </div>
        </div>
      </div>
    </div>
  );
});

LexicalDocumentEditor.displayName = 'LexicalDocumentEditor';

export default LexicalDocumentEditor;