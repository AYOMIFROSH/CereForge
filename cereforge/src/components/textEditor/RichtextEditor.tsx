import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createEditor, Transforms, Editor, Element as SlateElement, BaseEditor, Descendant, Path, Range } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote,
  Image, Link2, Upload, X, Check,
  Type, Paintbrush, Edit2, Trash2,
  ChevronDown, ChevronUp, Download, FileText, File, Code
} from 'lucide-react';
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL
} from 'lexical';
import { $isListNode } from '@lexical/list';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';

// Import the independent sidebar
import EditorSidebar from './TextSidebar';
import LexicalDocumentEditor, { LexicalDocumentEditorHandle } from './DocumentEditor';
// Sample cereforge logo URL
import cereforgeLogo from '../../assets/cereForge.png'

import { useEditorPreferences } from '@/hooks/useEditorPreferences';

// Add this after the other imports, before the cereforgeLogo import
import { 
  exportDocument, 
  generateFileName, 
  exportToTXT, 
  exportToHTML,
  type ExportFormat 
} from '../../utils/exportDocument';

// TypeScript types (same as before)
type CustomElement =
  | { type: 'paragraph'; align?: string; children: CustomText[] }
  | { type: 'heading1'; align?: string; children: CustomText[] }
  | { type: 'heading2'; align?: string; children: CustomText[] }
  | { type: 'heading3'; align?: string; children: CustomText[] }
  | { type: 'bulleted-list'; children: CustomElement[] }
  | { type: 'numbered-list'; children: CustomElement[] }
  | { type: 'list-item'; children: CustomText[] }
  | { type: 'block-quote'; children: CustomText[] }
  | { type: 'link'; url: string; children: CustomText[] }
  | { type: 'image'; url: string; align?: 'left' | 'center' | 'right'; width?: number; children: CustomText[] }
  | { type: 'table'; rows: number; cols: number; align?: 'left' | 'center' | 'right'; width?: number; cellData?: string[][]; children: CustomText[] }
  | { type: 'chart'; chartType: 'bar' | 'line' | 'pie' | 'column'; title: string; data: { labels: string[]; values: number[] }; align?: 'left' | 'center' | 'right'; width?: number; children: CustomText[] };

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  fontSize?: string;
  color?: string;
  backgroundColor?: string;
};


declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Export format configurations
const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF Document', icon: <FileText size={16} />, extension: '.pdf' },
  { value: 'docx', label: 'Word Document', icon: <File size={16} />, extension: '.docx' },
  { value: 'txt', label: 'Plain Text', icon: <FileText size={16} />, extension: '.txt' },
  { value: 'html', label: 'HTML File', icon: <Code size={16} />, extension: '.html' },
  { value: 'md', label: 'Markdown', icon: <FileText size={16} />, extension: '.md' },
] as const;

// Custom plugins (same as before)
const withCustomElements = (editor: Editor) => {
  const { isInline, isVoid, deleteBackward } = editor;

  editor.isInline = (element) => {
    return element.type === 'image' || element.type === 'link' ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === 'image' || element.type === 'chart' || element.type === 'table'
      ? true
      : isVoid(element);
  };

  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'table',
      });

      if (cell) {
        return;
      }
    }

    deleteBackward(...args);
  };

  return editor;
};

