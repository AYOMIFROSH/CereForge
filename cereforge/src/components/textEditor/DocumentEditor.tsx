// LexicalDocumentEditor.tsx - Lexical editor with page breaks for document mode
import { useEffect,  useState, forwardRef, useImperativeHandle, useCallback } from 'react';
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
  Spread,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes,  } from '@lexical/html';
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
// const CONTENT_HEIGHT_PX = mmToPx(A4_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM);

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

// function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
//   return node instanceof ImageNode;
// }

// Custom Page Break Node
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
      height: ${mmToPx(MARGIN_BOTTOM_MM + MARGIN_TOP_MM)}px;
      position: relative;
      margin: 0;
      padding: 0;
      pointer-events: none;
      user-select: none;
    `;
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent)',
          transform: 'translateY(-50%)',
        }}
      />
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

// Editor Theme
const editorTheme = {
  paragraph: 'mb-1',
  quote: 'border-l-4 border-blue-900 pl-4 italic my-2 text-gray-600',
  heading: {
    h1: 'text-3xl font-bold my-2',
    h2: 'text-2xl font-bold my-2',
    h3: 'text-xl font-bold my-2',
  },
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal pl-6 my-2',
    ul: 'list-disc pl-6 my-2',
    listitem: 'my-1',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
  link: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
  code: 'bg-gray-100 px-1 py-0.5 rounded font-mono text-sm',
  codeHighlight: {
    atrule: 'text-purple-600',
    attr: 'text-blue-600',
    boolean: 'text-orange-600',
    builtin: 'text-green-600',
    cdata: 'text-gray-600',
    char: 'text-green-600',
    class: 'text-blue-600',
    'class-name': 'text-blue-600',
    comment: 'text-gray-500 italic',
    constant: 'text-orange-600',
    deleted: 'text-red-600',
    doctype: 'text-gray-600',
    entity: 'text-orange-600',
    function: 'text-purple-600',
    important: 'text-red-600',
    inserted: 'text-green-600',
    keyword: 'text-purple-600',
    namespace: 'text-blue-600',
    number: 'text-orange-600',
    operator: 'text-gray-700',
    prolog: 'text-gray-600',
    property: 'text-blue-600',
    punctuation: 'text-gray-700',
    regex: 'text-green-600',
    selector: 'text-green-600',
    string: 'text-green-600',
    symbol: 'text-orange-600',
    tag: 'text-red-600',
    url: 'text-blue-600',
    variable: 'text-orange-600',
  },
};

// Page Counter Plugin
function PageCounterPlugin() {
  const [editor] = useLexicalComposerContext();
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const calculatePages = () => {
      const editorElement = editor.getRootElement();
      if (!editorElement) return;

      const contentHeight = editorElement.scrollHeight;
      const pages = Math.ceil(contentHeight / PAGE_HEIGHT_PX);
      setPageCount(Math.max(1, pages));
    };

    const unregisterListener = editor.registerUpdateListener(() => {
      setTimeout(calculatePages, 100);
    });

    calculatePages();

    return () => {
      unregisterListener();
    };
  }, [editor]);

  return (
    <div className="absolute bottom-4 right-8 text-gray-400 text-sm pointer-events-none select-none">
      Page 1 of {pageCount}
    </div>
  );
}

// Export interface for parent component
export interface LexicalDocumentEditorHandle {
  editor: LexicalEditor | null;
  insertImage: (url: string) => void;
  insertTable: (rows: number, cols: number) => void;
  getHTML: () => string;
  getText: () => string;
}

interface LexicalDocumentEditorProps {}

const LexicalDocumentEditor = forwardRef<LexicalDocumentEditorHandle, LexicalDocumentEditorProps>((_props, ref) => {
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

  // Expose methods to parent component
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
    }, [localEditor]);

    return null;
  };

  const onChange = useCallback((_editorState: EditorState) => {
    // Handle content changes here if needed
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 py-8">
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
              <EditorCapturePlugin />
              <RichTextPlugin
                contentEditable={
                  <ContentEditable 
                    className="outline-none min-h-full prose prose-sm focus:outline-none"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                }
                placeholder={
                  <div className="absolute top-8 left-8 text-gray-400 pointer-events-none">
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
            </LexicalComposer>
          </div>
        </div>
      </div>
    </div>
  );
});

LexicalDocumentEditor.displayName = 'LexicalDocumentEditor';

export default LexicalDocumentEditor;