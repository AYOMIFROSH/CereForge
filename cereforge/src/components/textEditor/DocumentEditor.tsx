import { useEffect, useState, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
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
  DecoratorNode,
  EditorState,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  $createParagraphNode,
  $isDecoratorNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { KEY_ENTER_COMMAND, COMMAND_PRIORITY_HIGH } from 'lexical';

// A4 Page Constants
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_TOP_MM = 25;
const MARGIN_BOTTOM_MM = 25;
const MARGIN_LEFT_MM = 20;
const MARGIN_RIGHT_MM = 20;
const PAGE_BREAK_MARGIN_MM = 20;

const mmToPx = (mm: number) => (mm * 96) / 25.4;
const PAGE_HEIGHT_PX = mmToPx(A4_HEIGHT_MM);
const PAGE_BREAK_MARGIN_PX = mmToPx(PAGE_BREAK_MARGIN_MM);

// Custom PageBreak Node
export type SerializedPageBreakNode = {
  pageNumber: number;
  type: 'pagebreak';
  version: 1;
} & SerializedLexicalNode;

class PageBreakNode extends DecoratorNode<JSX.Element> {
  __pageNumber: number;

  static getType(): string {
    return 'pagebreak';
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__pageNumber, node.__key);
  }

  constructor(pageNumber: number, key?: NodeKey) {
    super(key);
    this.__pageNumber = pageNumber;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.height = `${PAGE_BREAK_MARGIN_PX * 2}px`;
    div.style.margin = '0';
    div.style.padding = '0';
    div.style.position = 'relative';
    div.style.userSelect = 'none';
    div.style.pointerEvents = 'none';
    div.className = 'page-break-node no-print';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <div
        style={{
          height: `${PAGE_BREAK_MARGIN_PX * 2}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom, transparent, rgba(241, 245, 249, 0.3) 20%, rgba(241, 245, 249, 0.3) 80%, transparent)',
          position: 'relative',
          pointerEvents: 'none',
          userSelect: 'none',
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
          Page {this.__pageNumber} ends here
        </div>
      </div>
    );
  }

  static importJSON(serializedNode: SerializedPageBreakNode): PageBreakNode {
    return $createPageBreakNode(serializedNode.pageNumber);
  }

  exportJSON(): SerializedPageBreakNode {
    return {
      pageNumber: this.__pageNumber,
      type: 'pagebreak',
      version: 1,
    };
  }

  isInline(): boolean {
    return false;
  }

  isIsolated(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return false;
  }
}

function $createPageBreakNode(pageNumber: number): PageBreakNode {
  return new PageBreakNode(pageNumber);
}

// Custom Image Node
export type SerializedImageNode = {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  type: 'image';
  version: 1;
} & SerializedLexicalNode;

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

// Auto Page Break Plugin - FIXED VERSION
function AutoPageBreakPlugin() {
  const [editor] = useLexicalComposerContext();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      // Prevent concurrent processing
      if (isProcessingRef.current) return;

      requestAnimationFrame(() => {
        editorState.read(() => {
          const root = $getRoot();
          const editorElement = editor.getRootElement();
          if (!editorElement) return;

          const children = root.getChildren();
          let cumulativeHeight = 0;
          let currentPage = 1;
          const nodesToInsertBreaksAfter: { index: number; page: number }[] = [];

          // Calculate where breaks should be
          for (let i = 0; i < children.length; i++) {
            const child = children[i];

            // If it's already a page break, reset and continue
            if ($isDecoratorNode(child) && child.getType() === 'pagebreak') {
              currentPage++;
              cumulativeHeight = 0;
              continue;
            }

            try {
              const domNode = editor.getElementByKey(child.getKey());
              if (domNode instanceof HTMLElement) {
                const height = domNode.offsetHeight;
                cumulativeHeight += height;

                // Use 20mm total (not 10mm + 10mm) to give more buffer
                const effectivePageHeight = PAGE_HEIGHT_PX - mmToPx(MARGIN_TOP_MM) - mmToPx(MARGIN_BOTTOM_MM) - mmToPx(20);

                if (cumulativeHeight > effectivePageHeight) {
                  nodesToInsertBreaksAfter.push({ index: i, page: currentPage });
                  currentPage++;
                  cumulativeHeight = height;
                }
              }
            } catch (e) {
              // Skip if can't get DOM node
            }
          }

          if (nodesToInsertBreaksAfter.length > 0) {
            isProcessingRef.current = true;

            editor.update(() => {
              const root = $getRoot();
              const children = root.getChildren();

              // Insert from bottom to top to maintain indices
              for (let i = nodesToInsertBreaksAfter.length - 1; i >= 0; i--) {
                const { index, page } = nodesToInsertBreaksAfter[i];

                // REAL-TIME CHECK: Does a page break already exist at this position?
                const prevChild = children[index - 1];
                const currChild = children[index];
                const nextChild = children[index + 1];

                // Check if any of these is already a page break
                const hasBreakBefore = prevChild && $isDecoratorNode(prevChild) && prevChild.getType() === 'pagebreak';
                const hasBreakHere = currChild && $isDecoratorNode(currChild) && currChild.getType() === 'pagebreak';
                const hasBreakAfter = nextChild && $isDecoratorNode(nextChild) && nextChild.getType() === 'pagebreak';

                // Skip if any page break is nearby
                if (hasBreakBefore || hasBreakHere || hasBreakAfter) {
                  continue;
                }

                const pageBreak = $createPageBreakNode(page);
                const targetChild = children[index];

                if (targetChild) {
                  targetChild.insertBefore(pageBreak);

                  // Ensure there's a paragraph after the page break
                  const nextSibling = pageBreak.getNextSibling();
                  if (!nextSibling) {
                    const emptyParagraph = $createParagraphNode();
                    pageBreak.insertAfter(emptyParagraph);
                  }
                }
              }
            }, {
              onUpdate: () => {
                requestAnimationFrame(() => {
                  isProcessingRef.current = false;
                });
              }
            });
          } else {
            // No breaks to insert, reset processing flag
            isProcessingRef.current = false;
          }
        });
      });
    });

    return removeUpdateListener;
  }, [editor]);

  return null;
}

// EnterKeyHandlerPlugin — prevents Enter creating a paragraph before an existing page break
function EnterKeyHandlerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const remove = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent) => {
        // allow Shift+Enter (line break) to pass through
        if (event && (event.shiftKey || event.metaKey || event.ctrlKey)) {
          return false;
        }

        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        // The anchor node at the selection
        const anchorNode = selection.anchor.getNode();
        const root = $getRoot();

        // Walk up to top-level child (direct child of root)
        let topLevelNode = anchorNode;
        let parent = topLevelNode.getParent();
        while (parent && parent !== root) {
          topLevelNode = parent;
          parent = topLevelNode.getParent();
        }

        // If topLevelNode is the root itself, don't handle
        if (!topLevelNode || topLevelNode === root) {
          return false;
        }

        const nextSibling = topLevelNode.getNextSibling();

        // If there's an immediate pagebreak next, move selection to the first editable node after it
        if (nextSibling && $isDecoratorNode(nextSibling) && nextSibling.getType() === 'pagebreak') {
          editor.update(() => {
            // Try to find the node after the pagebreak
            const after = nextSibling.getNextSibling();
            if (after) {
              // Prefer selecting the first text node inside `after` if possible; otherwise select the node itself.
              // Many node types support `.select()`.
              try {
                // some nodes (paragraphs, etc.) support .select()
                // select at position 0 for a fresh caret at start
                (after as any).select && (after as any).select(0, 0);
              } catch {
                // Fallback: create an empty paragraph after the page break and select it
                const p = $createParagraphNode();
                nextSibling.insertAfter(p);
                p.select();
              }
            } else {
              // If nothing exists after the pagebreak, append an empty paragraph and focus it
              const p = $createParagraphNode();
              nextSibling.insertAfter(p);
              p.select();
            }
          });

          // handled: prevent default Enter behaviour
          return true;
        }

        return false; // otherwise let default Enter behaviour happen
      },
      COMMAND_PRIORITY_HIGH
    );

    return () => remove();
  }, [editor]);

  return null;
}


// Editor Theme
const editorTheme = {
  paragraph: 'mb-2 leading-relaxed',
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

// Page Counter Plugin
function PageCounterPlugin() {
  const [editor] = useLexicalComposerContext();
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const calculatePages = () => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();

        let pageBreaks = 0;
        for (const child of children) {
          if ($isDecoratorNode(child) && child.getType() === 'pagebreak') {
            pageBreaks++;
          }
        }

        setPageCount(pageBreaks + 1);

        // Calculate current page based on cursor position
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          let pageBeforeCursor = 1;

          for (const child of children) {
            if (child.getKey() === anchorNode.getKey()) {
              break;
            }
            if ($isDecoratorNode(child) && child.getType() === 'pagebreak') {
              pageBeforeCursor++;
            }
          }

          setCurrentPage(pageBeforeCursor);
        }
      });
    };

    const unregister = editor.registerUpdateListener(() => {
      calculatePages();
    });

    calculatePages();

    return unregister;
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
  getHTML: () => string;
  getText: () => string;
}

interface LexicalDocumentEditorProps {
  showPageGuides?: boolean;
}

const LexicalDocumentEditor = forwardRef<LexicalDocumentEditorHandle, LexicalDocumentEditorProps>(
  ({ showPageGuides = true }, ref) => {
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
        requestAnimationFrame(() => {
          localEditor.focus();
        });
      }, [localEditor]);

      return null;
    };

    const onChange = useCallback((_editorState: EditorState) => {
      // Handle content changes
    }, []);

    const handleContainerClick = useCallback(
      (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const isEditorContent = target.closest('[contenteditable="true"]');

        if (!isEditorContent && editor) {
          editor.focus();
          editor.update(() => {
            const root = $getRoot();
            root.selectEnd();
          });
        }
      },
      [editor]
    );

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
            .page-break-node {
              display: block;
              height: 0 !important;
              page-break-after: always;
              break-after: page;
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
              }}
            >
              <LexicalComposer initialConfig={initialConfig}>
                <div className="relative min-h-full">
                  <EditorCapturePlugin />
                  <EnterKeyHandlerPlugin />
                  {showPageGuides && <AutoPageBreakPlugin />}
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        className="outline-none min-h-full prose prose-sm max-w-none focus:outline-none z-10"
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
                        Start typing your document...
                      </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                  <HistoryPlugin />
                  <ListPlugin />
                  <LinkPlugin />
                  <TablePlugin />
                  <OnChangePlugin onChange={onChange} />
                  <PageCounterPlugin />
                </div>
              </LexicalComposer>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LexicalDocumentEditor.displayName = 'LexicalDocumentEditor';

export default LexicalDocumentEditor;