const CereforgeEditor: React.FC = () => {
  // Mode state - NEW
  const { editorMode, sidebarOpen, setEditorMode, setSidebarOpen } = useEditorPreferences();

  // Save As dropdown state
  const [showSaveAsDropdown, setShowSaveAsDropdown] = useState<boolean>(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');

  // Editor state
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showFontSize, setShowFontSize] = useState<boolean>(false);
  const [showTextColor, setShowTextColor] = useState<boolean>(false);
  const [showBgColor, setShowBgColor] = useState<boolean>(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState<boolean>(false);
  const [hoveredImagePath, setHoveredImagePath] = useState<string | null>(null);
  const [hoveredTablePath, setHoveredTablePath] = useState<string | null>(null);
  const [hoveredChartPath, setHoveredChartPath] = useState<string | null>(null);
  const [hoveredLinkPath, setHoveredLinkPath] = useState<string | null>(null);
  const [resizingElement, setResizingElement] = useState<{
    path: Path;
    startX: number;
    startWidth: number;
  } | null>(null);
  const [showLinkPopover, setShowLinkPopover] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [linkText, setLinkText] = useState<string>('');
  const [linkPopoverPosition, setLinkPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [editingLinkPath, setEditingLinkPath] = useState<Path | null>(null);

  // Chart editing state
  const [showChartEditModal, setShowChartEditModal] = useState<boolean>(false);
  const [editingChartPath, setEditingChartPath] = useState<Path | null>(null);
  const [editingChartData, setEditingChartData] = useState<{
    type: 'bar' | 'line' | 'pie' | 'column';
    title: string;
    labels: string[];
    values: number[];
  } | null>(null);

  // Table editing state
  const [showTableEditModal, setShowTableEditModal] = useState<boolean>(false);
  const [editingTablePath, setEditingTablePath] = useState<Path | null>(null);
  const [editingTableData, setEditingTableData] = useState<{
    rows: number;
    cols: number;
    cellData: string[][];
  } | null>(null);

  const [exportProgress, setExportProgress] = useState<{
  isExporting: boolean;
  progress: number;
  message: string;
  format: ExportFormat | null;
}>({
  isExporting: false,
  progress: 0,
  message: '',
  format: null,
});


  const [lexicalFormatState, setLexicalFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    heading1: false,
    heading2: false,
    heading3: false,
    bulletList: false,
    numberedList: false,
    blockQuote: false,
    alignLeft: true,  // ✅ Changed from false to true
    alignCenter: false,
    alignRight: false,
  });

  const documentEditorRef = useRef<LexicalDocumentEditorHandle>(null);

  const editor = useMemo(() => withCustomElements(withHistory(withReact(createEditor()))), []);
  const [value, setValue] = useState<Descendant[]>([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    } as CustomElement,
  ]);


  useEffect(() => {
    ReactEditor.focus(editor);
  }, [editor]);


  useEffect(() => {
    if (editorMode !== 'document' || !documentEditorRef.current?.editor) return;

    const lexicalEditor = documentEditorRef.current.editor;

    const updateFormatState = () => {
      try {
        lexicalEditor.getEditorState().read(() => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) {
            // ✅ Even with no selection, reset to defaults
            setLexicalFormatState({
              bold: false,
              italic: false,
              underline: false,
              strikethrough: false,
              heading1: false,
              heading2: false,
              heading3: false,
              bulletList: false,
              numberedList: false,
              blockQuote: false,
              alignLeft: true,
              alignCenter: false,
              alignRight: false,
            });
            return;
          }

          const anchor = selection.anchor.getNode();
          const element = anchor.getKey() === 'root'
            ? anchor
            : anchor.getTopLevelElementOrThrow();

          // Get alignment
          const alignment = $isElementNode(element)
            ? (element.getFormatType() || 'left')
            : 'left';

          // ✅ CRITICAL FIX: Check for lists by traversing UP from anchor node
          let bulletActive = false;
          let numberedActive = false;
          let currentNode = anchor;

          try {
            if (documentEditorRef.current) {
              // these methods read the editor state internally and return a boolean
              bulletActive = documentEditorRef.current.isBulletListActive();
              numberedActive = documentEditorRef.current.isNumberedListActive();
            } else {
              // fallback: traverse up (keeps backward compatibility)
              let currentNode = anchor;
              while (currentNode) {
                if ($isListNode(currentNode)) {
                  const listType = currentNode.getListType();
                  bulletActive = listType === 'bullet';
                  numberedActive = listType === 'number';
                  break;
                }
                const parent = currentNode.getParent();
                if (!parent) break;
                currentNode = parent;
              }
            }
          } catch (e) {
            // safe fallback - keep toolbar off if anything goes wrong
            bulletActive = false;
            numberedActive = false;
          }

          // Traverse up the tree to find any list node
          while (currentNode) {
            if ($isListNode(currentNode)) {
              const listType = currentNode.getListType();
              bulletActive = listType === 'bullet';
              numberedActive = listType === 'number';
              break;
            }
            const parent = currentNode.getParent();
            if (!parent) break;
            currentNode = parent;
          }

          // Check for headings
          const heading1 = $isHeadingNode(element) && element.getTag() === 'h1';
          const heading2 = $isHeadingNode(element) && element.getTag() === 'h2';
          const heading3 = $isHeadingNode(element) && element.getTag() === 'h3';

          // Check for quote
          const blockQuote = $isQuoteNode(element);

          // ✅ Update state
          setLexicalFormatState({
            bold: selection.hasFormat('bold'),
            italic: selection.hasFormat('italic'),
            underline: selection.hasFormat('underline'),
            strikethrough: selection.hasFormat('strikethrough'),
            heading1,
            heading2,
            heading3,
            bulletList: bulletActive,
            numberedList: numberedActive,
            blockQuote,
            alignLeft: alignment === 'left',
            alignCenter: alignment === 'center',
            alignRight: alignment === 'right',
          });
        });
      } catch (error) {
        console.warn('Format state update failed:', error);
      }
    };

    // ✅ Register update listener - fires AFTER state changes
    const unregisterUpdate = lexicalEditor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateFormatState();
      });
    });

    // ✅ Register selection change listener for immediate updates
    const unregisterSelection = lexicalEditor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        requestAnimationFrame(updateFormatState);
        return false; // Allow other handlers to run
      },
      COMMAND_PRIORITY_CRITICAL
    );

    // ✅ Initial update
    requestAnimationFrame(updateFormatState);

    return () => {
      unregisterUpdate();
      unregisterSelection();
    };
  }, [editorMode]);

  // Helper function to ensure empty paragraph after void elements
  const ensureEmptyParagraphAfter = useCallback(() => {
    try {
      const { selection } = editor;
      if (!selection) return;

      const [match] = Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) &&
          (n.type === 'image' || n.type === 'table' || n.type === 'chart'),
        at: selection,
      });

      if (!match) return;

      const [, elementPath] = match;
      const nextPath = Path.next(elementPath);

      try {
        const [nextNode] = Editor.node(editor, nextPath);

        if (
          SlateElement.isElement(nextNode) &&
          nextNode.type === 'paragraph' &&
          Editor.isEmpty(editor, nextNode)
        ) {
          Transforms.select(editor, Editor.start(editor, nextPath));
          return;
        }

        const emptyParagraph: CustomElement = {
          type: 'paragraph',
          children: [{ text: '' }],
        };
        Transforms.insertNodes(editor, emptyParagraph, { at: nextPath });
        Transforms.select(editor, Editor.start(editor, nextPath));

      } catch (e) {
        const emptyParagraph: CustomElement = {
          type: 'paragraph',
          children: [{ text: '' }],
        };

        const parentPath = Path.parent(elementPath);
        const newPath = [...parentPath, elementPath[elementPath.length - 1] + 1];

        Transforms.insertNodes(editor, emptyParagraph, { at: newPath });
        Transforms.select(editor, Editor.start(editor, newPath));
      }
    } catch (error) {
      console.error('Error ensuring empty paragraph:', error);
      try {
        Transforms.move(editor);
      } catch (e) {
        // Silent fail
      }
    }
  }, [editor]);

  const handleExportDocument = useCallback(async (format: ExportFormat) => {
  // Prevent multiple simultaneous exports
  if (exportProgress.isExporting) {
    return;
  }

  setExportProgress({
    isExporting: true,
    progress: 0,
    message: 'Starting export...',
    format,
  });

  if (editorMode === 'document') {
    if (!documentEditorRef.current) {
      console.error('Document editor ref not available');
      setExportProgress({
        isExporting: false,
        progress: 0,
        message: '',
        format: null,
      });
      return;
    }

    try {
      await exportDocument({
        format,
        getHTML: () => documentEditorRef.current?.getHTML() || '',
        getText: () => documentEditorRef.current?.getText() || '',
        documentTitle: undefined,
        onProgress: (progress: number, message: string) => {
          setExportProgress({
            isExporting: true,
            progress,
            message,
            format,
          });
        },
      });

      // Success - show completion briefly before closing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setExportProgress({
        isExporting: false,
        progress: 0,
        message: '',
        format: null,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to export document. Please try again.');
      
      setExportProgress({
        isExporting: false,
        progress: 0,
        message: '',
        format: null,
      });
    }
  } else {
    // Email mode exports using Slate
    const plainText = value
      .map(node => {
        if ('children' in node) {
          return node.children
            .map(child => ('text' in child ? child.text : ''))
            .join('');
        }
        return '';
      })
      .join('\n');

    try {
      setExportProgress({
        isExporting: true,
        progress: 50,
        message: 'Preparing export...',
        format,
      });

      switch (format) {
        case 'txt':
          exportToTXT(plainText, generateFileName(undefined, 'txt'));
          break;

        case 'html': {
          const htmlContent = value
            .map(node => {
              if ('children' in node && 'type' in node) {
                const text = node.children
                  .map(child => ('text' in child ? child.text : ''))
                  .join('');
                
                switch (node.type) {
                  case 'heading1':
                    return `<h1>${text}</h1>`;
                  case 'heading2':
                    return `<h2>${text}</h2>`;
                  case 'heading3':
                    return `<h3>${text}</h3>`;
                  default:
                    return `<p>${text}</p>`;
                }
              }
              return '';
            })
            .join('');
          
          exportToHTML(htmlContent, generateFileName(undefined, 'html'));
          break;
        }

        default:
          alert(`${format.toUpperCase()} export is only available in Document mode. Please switch to Document mode to use this feature.`);
      }

      setExportProgress({
        isExporting: true,
        progress: 100,
        message: 'Complete!',
        format,
      });

      await new Promise(resolve => setTimeout(resolve, 800));
      
      setExportProgress({
        isExporting: false,
        progress: 0,
        message: '',
        format: null,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
      
      setExportProgress({
        isExporting: false,
        progress: 0,
        message: '',
        format: null,
      });
    }
  }

  setShowSaveAsDropdown(false);
}, [value, editorMode, exportProgress.isExporting]);
  // Sidebar handlers
  const handleInsertGif = useCallback((url: string) => {
    if (editorMode === 'document') {
      documentEditorRef.current?.insertImage(url, 400);
    } else {
      const image: CustomElement = {
        type: 'image',
        url,
        align: 'left',
        width: 300,
        children: [{ text: '' }],
      };
      Transforms.insertNodes(editor, image);
      ensureEmptyParagraphAfter();
    }
    ReactEditor.focus(editor);
  }, [editor, editorMode, ensureEmptyParagraphAfter]);

  const handleInsertSticker = useCallback((url: string) => {
    if (editorMode === 'document') {
      documentEditorRef.current?.insertImage(url, 150);
    } else {
      const image: CustomElement = {
        type: 'image',
        url,
        align: 'left',
        width: 150,
        children: [{ text: '' }],
      };
      Transforms.insertNodes(editor, image);
      ensureEmptyParagraphAfter();
    }
    ReactEditor.focus(editor);
  }, [editor, editorMode, ensureEmptyParagraphAfter]);

  const handleInsertClip = useCallback((url: string) => {
    if (editorMode === 'document') {
      documentEditorRef.current?.insertImage(url, 500);
    } else {
      const image: CustomElement = {
        type: 'image',
        url,
        align: 'center',
        width: 400,
        children: [{ text: '' }],
      };
      Transforms.insertNodes(editor, image);
      ensureEmptyParagraphAfter();
    }
    ReactEditor.focus(editor);
  }, [editor, editorMode, ensureEmptyParagraphAfter]);

  const handleInsertEmoji = useCallback((emoji: string) => {
    if (editorMode === 'document') {
      // Emojis work natively in both editors
      documentEditorRef.current?.editor?.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(emoji);
        }
      });
    } else {
      Transforms.insertText(editor, emoji);
    }
    ReactEditor.focus(editor);
  }, [editor, editorMode]);

  // Update handleInsertTable to work for both
  const handleInsertTable = useCallback((rows: number, cols: number) => {
    if (editorMode === 'email') {
      // Existing Slate table insertion logic
      const cellData: string[][] = Array(rows).fill(null).map((_, rowIdx) =>
        Array(cols).fill(null).map((_, colIdx) => `Cell ${rowIdx + 1}-${colIdx + 1}`)
      );

      const tableElement: CustomElement = {
        type: 'table',
        rows,
        cols,
        align: 'left',
        width: 600,
        cellData,
        children: [{ text: '' }],
      };
      Transforms.insertNodes(editor, tableElement);
      ensureEmptyParagraphAfter();
    } else {
      // TipTap logic
      documentEditorRef.current?.insertTable(rows, cols);
    }
    ReactEditor.focus(editor);
  }, [editor, editorMode, ensureEmptyParagraphAfter]);

  const handleInsertChart = useCallback((type: 'bar' | 'line' | 'pie' | 'column', data: any) => {
    if (editorMode === 'document') {
      // Insert chart in Lexical document editor
      documentEditorRef.current?.insertChart(type, {
        title: data.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
        labels: data.labels || [],
        values: data.values || []
      });
    } else {
      // Insert chart in Slate email editor
      const chartElement: CustomElement = {
        type: 'chart',
        chartType: type,
        title: data.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
        data: {
          labels: data.labels || [],
          values: data.values || []
        },
        align: 'left',
        width: 600,
        children: [{ text: '' }],
      };
      Transforms.insertNodes(editor, chartElement);
      ensureEmptyParagraphAfter();
    }
    ReactEditor.focus(editor);
  }, [editor, editorMode, ensureEmptyParagraphAfter]);

  const handleEditTable = useCallback((path: Path, element: Extract<CustomElement, { type: 'table' }>) => {
    setEditingTablePath(path);
    setEditingTableData({
      rows: element.rows,
      cols: element.cols,
      cellData: element.cellData || []
    });
    setShowTableEditModal(true);
  }, []);

  const handleSaveTableEdit = useCallback(() => {
    if (editingTablePath && editingTableData) {
      const newCellData: string[][] = [];

      for (let i = 0; i < editingTableData.rows; i++) {
        newCellData[i] = [];
        for (let j = 0; j < editingTableData.cols; j++) {
          newCellData[i][j] = editingTableData.cellData[i]?.[j] ||
            (i === 0 ? `Header ${j + 1}` : `Cell ${i + 1}-${j + 1}`);
        }
      }

      Transforms.setNodes(
        editor,
        {
          rows: editingTableData.rows,
          cols: editingTableData.cols,
          cellData: newCellData
        } as Partial<CustomElement>,
        { at: editingTablePath }
      );

      setShowTableEditModal(false);
      setEditingTablePath(null);
      setEditingTableData(null);
      ReactEditor.focus(editor);
    }
  }, [editor, editingTablePath, editingTableData]);

  const handleUploadCSV = useCallback((file: File) => {
    console.log('CSV file uploaded:', file);
    alert('CSV parsing will be implemented. For now, creating a sample table.');
    handleInsertTable(5, 4);
  }, [handleInsertTable]);

  const toggleFormat = useCallback((format: keyof Omit<CustomText, 'text'>) => {
    if (editorMode === 'document') {
      switch (format) {
        case 'bold':
          documentEditorRef.current?.toggleBold();
          break;
        case 'italic':
          documentEditorRef.current?.toggleItalic();
          break;
        case 'underline':
          documentEditorRef.current?.toggleUnderline();
          break;
        case 'strikethrough':
          documentEditorRef.current?.toggleStrikethrough();
          break;
        case 'subscript':
          documentEditorRef.current?.toggleSubscript();
          break;
        case 'superscript':
          documentEditorRef.current?.toggleSuperscript();
          break;
      }

      // 🔥 CRITICAL FIX: Force immediate state sync after format toggle
      requestAnimationFrame(() => {
        if (documentEditorRef.current?.editor) {
          const lexicalEditor = documentEditorRef.current.editor;
          lexicalEditor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            // Update format state immediately
            setLexicalFormatState(prev => ({
              ...prev,
              bold: selection.hasFormat('bold'),
              italic: selection.hasFormat('italic'),
              underline: selection.hasFormat('underline'),
              strikethrough: selection.hasFormat('strikethrough'),
            }));
          });
        }
      });
    } else {
      const isActive = isFormatActive(format);
      if (isActive) {
        Editor.removeMark(editor, format);
      } else {
        Editor.addMark(editor, format, true);
      }
    }
  }, [editor, editorMode]);


  const isFormatActive = (format: keyof Omit<CustomText, 'text'>): boolean => {
    if (editorMode === 'document') {
      // Use tracked Lexical state for better performance
      return lexicalFormatState[format as keyof typeof lexicalFormatState] || false;
    } else {
      // Slate logic (email mode)
      const marks = Editor.marks(editor);
      return marks ? marks[format] === true : false;
    }
  };

  // Toggle block type - works for both Slate and TipTap
  const toggleBlock = useCallback((format: string) => {
    if (editorMode === 'document') {
      // ✅ Lexical commands with IMMEDIATE state sync
      switch (format) {
        case 'heading1':
          documentEditorRef.current?.toggleHeading(1);
          break;
        case 'heading2':
          documentEditorRef.current?.toggleHeading(2);
          break;
        case 'heading3':
          documentEditorRef.current?.toggleHeading(3);
          break;
        case 'bulleted-list':
          documentEditorRef.current?.toggleBulletList();
          break;
        case 'numbered-list':
          documentEditorRef.current?.toggleNumberedList();
          break;
        case 'block-quote':
          documentEditorRef.current?.toggleQuote();
          break;
        default:
          console.warn(`Block type ${format} not supported in document mode`);
      }

      // 🔥 CRITICAL FIX: Force immediate state sync after block toggle
      requestAnimationFrame(() => {
        if (documentEditorRef.current?.editor) {
          const lexicalEditor = documentEditorRef.current.editor;
          lexicalEditor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            const anchor = selection.anchor.getNode();
            const element = anchor.getKey() === 'root' ? anchor : anchor.getTopLevelElementOrThrow();

            // Check for lists
            let bulletActive = false;
            let numberedActive = false;
            let node = anchor;

            while (node) {
              if ($isListNode(node)) {
                const listType = node.getListType();
                bulletActive = listType === 'bullet';
                numberedActive = listType === 'number';
                break;
              }
              const parent = node.getParent();
              if (!parent) break;
              node = parent;
            }

            // Check for headings
            const heading1 = $isHeadingNode(element) && element.getTag() === 'h1';
            const heading2 = $isHeadingNode(element) && element.getTag() === 'h2';
            const heading3 = $isHeadingNode(element) && element.getTag() === 'h3';

            // Check for quote
            const blockQuote = $isQuoteNode(element);

            // Get alignment
            const alignment = $isElementNode(element)
              ? (element.getFormatType() || 'left')
              : 'left';

            // Immediate state update
            setLexicalFormatState(prev => ({
              ...prev,
              heading1,
              heading2,
              heading3,
              bulletList: bulletActive,
              numberedList: numberedActive,
              blockQuote,
              alignLeft: alignment === 'left',
              alignCenter: alignment === 'center',
              alignRight: alignment === 'right',
            }));
          });
        }
      });
    } else {
      // Slate logic (email mode)
      const isActive = isBlockActive(format);
      const isList = ['bulleted-list', 'numbered-list'].includes(format);

      Transforms.unwrapNodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          ['bulleted-list', 'numbered-list'].includes(n.type),
        split: true,
      });

      const newProperties: Partial<CustomElement> = {
        type: (isActive ? 'paragraph' : isList ? 'list-item' : format) as any,
      };

      Transforms.setNodes<SlateElement>(editor, newProperties);

      if (!isActive && isList) {
        const block: CustomElement = { type: format as any, children: [] };
        Transforms.wrapNodes(editor, block);
      }
    }
  }, [editor, editorMode]);

  const isBlockActive = (format: string): boolean => {
    if (editorMode === 'document') {
      // Map Slate block types to Lexical state
      switch (format) {
        case 'heading1':
          return lexicalFormatState.heading1;
        case 'heading2':
          return lexicalFormatState.heading2;
        case 'heading3':
          return lexicalFormatState.heading3;
        case 'bulleted-list':
          return lexicalFormatState.bulletList;
        case 'numbered-list':
          return lexicalFormatState.numberedList;
        case 'block-quote':
          return lexicalFormatState.blockQuote;
        default:
          return false;
      }
    } else {
      // Slate logic (email mode)
      const [match] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          n.type === format,
      });
      return !!match;
    }
  };

  const getCurrentAlignment = useCallback((): string => {
    if (editorMode === 'document') {
      // ✅ Return current alignment from tracked Lexical state
      if (lexicalFormatState.alignCenter) return 'center';
      if (lexicalFormatState.alignRight) return 'right';
      return 'left';
    } else {
      // Slate logic (email mode)
      const [match] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          Editor.isBlock(editor, n),
      });

      if (match) {
        const [node] = match;
        return (node as any).align || 'left';
      }
      return 'left';
    }
  }, [editor, editorMode, lexicalFormatState]);
  // Set alignment 
  const setAlignment = useCallback((align: string) => {
    if (editorMode === 'document') {
      documentEditorRef.current?.setAlignment(align as 'left' | 'center' | 'right');

      // ✅ FORCE immediate state sync after alignment change
      requestAnimationFrame(() => {
        if (documentEditorRef.current?.editor) {
          const lexicalEditor = documentEditorRef.current.editor;
          lexicalEditor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            const anchor = selection.anchor.getNode();
            const element = anchor.getKey() === 'root' ? anchor : anchor.getTopLevelElementOrThrow();
            const currentAlign = $isElementNode(element) ? (element.getFormatType() || 'left') : 'left';

            // Immediate state update
            setLexicalFormatState(prev => ({
              ...prev,
              alignLeft: currentAlign === 'left',
              alignCenter: currentAlign === 'center',
              alignRight: currentAlign === 'right',
            }));
          });
        }
      });
    } else {
      // Slate alignment (email mode)
      Transforms.setNodes<SlateElement>(
        editor,
        { align } as Partial<CustomElement>,
        {
          match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && Editor.isBlock(editor, n)
        }
      );
    }
  }, [editor, editorMode]);

  const setElementAlignment = useCallback((path: Path, align: 'left' | 'center' | 'right') => {
    Transforms.setNodes(
      editor,
      { align } as Partial<CustomElement>,
      { at: path }
    );
    ReactEditor.focus(editor);
  }, [editor]);

  const setFontSize = useCallback((size: string) => {
    if (editorMode === 'document') {
      documentEditorRef.current?.setFontSize(size);
    } else {
      Editor.addMark(editor, 'fontSize', size);
    }
    setShowFontSize(false);
  }, [editor, editorMode]);

  const setTextColor = useCallback((color: string) => {
    if (editorMode === 'document') {
      documentEditorRef.current?.setTextColor(color);
    } else {
      Editor.addMark(editor, 'color', color);
    }
    setShowTextColor(false);
  }, [editor, editorMode]);


  const setBgColor = useCallback((color: string) => {
    if (editorMode === 'document') {
      documentEditorRef.current?.setBackgroundColor(color);
    } else {
      Editor.addMark(editor, 'backgroundColor', color);
    }
    setShowBgColor(false);
  }, [editor, editorMode]);

  // Insert image - works for both
  const insertImage = useCallback((url: string) => {
    if (editorMode === 'document') {
      documentEditorRef.current?.insertImage(url, 400);
    } else {
      const image: CustomElement = {
        type: 'image',
        url,
        align: 'left',
        width: 300,
        children: [{ text: '' }],
      };
      Transforms.insertNodes(editor, image);
      ensureEmptyParagraphAfter();
    }
    setShowImageModal(false);
    setImageUrl('');
    ReactEditor.focus(editor);
  }, [editor, editorMode, ensureEmptyParagraphAfter]);

  const insertLink = useCallback((url: string, text: string) => {
    if (!url) return;

    if (editorMode === 'document') {
      // Lexical link insertion with custom text
      documentEditorRef.current?.insertLink(url, text);
    } else {
      // Slate link insertion (email mode)
      if (editingLinkPath) {
        Transforms.setNodes(
          editor,
          { url } as Partial<CustomElement>,
          { at: editingLinkPath }
        );

        if (text && text !== Editor.string(editor, editingLinkPath)) {
          const linkNode = Editor.node(editor, editingLinkPath)[0];
          if (SlateElement.isElement(linkNode) && linkNode.type === 'link') {
            for (let i = linkNode.children.length - 1; i >= 0; i--) {
              Transforms.removeNodes(editor, { at: [...editingLinkPath, i] });
            }

            Transforms.insertNodes(
              editor,
              [{ text }],
              { at: [...editingLinkPath, 0] }
            );
          }
        }
      } else {
        const { selection } = editor;
        const isCollapsed = selection && Range.isCollapsed(selection);

        if (isCollapsed) {
          const link: CustomElement = {
            type: 'link',
            url,
            children: [{ text: text || url }],
          };
          Transforms.insertNodes(editor, link);
        } else {
          Transforms.wrapNodes(
            editor,
            {
              type: 'link',
              url,
              children: [],
            } as CustomElement,
            { split: true }
          );
        }

        Transforms.move(editor, { distance: 1, unit: 'offset' });
        Transforms.insertText(editor, ' ');
        Transforms.move(editor, { distance: 1, unit: 'offset' });
      }
    }

    setShowLinkPopover(false);
    setLinkUrl('');
    setLinkText('');
    setEditingLinkPath(null);
    ReactEditor.focus(editor);
  }, [editor, editorMode, editingLinkPath]);

  const removeLink = useCallback(() => {
    Transforms.unwrapNodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
    });
  }, [editor]);

  const isLinkActive = useCallback(() => {
    const [link] = Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
    });
    return !!link;
  }, [editor]);

  const handleLinkClick = useCallback(() => {
    if (editorMode === 'document') {
      // For document mode, just show the popover with empty fields
      setLinkUrl('');
      setLinkText('');
      setShowLinkPopover(true);
      setLinkPopoverPosition({ top: 100, left: 400 }); // Fixed position for document mode
      return;
    }

    // Existing Slate logic for email mode...
    const { selection } = editor;
    if (!selection) return;

    const domSelection = window.getSelection();
    if (domSelection && domSelection.rangeCount > 0) {
      const domRange = domSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();

      setLinkPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }

    const [link] = Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
    });

    if (link) {
      const [linkNode] = link;
      const linkElement = linkNode as Extract<CustomElement, { type: 'link' }>;
      setLinkUrl(linkElement.url);
      setLinkText(Editor.string(editor, link[1]));
    } else {
      const selectedText = Editor.string(editor, selection);
      setLinkText(selectedText);
      setLinkUrl('');
    }

    setShowLinkPopover(true);
  }, [editor, editorMode]);

  const handleEditLink = useCallback((path: Path, element: Extract<CustomElement, { type: 'link' }>) => {
    const domNode = ReactEditor.toDOMNode(editor, element);
    const rect = domNode.getBoundingClientRect();

    setLinkPopoverPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });

    setLinkUrl(element.url);
    setLinkText(Editor.string(editor, path));
    setEditingLinkPath(path);
    setShowLinkPopover(true);
  }, [editor]);

  // Chart editing handlers
  const handleEditChart = useCallback((path: Path, element: Extract<CustomElement, { type: 'chart' }>) => {
    setEditingChartPath(path);
    setEditingChartData({
      type: element.chartType,
      title: element.title,
      labels: [...element.data.labels],
      values: [...element.data.values],
    });
    setShowChartEditModal(true);
  }, []);

  const handleSaveChartEdit = useCallback(() => {
    if (editingChartPath && editingChartData) {
      Transforms.setNodes(
        editor,
        {
          title: editingChartData.title,
          data: {
            labels: editingChartData.labels,
            values: editingChartData.values,
          },
        } as Partial<CustomElement>,
        { at: editingChartPath }
      );
      setShowChartEditModal(false);
      setEditingChartPath(null);
      setEditingChartData(null);
      ReactEditor.focus(editor);
    }
  }, [editor, editingChartPath, editingChartData]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        insertImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [insertImage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        insertImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [insertImage]);

  const handleResizeStart = (e: React.MouseEvent, path: Path, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingElement({
      path,
      startX: e.clientX,
      startWidth: currentWidth,
    });
  };

  React.useEffect(() => {
    if (!resizingElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingElement) return;

      const deltaX = e.clientX - resizingElement.startX;
      const newWidth = Math.max(100, Math.min(800, resizingElement.startWidth + deltaX));

      Transforms.setNodes(
        editor,
        { width: newWidth } as Partial<CustomElement>,
        { at: resizingElement.path }
      );
    };

    const handleMouseUp = () => {
      setResizingElement(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingElement, editor]);

  // Update table cell content
  const updateTableCell = useCallback((path: Path, rowIdx: number, colIdx: number, content: string) => {
    const [node] = Editor.node(editor, path);
    const tableElement = node as Extract<CustomElement, { type: 'table' }>;

    const newCellData = tableElement.cellData ? [...tableElement.cellData] : [];
    if (!newCellData[rowIdx]) {
      newCellData[rowIdx] = [];
    }
    newCellData[rowIdx][colIdx] = content;

    Transforms.setNodes(
      editor,
      { cellData: newCellData } as Partial<CustomElement>,
      { at: path }
    );
  }, [editor]);

  // Render elements
  const renderElement = useCallback((props: RenderElementProps) => {
    const { element } = props;
    const style = { textAlign: (element as any).align || 'left' };

    switch (element.type) {
      case 'heading1':
        return <h1 {...props.attributes} style={style} className="text-3xl font-bold my-2">{props.children}</h1>;
      case 'heading2':
        return <h2 {...props.attributes} style={style} className="text-2xl font-bold my-2">{props.children}</h2>;
      case 'heading3':
        return <h3 {...props.attributes} style={style} className="text-xl font-bold my-2">{props.children}</h3>;
      case 'bulleted-list':
        return <ul {...props.attributes} className="list-disc pl-6 my-2">{props.children}</ul>;
      case 'numbered-list':
        return <ol {...props.attributes} className="list-decimal pl-6 my-2">{props.children}</ol>;
      case 'list-item':
        return <li {...props.attributes}>{props.children}</li>;
      case 'block-quote':
        return (
          <blockquote {...props.attributes} className="border-l-4 border-blue-900 pl-4 italic my-2 text-gray-600">
            {props.children}
          </blockquote>
        );
      case 'link':
        const path = ReactEditor.findPath(editor, element);
        const pathStr = path.join('-');
        const linkElement = element as Extract<CustomElement, { type: 'link' }>;
        const isLinkHovered = hoveredLinkPath === pathStr;

        return (
          <span
            {...props.attributes}
            className="relative inline-block group"
            onMouseEnter={() => setHoveredLinkPath(pathStr)}
            onMouseLeave={() => setHoveredLinkPath(null)}
          >
            <a
              href={linkElement.url}
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  window.open(linkElement.url, '_blank');
                } else {
                  e.preventDefault();
                }
              }}
              title={`${linkElement.url} (Ctrl+Click to open)`}
            >
              {props.children}
            </a>

            <AnimatePresence>
              {isLinkHovered && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -5 }}
                  contentEditable={false}
                  className="absolute -top-10 left-0 bg-gray-800 rounded-lg shadow-xl p-1 flex items-center space-x-1 z-50"
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(linkElement.url, '_blank');
                    }}
                    className="p-1.5 rounded hover:bg-gray-700 transition-colors text-white"
                    title="Visit link"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditLink(path, linkElement);
                    }}
                    className="p-1.5 rounded hover:bg-gray-700 transition-colors text-white"
                    title="Edit link"
                  >
                    <Edit2 size={14} />
                  </button>
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        );
      case 'image':
        const imgPath = ReactEditor.findPath(editor, element);
        const imgPathStr = imgPath.join('-');
        const imageElement = element as Extract<CustomElement, { type: 'image' }>;
        const imageWidth = imageElement.width || 300;
        const imageAlign = imageElement.align || 'left';
        const isImageHovered = hoveredImagePath === imgPathStr;

        const getAlignmentStyle = () => {
          switch (imageAlign) {
            case 'center':
              return { display: 'flex', justifyContent: 'center', width: '100%' };
            case 'right':
              return { display: 'flex', justifyContent: 'flex-end', width: '100%' };
            default:
              return { display: 'inline-block' };
          }
        };

        return (
          <span
            {...props.attributes}
            contentEditable={false}
            className="my-2"
            style={getAlignmentStyle()}
            onMouseEnter={() => setHoveredImagePath(imgPathStr)}
            onMouseLeave={() => setHoveredImagePath(null)}
          >
            <span className="relative inline-block group">
              <AnimatePresence>
                {isImageHovered && (
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-xl px-2 py-1 flex items-center space-x-1 z-50"
                    contentEditable={false}
                  >
                    <button
                      onClick={() => setElementAlignment(imgPath, 'left')}
                      className={`p-1.5 rounded transition-colors ${imageAlign === 'left' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      title="Align Left"
                    >
                      <AlignLeft size={16} />
                    </button>
                    <button
                      onClick={() => setElementAlignment(imgPath, 'center')}
                      className={`p-1.5 rounded transition-colors ${imageAlign === 'center' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      title="Align Center"
                    >
                      <AlignCenter size={16} />
                    </button>
                    <button
                      onClick={() => setElementAlignment(imgPath, 'right')}
                      className={`p-1.5 rounded transition-colors ${imageAlign === 'right' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      title="Align Right"
                    >
                      <AlignRight size={16} />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-1" />
                    <button
                      onClick={() => {
                        Transforms.removeNodes(editor, { at: imgPath });
                        ReactEditor.focus(editor);
                      }}
                      className="p-1.5 rounded transition-colors text-red-400 hover:bg-red-900/50 hover:text-red-300"
                      title="Delete Image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.span>
                )}
              </AnimatePresence>

              <span
                className="relative inline-block"
                style={{ width: `${imageWidth}px`, maxWidth: '100%' }}
              >
                <img
                  src={imageElement.url}
                  alt="Inserted"
                  className="max-w-full h-auto rounded-lg shadow-md hover:shadow-xl transition-shadow block"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  draggable={false}
                />

                <span
                  className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-tl cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => {
                    const imgElement = e.currentTarget.previousElementSibling as HTMLImageElement;
                    handleResizeStart(e, imgPath, imgElement.offsetWidth);
                  }}
                  style={{ cursor: 'nwse-resize', zIndex: 10 }}
                  contentEditable={false}
                />
              </span>
            </span>
            {props.children}
          </span>
        );
      case 'table':
        const tablePath = ReactEditor.findPath(editor, element);
        const tablePathStr = tablePath.join('-');
        const tableElement = element as Extract<CustomElement, { type: 'table' }>;
        const tableWidth = tableElement.width || 600;
        const tableAlign = tableElement.align || 'left';
        const isTableHovered = hoveredTablePath === tablePathStr;
        const cellData = tableElement.cellData || [];

        const getTableAlignmentStyle = () => {
          switch (tableAlign) {
            case 'center':
              return { display: 'flex', justifyContent: 'center', width: '100%' };
            case 'right':
              return { display: 'flex', justifyContent: 'flex-end', width: '100%' };
            default:
              return { display: 'inline-block' };
          }
        };

        return (
          <div
            {...props.attributes}
            className="my-4"
            style={getTableAlignmentStyle()}
            onMouseEnter={() => setHoveredTablePath(tablePathStr)}
            onMouseLeave={() => setHoveredTablePath(null)}
          >
            <div contentEditable={false} className="relative inline-block group" style={{ width: `${tableWidth}px`, maxWidth: '100%' }}>
              <AnimatePresence>
                {isTableHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-xl px-2 py-1 flex items-center space-x-1 z-50"
                    contentEditable={false}
                  >
                    <button
                      onClick={() => setElementAlignment(tablePath, 'left')}
                      className={`p-1.5 rounded transition-colors ${tableAlign === 'left' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      title="Align Left"
                    >
                      <AlignLeft size={16} />
                    </button>
                    <button
                      onClick={() => setElementAlignment(tablePath, 'center')}
                      className={`p-1.5 rounded transition-colors ${tableAlign === 'center' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      title="Align Center"
                    >
                      <AlignCenter size={16} />
                    </button>
                    <button
                      onClick={() => setElementAlignment(tablePath, 'right')}
                      className={`p-1.5 rounded transition-colors ${tableAlign === 'right' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      title="Align Right"
                    >
                      <AlignRight size={16} />
                    </button>
                    {/* THIS IS THE EDIT BUTTON WE ADDED */}
                    <button
                      onClick={() => handleEditTable(tablePath, tableElement)}
                      className="p-1.5 rounded transition-colors text-gray-300 hover:bg-gray-700"
                      title="Edit Table Size"
                    >
                      <Edit2 size={16} />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-1" />
                    <button
                      onClick={() => {
                        Transforms.removeNodes(editor, { at: tablePath });
                        ReactEditor.focus(editor);
                      }}
                      className="p-1.5 rounded transition-colors text-red-400 hover:bg-red-900/50 hover:text-red-300"
                      title="Delete Table"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <table className="border-collapse border border-gray-300 w-full">
                <tbody>
                  {Array.from({ length: tableElement.rows }).map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      {Array.from({ length: tableElement.cols }).map((_, colIdx) => {
                        const isHeaderRow = rowIdx === 0;
                        const CellTag = isHeaderRow ? 'th' : 'td';

                        return (
                          <CellTag
                            key={colIdx}
                            className={`border border-gray-300 p-2 min-w-[100px] min-h-[40px] ${isHeaderRow ? 'bg-gray-50' : ''}`}
                          >
                            <input
                              type="text"
                              defaultValue={cellData[rowIdx]?.[colIdx] || (isHeaderRow ? `Header ${colIdx + 1}` : `Cell ${rowIdx + 1}-${colIdx + 1}`)}
                              onBlur={(e) => {
                                const cellContent = e.target.value;
                                updateTableCell(tablePath, rowIdx, colIdx, cellContent);
                              }}
                              className={`w-full bg-transparent border-none outline-none focus:bg-blue-50 px-1 py-0.5 rounded ${isHeaderRow ? 'font-bold text-gray-900' : ''}`}
                              onMouseDown={(e) => {
                                e.stopPropagation(); // THIS LINE ALREADY EXISTS
                              }}
                              // ADD THESE TWO EVENT HANDLERS:
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              onFocus={(e) => {
                                e.stopPropagation();
                              }}
                            />
                          </CellTag>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <span
                className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-tl cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => handleResizeStart(e, tablePath, tableWidth)}
                style={{ cursor: 'nwse-resize', zIndex: 10 }}
                contentEditable={false}
              />
            </div>
            {props.children}
          </div>
        );
      case 'chart':
        const chartPath = ReactEditor.findPath(editor, element);
        const chartPathStr = chartPath.join('-');
        const chartElement = element as Extract<CustomElement, { type: 'chart' }>;
        const chartWidth = chartElement.width || 600;
        const chartAlign = chartElement.align || 'left';
        const isChartHovered = hoveredChartPath === chartPathStr;
        const maxValue = Math.max(...chartElement.data.values, 1);

        const getChartAlignmentStyle = () => {
          switch (chartAlign) {
            case 'center':
              return { display: 'flex', justifyContent: 'center', width: '100%' };
            case 'right':
              return { display: 'flex', justifyContent: 'flex-end', width: '100%' };
            default:
              return { display: 'inline-block' };
          }
        };

        return (
          <div
            {...props.attributes}
            contentEditable={false}
            className="my-4"
            style={getChartAlignmentStyle()}
            onMouseEnter={() => setHoveredChartPath(chartPathStr)}
            onMouseLeave={() => setHoveredChartPath(null)}
          >
            <div className="relative inline-block group" style={{ width: `${chartWidth}px`, maxWidth: '100%' }}>
              <AnimatePresence>
                {isChartHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-xl px-2 py-1 flex items-center space-x-1 z-50"
                    contentEditable={false}
                  >
                    <button
                      onClick={() => setElementAlignment(chartPath, 'left')}
                      className={`p-1.5 rounded transition-colors ${chartAlign === 'left' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      title="Align Left"
                    >
                      <AlignLeft size={16} />
                    </button>
                    <button
                      onClick={() => setElementAlignment(chartPath, 'center')}
                      className={`p-1.5 rounded transition-colors ${chartAlign === 'center' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      title="Align Center"
                    >
                      <AlignCenter size={16} />
                    </button>
                    <button
                      onClick={() => setElementAlignment(chartPath, 'right')}
                      className={`p-1.5 rounded transition-colors ${chartAlign === 'right' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      title="Align Right"
                    >
                      <AlignRight size={16} />
                    </button>
                    <button
                      onClick={() => handleEditChart(chartPath, chartElement)}
                      className="p-1.5 rounded transition-colors text-gray-300 hover:bg-gray-700"
                      title="Edit Chart"
                    >
                      <Edit2 size={16} />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-1" />
                    <button
                      onClick={() => {
                        Transforms.removeNodes(editor, { at: chartPath });
                        ReactEditor.focus(editor);
                      }}
                      className="p-1.5 rounded transition-colors text-red-400 hover:bg-red-900/50 hover:text-red-300"
                      title="Delete Chart"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4 bg-white rounded-lg border-2 border-gray-300 shadow-sm">
                <div className="mb-4">
                  <h4 className="font-bold text-gray-900 text-lg">{chartElement.title}</h4>
                  <p className="text-sm text-gray-500 capitalize">{chartElement.chartType} Chart</p>
                </div>

                {chartElement.chartType === 'bar' && (
                  <div className="space-y-3">
                    {chartElement.data.labels.map((label, idx) => {
                      const value = chartElement.data.values[idx] || 0;
                      const percentage = (value / maxValue) * 100;

                      return (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className="w-24 text-sm font-medium text-gray-700 truncate" title={label}>
                            {label}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-white text-xs font-semibold">{value}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {chartElement.chartType === 'column' && (
                  <div className="flex items-end justify-around h-64 border-b-2 border-l-2 border-gray-300 p-4">
                    {chartElement.data.labels.map((label, idx) => {
                      const value = chartElement.data.values[idx] || 0;
                      const height = (value / maxValue) * 100;

                      return (
                        <div key={idx} className="flex flex-col items-center space-y-2">
                          <div className="relative group">
                            <div
                              className="w-16 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-500 hover:from-blue-700 hover:to-blue-500"
                              style={{ height: `${height * 2}px` }}
                            >
                              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                {value}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-gray-700 text-center max-w-[60px] truncate" title={label}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {chartElement.chartType === 'pie' && (
                  <div className="flex items-center justify-center">
                    <div className="relative w-64 h-64">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {(() => {
                          const total = chartElement.data.values.reduce((a, b) => a + b, 0);
                          let currentAngle = 0;
                          const colors = ['#3b82f6', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

                          return chartElement.data.values.map((value, idx) => {
                            const percentage = (value / total) * 100;
                            const angle = (percentage / 100) * 360;
                            const startAngle = currentAngle;
                            currentAngle += angle;

                            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                            const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                            const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);

                            const largeArc = angle > 180 ? 1 : 0;

                            return (
                              <path
                                key={idx}
                                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={colors[idx % colors.length]}
                                className="hover:opacity-80 transition-opacity"
                              />
                            );
                          });
                        })()}
                      </svg>
                    </div>
                    <div className="ml-6 space-y-2">
                      {chartElement.data.labels.map((label, idx) => {
                        const colors = ['#3b82f6', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                        const value = chartElement.data.values[idx];
                        const total = chartElement.data.values.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);

                        return (
                          <div key={idx} className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: colors[idx % colors.length] }}
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {label}: {value} ({percentage}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {chartElement.chartType === 'line' && (
                  <div className="relative h-64 border-b-2 border-l-2 border-gray-300 p-4">
                    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                      <polyline
                        points={chartElement.data.values.map((value, idx) => {
                          const x = (idx / (chartElement.data.values.length - 1)) * 380 + 10;
                          const y = 190 - (value / maxValue) * 180;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      {chartElement.data.values.map((value, idx) => {
                        const x = (idx / (chartElement.data.values.length - 1)) * 380 + 10;
                        const y = 190 - (value / maxValue) * 180;
                        return (
                          <g key={idx}>
                            <circle cx={x} cy={y} r="4" fill="#3b82f6" className="hover:r-6 transition-all" />
                            <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#374151">
                              {value}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div className="flex justify-around mt-2">
                      {chartElement.data.labels.map((label, idx) => (
                        <span key={idx} className="text-xs font-medium text-gray-700 text-center" style={{ width: `${100 / chartElement.data.labels.length}%` }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <span
                className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-tl cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => handleResizeStart(e, chartPath, chartWidth)}
                style={{ cursor: 'nwse-resize', zIndex: 10 }}
                contentEditable={false}
              />
            </div>
            {props.children}
          </div>
        );
      default:
        return (
          <p {...props.attributes} style={style} className="min-h-[1.5em] mb--1">
            {props.children}
          </p>
        );
    }
  }, [editor, hoveredImagePath, hoveredTablePath, hoveredChartPath, hoveredLinkPath, setElementAlignment, handleEditLink, handleEditChart, updateTableCell]);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    let { children } = props;
    const { leaf } = props;

    if (leaf.bold) children = <strong>{children}</strong>;
    if (leaf.italic) children = <em>{children}</em>;
    if (leaf.underline) children = <u>{children}</u>;
    if (leaf.strikethrough) children = <s>{children}</s>;
    if (leaf.subscript) children = <sub>{children}</sub>;
    if (leaf.superscript) children = <sup>{children}</sup>;

    return (
      <span
        {...props.attributes}
        style={{
          fontSize: leaf.fontSize || '16px',
          color: leaf.color || 'inherit',
          backgroundColor: leaf.backgroundColor || 'transparent',
        }}
      >
        {children}
      </span>
    );
  }, []);

  const fontSizes = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];
  const colors = [
    '#000000', '#1e3a8a', '#f97316', '#ef4444', '#10b981',
    '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'
  ];

  // Add this progress modal component before the return statement
const ExportProgressModal = () => {
  if (!exportProgress.isExporting) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
        >
          <div className="space-y-4">
            {/* Icon and Title */}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                {exportProgress.format === 'pdf' && <FileText className="w-6 h-6 text-blue-600" />}
                {exportProgress.format === 'docx' && <File className="w-6 h-6 text-blue-600" />}
                {exportProgress.format === 'txt' && <FileText className="w-6 h-6 text-blue-600" />}
                {exportProgress.format === 'html' && <Code className="w-6 h-6 text-blue-600" />}
                {exportProgress.format === 'md' && <FileText className="w-6 h-6 text-blue-600" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Exporting {exportProgress.format?.toUpperCase()}
                </h3>
                <p className="text-sm text-gray-600">{exportProgress.message}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-blue-600">{exportProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress.progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                />
              </div>
            </div>

            {/* Success indicator */}
            {exportProgress.progress === 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center space-x-2 text-green-600"
              >
                <Check className="w-5 h-5" />
                <span className="font-medium">Export Complete!</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
      {/* Independent Sidebar Component */}
      <EditorSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onInsertGif={handleInsertGif}
        onInsertSticker={handleInsertSticker}
        onInsertClip={handleInsertClip}
        onInsertEmoji={handleInsertEmoji}
        onInsertTable={handleInsertTable}
        onInsertChart={handleInsertChart}
        onUploadCSV={handleUploadCSV}
        editorMode={editorMode}
        onModeChange={setEditorMode}
        editor={editor}
      />

      {/* Cereforge Logo Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all shadow-lg hover:scale-105 transform"
          title="Open Sidebar"
        >
          <img src={cereforgeLogo} alt='cereforge logo' className="w-5 h-5" />
        </button>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden ">
        <Slate editor={editor} initialValue={value} onValueChange={setValue}>
          {/* Toolbar - EMOJI BUTTON REMOVED */}
          <div className="flex-shrink-0 px-4 pt-1 flex justify-center">
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 w-full max-w-4xl">
              <div className="bg-gray-700 px-4 py-3 rounded-xl">
                <div className="flex flex-wrap items-center gap-1">
                  {/* Save As Dropdown - Only in Document Mode */}
                  {editorMode === 'document' && (
                    <>
                      <div className="relative">
                        <button
                          onClick={() => setShowSaveAsDropdown(!showSaveAsDropdown)}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <Download size={16} />
                          <span>Save As</span>
                          {showSaveAsDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <AnimatePresence>
                          {showSaveAsDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {EXPORT_FORMATS.map((format) => (
                                <button
                                  key={format.value}
                                  onClick={() => {
                                    setSelectedFormat(format.value as ExportFormat);
                                    handleExportDocument(format.value as ExportFormat);
                                  }}
                                  className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
                                >
                                  <span className="text-gray-600">{format.icon}</span>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{format.label}</p>
                                    <p className="text-xs text-gray-500">{format.extension}</p>
                                  </div>
                                  {selectedFormat === format.value && (
                                    <Check size={16} className="text-blue-600" />
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <ToolbarDivider />
                    </>
                  )}

                  <ToolbarButton icon={<Bold size={18} />} active={isFormatActive('bold')} onClick={() => toggleFormat('bold')} title="Bold" />
                  <ToolbarButton icon={<Italic size={18} />} active={isFormatActive('italic')} onClick={() => toggleFormat('italic')} title="Italic" />
                  <ToolbarButton icon={<Underline size={18} />} active={isFormatActive('underline')} onClick={() => toggleFormat('underline')} title="Underline" />
                  <ToolbarButton icon={<Strikethrough size={18} />} active={isFormatActive('strikethrough')} onClick={() => toggleFormat('strikethrough')} title="Strikethrough" />

                  <ToolbarDivider />

                  <div className="relative">
                    <ToolbarButton icon={<Type size={18} />} active={showHeadingMenu} onClick={() => setShowHeadingMenu(!showHeadingMenu)} title="Headings" />
                    <AnimatePresence>
                      {showHeadingMenu && (
                        <DropdownMenu onClose={() => setShowHeadingMenu(false)}>
                          <DropdownItem onClick={() => { toggleBlock('paragraph'); setShowHeadingMenu(false); }}>Normal</DropdownItem>
                          <DropdownItem onClick={() => { toggleBlock('heading1'); setShowHeadingMenu(false); }}>Heading 1</DropdownItem>
                          <DropdownItem onClick={() => { toggleBlock('heading2'); setShowHeadingMenu(false); }}>Heading 2</DropdownItem>
                          <DropdownItem onClick={() => { toggleBlock('heading3'); setShowHeadingMenu(false); }}>Heading 3</DropdownItem>
                        </DropdownMenu>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <ToolbarButton icon={<span className="text-sm font-medium">A</span>} active={showFontSize} onClick={() => setShowFontSize(!showFontSize)} title="Font Size" />
                    <AnimatePresence>
                      {showFontSize && (
                        <DropdownMenu onClose={() => setShowFontSize(false)}>
                          {fontSizes.map((size) => (
                            <DropdownItem key={size} onClick={() => setFontSize(`${size}px`)}>{size}px</DropdownItem>
                          ))}
                        </DropdownMenu>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <ToolbarButton icon={<Paintbrush size={18} />} active={showTextColor} onClick={() => setShowTextColor(!showTextColor)} title="Text Color" />
                    <AnimatePresence>
                      {showTextColor && (
                        <ColorPicker colors={colors} onSelect={setTextColor} onClose={() => setShowTextColor(false)} label="Text Color" />
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <ToolbarButton icon={<div className="w-5 h-5 border-2 border-gray-300 rounded" style={{ background: 'linear-gradient(to right, yellow, orange)' }} />} active={showBgColor} onClick={() => setShowBgColor(!showBgColor)} title="Background Color" />
                    <AnimatePresence>
                      {showBgColor && (
                        <ColorPicker colors={colors} onSelect={setBgColor} onClose={() => setShowBgColor(false)} label="Background Color" />
                      )}
                    </AnimatePresence>
                  </div>

                  <ToolbarDivider />

                  <ToolbarButton icon={<Subscript size={18} />} active={isFormatActive('subscript')} onClick={() => toggleFormat('subscript')} title="Subscript" />
                  <ToolbarButton icon={<Superscript size={18} />} active={isFormatActive('superscript')} onClick={() => toggleFormat('superscript')} title="Superscript" />

                  <ToolbarDivider />

                  <ToolbarButton icon={<List size={18} />} active={isBlockActive('bulleted-list')} onClick={() => toggleBlock('bulleted-list')} title="Bullet List" />
                  <ToolbarButton icon={<ListOrdered size={18} />} active={isBlockActive('numbered-list')} onClick={() => toggleBlock('numbered-list')} title="Numbered List" />
                  <ToolbarButton icon={<Quote size={18} />} active={isBlockActive('block-quote')} onClick={() => toggleBlock('block-quote')} title="Quote" />

                  <ToolbarDivider />

                  <ToolbarButton icon={<AlignLeft size={18} />} active={getCurrentAlignment() === 'left'} onClick={() => setAlignment('left')} title="Align Left" />
                  <ToolbarButton icon={<AlignCenter size={18} />} active={getCurrentAlignment() === 'center'} onClick={() => setAlignment('center')} title="Align Center" />
                  <ToolbarButton icon={<AlignRight size={18} />} active={getCurrentAlignment() === 'right'} onClick={() => setAlignment('right')} title="Align Right" />

                  <ToolbarDivider />

                  <ToolbarButton icon={<Link2 size={18} />} active={showLinkPopover || isLinkActive()} onClick={handleLinkClick} title="Insert Link" />
                  <ToolbarButton icon={<Image size={18} />} active={showImageModal} onClick={() => setShowImageModal(true)} title="Insert Image" />
                  {/* EMOJI BUTTON REMOVED - Now only in sidebar */}
                </div>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          {/* Editor Content - EMAIL MODE vs DOCUMENT MODE */}
          <div
            className="flex-1 overflow-hidden px-4 py-6 flex justify-center"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target === e.currentTarget || (target.closest('.editor-container') && !target.closest('input'))) {
                try {
                  ReactEditor.focus(editor);
                  if (!editor.selection) {
                    Transforms.select(editor, Editor.end(editor, []));
                  }
                } catch (err) {
                  // Silent fail
                }
              }
            }}
          >
            {editorMode === 'email' ? (
              // EMAIL MODE - Flat continuous editor
              <div
                className={`h-full bg-white rounded-xl shadow-lg border-2 transition-all duration-300 overflow-y-auto w-full max-w-3xl editor-container ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="p-8 max-w-3xl mx-auto">
                  <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder="Start typing your email..."
                    className="outline-none min-h-full"
                    spellCheck
                  />
                </div>
              </div>
            ) : (
              // TIPTAP DOCUMENT EDITOR (new)
              <LexicalDocumentEditor
                ref={documentEditorRef}
                showPageGuides={true}  // or false to hide them
              />)}
          </div>
        </Slate>
      </div>

      {/* Modals */}
      {/* Link Popover */}
      <AnimatePresence>
        {showLinkPopover && linkPopoverPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed z-50 bg-white rounded-lg shadow-2xl border-2 border-blue-500 p-4 w-80"
            style={{
              top: `${linkPopoverPosition.top}px`,
              left: `${linkPopoverPosition.left}px`,
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Link Text</label>
                <input
                  autoFocus
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Enter link text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      insertLink(linkUrl, linkText);
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between space-x-2 pt-2">
                {(isLinkActive() || editingLinkPath) && (
                  <button
                    onClick={() => {
                      removeLink();
                      setShowLinkPopover(false);
                      setLinkUrl('');
                      setLinkText('');
                      setEditingLinkPath(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove Link
                  </button>
                )}
                <div className="flex space-x-2 ml-auto">
                  <button
                    onClick={() => {
                      setShowLinkPopover(false);
                      setLinkUrl('');
                      setLinkText('');
                      setEditingLinkPath(null);
                    }}
                    className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => insertLink(linkUrl, linkText)}
                    disabled={!linkUrl}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Insert Image</h3>
                <button onClick={() => setShowImageModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload from Computer</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowImageModal(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium">
                  Cancel
                </button>
                <button
                  onClick={() => insertImage(imageUrl)}
                  disabled={!imageUrl}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  <Check size={18} />
                  <span>Insert</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Edit Modal */}
      <AnimatePresence>
        {showChartEditModal && editingChartData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowChartEditModal(false);
              setEditingChartPath(null);
              setEditingChartData(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 capitalize">
                  Edit {editingChartData.type} Chart
                </h3>
                <button
                  onClick={() => {
                    setShowChartEditModal(false);
                    setEditingChartPath(null);
                    setEditingChartData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Chart Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Title
                  </label>
                  <input
                    type="text"
                    value={editingChartData.title}
                    onChange={(e) => setEditingChartData({ ...editingChartData, title: e.target.value })}
                    placeholder="Chart Title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Chart Data */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Chart Data
                    </label>
                    <button
                      onClick={() => {
                        setEditingChartData({
                          ...editingChartData,
                          labels: [...editingChartData.labels, `Label ${editingChartData.labels.length + 1}`],
                          values: [...editingChartData.values, 0],
                        });
                      }}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {editingChartData.labels.map((label, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={label}
                          onChange={(e) => {
                            const newLabels = [...editingChartData.labels];
                            newLabels[index] = e.target.value;
                            setEditingChartData({ ...editingChartData, labels: newLabels });
                          }}
                          placeholder="Label"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="number"
                          value={editingChartData.values[index]}
                          onChange={(e) => {
                            const newValues = [...editingChartData.values];
                            newValues[index] = Number(e.target.value);
                            setEditingChartData({ ...editingChartData, values: newValues });
                          }}
                          placeholder="Value"
                          className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {editingChartData.labels.length > 1 && (
                          <button
                            onClick={() => {
                              const newLabels = editingChartData.labels.filter((_, i) => i !== index);
                              const newValues = editingChartData.values.filter((_, i) => i !== index);
                              setEditingChartData({ ...editingChartData, labels: newLabels, values: newValues });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove row"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowChartEditModal(false);
                    setEditingChartPath(null);
                    setEditingChartData(null);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChartEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTableEditModal && editingTableData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowTableEditModal(false);
              setEditingTablePath(null);
              setEditingTableData(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Table</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rows: {editingTableData.rows}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={editingTableData.rows}
                    onChange={(e) => {
                      setEditingTableData({
                        ...editingTableData,
                        rows: Number(e.target.value)
                      });
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Columns: {editingTableData.cols}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={editingTableData.cols}
                    onChange={(e) => {
                      setEditingTableData({
                        ...editingTableData,
                        cols: Number(e.target.value)
                      });
                    }}
                    className="w-full"
                  />
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-700">
                    <strong>Note:</strong> Existing cell data will be preserved. New cells will be created with default values.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowTableEditModal(false);
                    setEditingTablePath(null);
                    setEditingTableData(null);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTableEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ExportProgressModal />

    </div>

  );
};



// Toolbar Components
const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title?: string;
}> = ({ icon, active, onClick, title }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    title={title}
    className={`p-1 rounded transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600 hover:text-white'
      }`}
  >
    {icon}
  </motion.button>
);

const ToolbarDivider: React.FC = () => <div className="w-px h-6 bg-gray-600 mx-1" />;

const DropdownMenu: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
}> = ({ children, onClose }) => {
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-menu')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick, true);
    return () => document.removeEventListener('mousedown', handleClick, true);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="dropdown-menu absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[150px] z-20"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
};

const DropdownItem: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
}> = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors text-gray-700"
  >
    {children}
  </button>
);

const ColorPicker: React.FC<{
  colors: string[];
  onSelect: (color: string) => void;
  onClose: () => void;
  label: string;
}> = ({ colors, onSelect, onClose, label }) => {
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.color-picker')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick, true);
    return () => document.removeEventListener('mousedown', handleClick, true);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="color-picker absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-20"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-medium text-gray-700 mb-2">{label}</p>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => (
          <motion.button
            key={color}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(color)}
            className="w-7 h-7 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default CereforgeEditor;