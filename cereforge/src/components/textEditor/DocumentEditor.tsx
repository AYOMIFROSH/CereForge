// DocumentEditor.tsx - TipTap editor with real page breaks
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Node, mergeAttributes } from '@tiptap/core';
import type { RawCommands } from '@tiptap/core';

// A4 Page Constants
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_TOP_MM = 25;
const MARGIN_BOTTOM_MM = 25;
const MARGIN_LEFT_MM = 20;
const MARGIN_RIGHT_MM = 20;

const mmToPx = (mm: number) => (mm * 96) / 25.4;
const PAGE_HEIGHT_PX = mmToPx(A4_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM);


// Custom Page Break Extension
const PageBreak = Node.create({
  name: 'pageBreak',

  group: 'block',

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'page-break',
        class: 'page-break',
        style: `
          page-break-after: always;
          break-after: page;
          height: ${mmToPx(MARGIN_BOTTOM_MM + MARGIN_TOP_MM)}px;
          position: relative;
          margin: 0;
          padding: 0;
          pointer-events: none;
          user-select: none;
        `,
      }),
      [
        'div',
        {
          style: `
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
            transform: translateY(-50%);
          `,
        },
      ],
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({ type: this.name });
        },
    } as Partial<RawCommands>;
  },
});

// Export this type so CereforgeEditor can use it
export interface DocumentEditorHandle {
  editor: Editor | null;
  insertImage: (url: string) => void;
  insertTable: (rows: number, cols: number) => void;
  getHTML: () => string;
  getText: () => string;
}

interface DocumentEditorProps {
  // Props can be added here in the future if needed
  // For example: initialContent?: string, onContentChange?: (content: string) => void
}

const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>((_props, ref) => {
  const [pages, setPages] = useState<number[]>([1]);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 w-full my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-50 p-2 font-bold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2 min-w-[100px]',
        },
      }),
      TextStyle,
      Color,
      PageBreak,
      Placeholder.configure({
        placeholder: 'Start typing your document...',
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg focus:outline-none',
        style: 'word-wrap: break-word; overflow-wrap: break-word;',
      },
    },
    content: '',
  });

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    editor,
    insertImage: (url: string) => {
      if (editor) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
    insertTable: (rows: number, cols: number) => {
      if (editor) {
        editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
      }
    },
    getHTML: () => editor?.getHTML() || '',
    getText: () => editor?.getText() || '',
  }));

  // Calculate pages and insert page breaks automatically
  useEffect(() => {
    if (!editor || !contentWrapperRef.current) return;

    const calculatePagesAndBreaks = () => {
      const editorElement = contentWrapperRef.current?.querySelector('.ProseMirror');
      if (!editorElement) return;

      // Calculate required pages based on content
      let currentPageHeight = 0;
      let pageCount = 1;
      const children = Array.from(editorElement.children);
      
      children.forEach((child) => {
        if (child.getAttribute('data-type') === 'page-break') {
          currentPageHeight = 0;
          pageCount++;
          return;
        }

        const childHeight = (child as HTMLElement).offsetHeight;
        
        // Check if adding this element would exceed page height
        if (currentPageHeight + childHeight > PAGE_HEIGHT_PX && currentPageHeight > 0) {
          currentPageHeight = childHeight;
          pageCount++;
        } else {
          currentPageHeight += childHeight;
        }
      });

      // Update page count
      setPages(Array.from({ length: Math.max(pageCount, 1) }, (_, i) => i + 1));
    };

    const timeoutId = setTimeout(calculatePagesAndBreaks, 100);
    return () => clearTimeout(timeoutId);
  }, [editor?.state.doc]);

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading document editor...</div>
      </div>
    );
  }

  return (
    <div 
      ref={editorContainerRef} 
      className="flex-1 overflow-y-auto bg-gray-100 py-8"
    >
      <div className="flex justify-center">
        <div 
          className="relative bg-white shadow-2xl"
          style={{
            width: `${A4_WIDTH_MM}mm`,
            minHeight: `${A4_HEIGHT_MM}mm`,
          }}
        >
          {/* Editor content */}
          <div
            ref={contentWrapperRef}
            style={{
              width: `${A4_WIDTH_MM}mm`,
              minHeight: `${A4_HEIGHT_MM}mm`,
              padding: `${MARGIN_TOP_MM}mm ${MARGIN_RIGHT_MM}mm ${MARGIN_BOTTOM_MM}mm ${MARGIN_LEFT_MM}mm`,
            }}
          >
            <EditorContent editor={editor} />
          </div>
          
          {/* Page number indicator */}
          <div className="absolute bottom-4 right-8 text-gray-400 text-sm pointer-events-none select-none">
            Page 1 of {pages.length}
          </div>
        </div>
      </div>
    </div>
  );
});

DocumentEditor.displayName = 'DocumentEditor';

export default DocumentEditor;