import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, $isListNode } from '@lexical/list';
import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import {
  $getRoot,
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  ElementFormatType,
  DecoratorNode,
  NodeKey,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
  $createParagraphNode,
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  $getNodeByKey,
  $isElementNode,
  $isTextNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { $setBlocksType } from '@lexical/selection';
import { motion, AnimatePresence } from 'framer-motion';
import { AlignLeft, AlignCenter, AlignRight, Trash2, Edit2, Plus, Minus } from 'lucide-react';

/* @refresh reset */

// Letter Page Constants (8.5" x 11")
const LETTER_WIDTH_MM = 216;
const LETTER_HEIGHT_MM = 279;
const MARGIN_MM = '25.4mm 25.4mm'; // 1 inch margins

const editorTheme = {
  paragraph: 'mb-1 leading-relaxed min-h-[1.5em]',
  quote: 'border-l-4 border-blue-600 pl-4 italic my-4 text-gray-600',
  heading: {
    h1: 'text-3xl font-bold my-4 text-gray-900',
    h2: 'text-2xl font-bold my-3 text-gray-900',
    h3: 'text-xl font-bold my-2 text-gray-900',
  },
  list: {
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
  table: 'border-collapse border border-gray-300 my-4',
  tableCell: 'border border-gray-300 p-2 min-w-[100px]',
  tableCellHeader: 'border border-gray-300 p-2 min-w-[100px] bg-gray-50 font-bold',
};

// Custom Image Node (existing implementation)
export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
    align?: 'left' | 'center' | 'right';
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;
  __align?: 'left' | 'center' | 'right';

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__width, node.__height, node.__align, node.__key);
  }

  constructor(src: string, altText: string, width?: number, height?: number, align?: 'left' | 'center' | 'right', key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__align = align || 'left';
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'inline-block';
    div.style.margin = '1rem 0';
    div.style.position = 'relative';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height, align } = serializedNode;
    return $createImageNode({ src, altText, width, height, align });
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      align: this.__align,
      type: 'image',
      version: 1,
    };
  }

  setWidth(width: number): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  setAlign(align: 'left' | 'center' | 'right'): void {
    const writable = this.getWritable();
    writable.__align = align;
  }

  decorate(_editor: LexicalEditor): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        align={this.__align}
        nodeKey={this.__key}
        editor={_editor}
      />
    );
  }
}
function ImageComponent({
  src,
  altText,
  width,
  align = 'left',
  nodeKey,
  editor
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
  nodeKey: NodeKey;
  editor: LexicalEditor;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width || 300);
  const [isHovered, setIsHovered] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(100, Math.min(800, startWidthRef.current + deltaX));
      setCurrentWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.setWidth(currentWidth);
        }
      }, { discrete: true });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, currentWidth, editor, nodeKey]);

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  const getAlignmentStyle = () => {
    switch (align) {
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
      style={getAlignmentStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative inline-block group">
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-xl px-2 py-1 flex items-center space-x-1 z-50"
              contentEditable={false}
            >
              <button
                onClick={handleDelete}
                className="p-1.5 rounded transition-colors text-red-400 hover:bg-red-900/50 hover:text-red-300"
                title="Delete Image"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <img
          ref={imageRef}
          src={src}
          alt={altText}
          style={{
            width: `${currentWidth}px`,
            height: 'auto',
            borderRadius: '0.5rem',
            display: 'block',
            margin: '0.2rem 0',
          }}
          draggable={false}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-tl cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={handleMouseDown}
          style={{ cursor: 'nwse-resize' }}
        />
      </div>
    </div>
  );
}

export function $createImageNode({ src, altText, width, height, align }: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
}): ImageNode {
  return new ImageNode(src, altText, width, height, align);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

// Enhanced Table Node with Edit functionality
export type SerializedTableNode = Spread<
  {
    rows: number;
    cols: number;
    cellData: string[][];
    width?: number;
    align?: 'left' | 'center' | 'right';
  },
  SerializedLexicalNode
>;

export class CustomTableNode extends DecoratorNode<JSX.Element> {
  __rows: number;
  __cols: number;
  __cellData: string[][];
  __width?: number;
  __align?: 'left' | 'center' | 'right';

  static getType(): string {
    return 'custom-table';
  }

  static clone(node: CustomTableNode): CustomTableNode {
    return new CustomTableNode(
      node.__rows,
      node.__cols,
      node.__cellData,
      node.__width,
      node.__align,
      node.__key
    );
  }

  constructor(
    rows: number,
    cols: number,
    cellData: string[][],
    width?: number,
    align?: 'left' | 'center' | 'right',
    key?: NodeKey
  ) {
    super(key);
    this.__rows = rows;
    this.__cols = cols;
    this.__cellData = cellData;
    this.__width = width;
    this.__align = align || 'left';
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'block';
    div.style.margin = '1rem 0';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedTableNode): CustomTableNode {
    const { rows, cols, cellData, width, align } = serializedNode;
    return $createTableNode({ rows, cols, cellData, width, align });
  }

  exportJSON(): SerializedTableNode {
    return {
      rows: this.__rows,
      cols: this.__cols,
      cellData: this.__cellData,
      width: this.__width,
      align: this.__align,
      type: 'custom-table',
      version: 1,
    };
  }

  setWidth(width: number): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  setAlign(align: 'left' | 'center' | 'right'): void {
    const writable = this.getWritable();
    writable.__align = align;
  }

  updateData(rows: number, cols: number, cellData: string[][]): void {
    const writable = this.getWritable();
    writable.__rows = rows;
    writable.__cols = cols;
    writable.__cellData = cellData;
  }

  decorate(): JSX.Element {
    return (
      <TableComponent
        rows={this.__rows}
        cols={this.__cols}
        cellData={this.__cellData}
        width={this.__width}
        align={this.__align}
        nodeKey={this.__key}
      />
    );
  }
}

function TableComponent({
  rows,
  cols,
  cellData,
  width = 600,
  align = 'left',
  nodeKey,
}: {
  rows: number;
  cols: number;
  cellData: string[][];
  width?: number;
  align?: 'left' | 'center' | 'right';
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRows, setEditRows] = useState(rows);
  const [editCols, setEditCols] = useState(cols);
  const [editCellData, setEditCellData] = useState(cellData);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(300, Math.min(800, startWidthRef.current + deltaX));
      setCurrentWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isTableNode(node)) {
          node.setWidth(currentWidth);
        }
      }, { discrete: true });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, currentWidth, editor, nodeKey]);

  const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isTableNode(node)) {
        node.setAlign(newAlign);
      }
    });
  };

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  const handleEdit = () => {
    setEditRows(rows);
    setEditCols(cols);
    setEditCellData(cellData);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    const newCellData: string[][] = [];
    for (let i = 0; i < editRows; i++) {
      newCellData[i] = [];
      for (let j = 0; j < editCols; j++) {
        newCellData[i][j] = editCellData[i]?.[j] || (i === 0 ? `Header ${j + 1}` : `Cell ${i + 1}-${j + 1}`);
      }
    }

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isTableNode(node)) {
        node.updateData(editRows, editCols, newCellData);
      }
    });
    setShowEditModal(false);
  };

  const updateCellData = (rowIdx: number, colIdx: number, value: string) => {
    const newData = [...editCellData];
    if (!newData[rowIdx]) newData[rowIdx] = [];
    newData[rowIdx][colIdx] = value;
    setEditCellData(newData);
  };

  const getAlignmentStyle = () => {
    switch (align) {
      case 'center':
        return { display: 'flex', justifyContent: 'center', width: '100%' };
      case 'right':
        return { display: 'flex', justifyContent: 'flex-end', width: '100%' };
      default:
        return { display: 'inline-block' };
    }
  };

  return (
    <>
      <div
        style={getAlignmentStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative inline-block group" style={{ width: `${currentWidth}px`, maxWidth: '100%' }}>
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                contentEditable={false}
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-xl px-2 py-1 flex items-center space-x-1 z-50"
              >
                <button
                  onClick={() => handleAlignChange('left')}
                  className={`p-1.5 rounded transition-colors ${align === 'left' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Align Left"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => handleAlignChange('center')}
                  className={`p-1.5 rounded transition-colors ${align === 'center' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Align Center"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => handleAlignChange('right')}
                  className={`p-1.5 rounded transition-colors ${align === 'right' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Align Right"
                >
                  <AlignRight size={16} />
                </button>
                <button
                  onClick={handleEdit}
                  className="p-1.5 rounded transition-colors text-gray-300 hover:bg-gray-700"
                  title="Edit Table"
                >
                  <Edit2 size={16} />
                </button>
                <div className="w-px h-6 bg-gray-600 mx-1" />
                <button
                  onClick={handleDelete}
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
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {Array.from({ length: cols }).map((_, colIdx) => {
                    const isHeaderRow = rowIdx === 0;
                    const CellTag = isHeaderRow ? 'th' : 'td';
                    return (
                      <CellTag
                        key={colIdx}
                        className={`border border-gray-300 p-2 min-w-[100px] min-h-[40px] ${isHeaderRow ? 'bg-gray-50 font-bold' : ''}`}
                      >
                        {cellData[rowIdx]?.[colIdx] || (isHeaderRow ? `Header ${colIdx + 1}` : `Cell ${rowIdx + 1}-${colIdx + 1}`)}
                      </CellTag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-tl cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={handleMouseDown}
            style={{ cursor: 'nwse-resize' }}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Table</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rows: {editRows}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={editRows}
                      onChange={(e) => setEditRows(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Columns: {editCols}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={editCols}
                      onChange={(e) => setEditCols(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Table Data</label>
                  <div className="border rounded-lg overflow-x-auto max-h-64">
                    <table className="w-full border-collapse">
                      <tbody>
                        {Array.from({ length: editRows }).map((_, rowIdx) => (
                          <tr key={rowIdx}>
                            {Array.from({ length: editCols }).map((_, colIdx) => (
                              <td key={colIdx} className="border p-1">
                                <input
                                  type="text"
                                  value={editCellData[rowIdx]?.[colIdx] || ''}
                                  onChange={(e) => updateCellData(rowIdx, colIdx, e.target.value)}
                                  placeholder={rowIdx === 0 ? `Header ${colIdx + 1}` : `Cell ${rowIdx + 1}-${colIdx + 1}`}
                                  className="w-full px-2 py-1 text-sm border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function $createTableNode({
  rows,
  cols,
  cellData,
  width,
  align,
}: {
  rows: number;
  cols: number;
  cellData?: string[][];
  width?: number;
  align?: 'left' | 'center' | 'right';
}): CustomTableNode {
  const defaultData: string[][] = [];
  for (let i = 0; i < rows; i++) {
    defaultData[i] = [];
    for (let j = 0; j < cols; j++) {
      defaultData[i][j] = cellData?.[i]?.[j] || (i === 0 ? `Header ${j + 1}` : `Cell ${i + 1}-${j + 1}`);
    }
  }
  return new CustomTableNode(rows, cols, defaultData, width, align);
}

export function $isTableNode(node: LexicalNode | null | undefined): node is CustomTableNode {
  return node instanceof CustomTableNode;
}

// Enhanced Chart Node with Edit functionality
export type SerializedChartNode = Spread<
  {
    chartType: 'bar' | 'line' | 'pie' | 'column';
    title: string;
    labels: string[];
    values: number[];
    width?: number;
    align?: 'left' | 'center' | 'right';
  },
  SerializedLexicalNode
>;

export class ChartNode extends DecoratorNode<JSX.Element> {
  __chartType: 'bar' | 'line' | 'pie' | 'column';
  __title: string;
  __labels: string[];
  __values: number[];
  __width?: number;
  __align?: 'left' | 'center' | 'right';

  static getType(): string {
    return 'chart';
  }

  static clone(node: ChartNode): ChartNode {
    return new ChartNode(
      node.__chartType,
      node.__title,
      node.__labels,
      node.__values,
      node.__width,
      node.__align,
      node.__key
    );
  }

  constructor(
    chartType: 'bar' | 'line' | 'pie' | 'column',
    title: string,
    labels: string[],
    values: number[],
    width?: number,
    align?: 'left' | 'center' | 'right',
    key?: NodeKey
  ) {
    super(key);
    this.__chartType = chartType;
    this.__title = title;
    this.__labels = labels;
    this.__values = values;
    this.__width = width;
    this.__align = align || 'left';
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'block';
    div.style.margin = '1rem 0';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedChartNode): ChartNode {
    const { chartType, title, labels, values, width, align } = serializedNode;
    return $createChartNode({ chartType, title, labels, values, width, align });
  }

  exportJSON(): SerializedChartNode {
    return {
      chartType: this.__chartType,
      title: this.__title,
      labels: this.__labels,
      values: this.__values,
      width: this.__width,
      align: this.__align,
      type: 'chart',
      version: 1,
    };
  }

  setWidth(width: number): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  setAlign(align: 'left' | 'center' | 'right'): void {
    const writable = this.getWritable();
    writable.__align = align;
  }

  updateData(title: string, labels: string[], values: number[]): void {
    const writable = this.getWritable();
    writable.__title = title;
    writable.__labels = labels;
    writable.__values = values;
  }

  decorate(): JSX.Element {
    return (
      <ChartComponent
        chartType={this.__chartType}
        title={this.__title}
        labels={this.__labels}
        values={this.__values}
        width={this.__width}
        align={this.__align}
        nodeKey={this.__key}
      />
    );
  }
}

function ChartComponent({
  chartType,
  title,
  labels,
  values,
  width = 600,
  align = 'left',
  nodeKey,
}: {
  chartType: 'bar' | 'line' | 'pie' | 'column';
  title: string;
  labels: string[];
  values: number[];
  width?: number;
  align?: 'left' | 'center' | 'right';
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editLabels, setEditLabels] = useState(labels);
  const [editValues, setEditValues] = useState(values);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const maxValue = Math.max(...values, 1);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(300, Math.min(800, startWidthRef.current + deltaX));
      setCurrentWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isChartNode(node)) {
          node.setWidth(currentWidth);
        }
      }, { discrete: true });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, currentWidth, editor, nodeKey]);

  const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isChartNode(node)) {
        node.setAlign(newAlign);
      }
    });
  };

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  const handleEdit = () => {
    setEditTitle(title);
    setEditLabels([...labels]);
    setEditValues([...values]);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    const filteredLabels = editLabels.filter(label => label.trim() !== '');
    const filteredValues = editValues.slice(0, filteredLabels.length);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isChartNode(node)) {
        node.updateData(editTitle, filteredLabels, filteredValues);
      }
    });
    setShowEditModal(false);
  };

  const addChartRow = () => {
    setEditLabels([...editLabels, `Label ${editLabels.length + 1}`]);
    setEditValues([...editValues, 0]);
  };

  const removeChartRow = (index: number) => {
    if (editLabels.length > 1) {
      setEditLabels(editLabels.filter((_, i) => i !== index));
      setEditValues(editValues.filter((_, i) => i !== index));
    }
  };

  const updateLabel = (index: number, value: string) => {
    const newLabels = [...editLabels];
    newLabels[index] = value;
    setEditLabels(newLabels);
  };

  const updateValue = (index: number, value: number) => {
    const newValues = [...editValues];
    newValues[index] = value;
    setEditValues(newValues);
  };

  const getAlignmentStyle = () => {
    switch (align) {
      case 'center':
        return { display: 'flex', justifyContent: 'center', width: '100%' };
      case 'right':
        return { display: 'flex', justifyContent: 'flex-end', width: '100%' };
      default:
        return { display: 'inline-block' };
    }
  };

  return (
    <>
      <div
        style={getAlignmentStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative inline-block group" style={{ width: `${currentWidth}px`, maxWidth: '100%' }}>
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-xl px-2 py-1 flex items-center space-x-1 z-50"
                contentEditable={false}
              >
                <button
                  onClick={() => handleAlignChange('left')}
                  className={`p-1.5 rounded transition-colors ${align === 'left' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Align Left"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => handleAlignChange('center')}
                  className={`p-1.5 rounded transition-colors ${align === 'center' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Align Center"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => handleAlignChange('right')}
                  className={`p-1.5 rounded transition-colors ${align === 'right' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Align Right"
                >
                  <AlignRight size={16} />
                </button>
                <button
                  onClick={handleEdit}
                  className="p-1.5 rounded transition-colors text-gray-300 hover:bg-gray-700"
                  title="Edit Chart"
                >
                  <Edit2 size={16} />
                </button>
                <div className="w-px h-6 bg-gray-600 mx-1" />
                <button
                  onClick={handleDelete}
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
              <h4 className="font-bold text-gray-900 text-lg">{title}</h4>
              <p className="text-sm text-gray-500 capitalize">{chartType} Chart</p>
            </div>

            {chartType === 'bar' && (
              <div className="space-y-3">
                {labels.map((label, idx) => {
                  const value = values[idx] || 0;
                  const percentage = (value / maxValue) * 100;
                  return (
                    <div key={idx} className="flex items-center space-x-3">
                      <div className="w-24 text-sm font-medium text-gray-700 truncate">{label}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-8">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-2"
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

            {chartType === 'column' && (
              <div className="flex items-end justify-around h-64 border-b-2 border-l-2 border-gray-300 p-4">
                {labels.map((label, idx) => {
                  const value = values[idx] || 0;
                  const height = (value / maxValue) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center space-y-2">
                      <div className="relative group">
                        <div
                          className="w-16 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                          style={{ height: `${height * 2}px` }}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                            {value}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center max-w-[60px] truncate">{label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {chartType === 'pie' && (
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {(() => {
                      const total = values.reduce((a, b) => a + b, 0);
                      let currentAngle = 0;
                      const colors = ['#3b82f6', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

                      return values.map((value, idx) => {
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
                            className="hover:opacity-80"
                          />
                        );
                      });
                    })()}
                  </svg>
                </div>
                <div className="ml-6 space-y-2">
                  {labels.map((label, idx) => {
                    const colors = ['#3b82f6', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                    const value = values[idx];
                    const total = values.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);

                    return (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[idx % colors.length] }} />
                        <span className="text-sm font-medium text-gray-700">
                          {label}: {value} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {chartType === 'line' && (
              <div className="relative h-64 border-b-2 border-l-2 border-gray-300 p-4">
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <polyline
                    points={values
                      .map((value, idx) => {
                        const x = (idx / (values.length - 1)) * 380 + 10;
                        const y = 190 - (value / maxValue) * 180;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  {values.map((value, idx) => {
                    const x = (idx / (values.length - 1)) * 380 + 10;
                    const y = 190 - (value / maxValue) * 180;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                        <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#374151">
                          {value}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <div className="flex justify-around mt-2">
                  {labels.map((label, idx) => (
                    <span key={idx} className="text-xs font-medium text-gray-700 text-center" style={{ width: `${100 / labels.length}%` }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-tl cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={handleMouseDown}
            style={{ cursor: 'nwse-resize' }}
            contentEditable={false}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize">
                Edit {chartType} Chart
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Chart Title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Chart Data
                    </label>
                    <button
                      onClick={addChartRow}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      <Plus size={14} />
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {editLabels.map((label, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={label}
                          onChange={(e) => updateLabel(index, e.target.value)}
                          placeholder="Label"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="number"
                          value={editValues[index]}
                          onChange={(e) => updateValue(index, Number(e.target.value))}
                          placeholder="Value"
                          className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {editLabels.length > 1 && (
                          <button
                            onClick={() => removeChartRow(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove row"
                          >
                            <Minus size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function $createChartNode({
  chartType,
  title,
  labels,
  values,
  width,
  align,
}: {
  chartType: 'bar' | 'line' | 'pie' | 'column';
  title: string;
  labels: string[];
  values: number[];
  width?: number;
  align?: 'left' | 'center' | 'right';
}): ChartNode {
  return new ChartNode(chartType, title, labels, values, width, align);
}

export function $isChartNode(node: LexicalNode | null | undefined): node is ChartNode {
  return node instanceof ChartNode;
}

// Commands
export const INSERT_IMAGE_COMMAND: LexicalCommand<{ src: string; altText: string; width?: number; height?: number; align?: 'left' | 'center' | 'right' }> =
  createCommand('INSERT_IMAGE_COMMAND');

export const INSERT_CUSTOM_TABLE_COMMAND: LexicalCommand<{
  rows: number;
  cols: number;
  cellData?: string[][];
  width?: number;
  align?: 'left' | 'center' | 'right';
}> = createCommand('INSERT_CUSTOM_TABLE_COMMAND');

export const INSERT_CHART_COMMAND: LexicalCommand<{
  chartType: 'bar' | 'line' | 'pie' | 'column';
  title: string;
  labels: string[];
  values: number[];
  width?: number;
  align?: 'left' | 'center' | 'right';
}> = createCommand('INSERT_CHART_COMMAND');

// Image Plugin
function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload);
        $insertNodes([imageNode]);
        const paragraphNode = $createParagraphNode();
        $insertNodes([paragraphNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

// Custom Table Plugin
function CustomTablePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_CUSTOM_TABLE_COMMAND,
      (payload) => {
        const tableNode = $createTableNode(payload);
        $insertNodes([tableNode]);
        const paragraphNode = $createParagraphNode();
        $insertNodes([paragraphNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

// Chart Plugin
function ChartPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_CHART_COMMAND,
      (payload) => {
        const chartNode = $createChartNode(payload);
        $insertNodes([chartNode]);
        const paragraphNode = $createParagraphNode();
        $insertNodes([paragraphNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

// Page Counter Plugin
function PageCounterPlugin() {
  const [pageCount, setPageCount] = useState(1);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const editorContent = document.querySelector('.editor-content');
    if (!editorContent) return;

    const calculatePages = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        const contentHeight = editorContent.scrollHeight;
        const pageHeightPx = (LETTER_HEIGHT_MM * 96) / 25.4;
        const pages = Math.max(1, Math.ceil(contentHeight / pageHeightPx));
        setPageCount(pages);
      }, 500);
    };

    calculatePages();
    const observer = new ResizeObserver(calculatePages);
    observer.observe(editorContent);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-8 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 text-sm font-medium text-gray-700 pointer-events-none select-none z-10 no-print">
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="15" x2="13" y2="15" />
        </svg>
        Page {pageCount}
      </div>
    </div>
  );
}

export interface LexicalDocumentEditorHandle {
  editor: LexicalEditor | null;
  insertTable: (rows: number, cols: number) => void;
  insertImage: (url: string, width?: number) => void;
  insertChart: (type: 'bar' | 'line' | 'pie' | 'column', data: { title: string; labels: string[]; values: number[] }) => void;
  getHTML: () => string;
  getText: () => string;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrikethrough: () => void;
  toggleSubscript: () => void;
  toggleSuperscript: () => void;
  setFontSize: (size: string) => void;
  setTextColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  toggleHeading: (level: 1 | 2 | 3) => void;
  toggleBulletList: () => void;
  toggleNumberedList: () => void;
  toggleQuote: () => void;
  setAlignment: (alignment: 'left' | 'center' | 'right') => void;
  getAlignment: () => string;
  insertLink: (url: string, text?: string) => void;
  isBoldActive: () => boolean;
  isItalicActive: () => boolean;
  isUnderlineActive: () => boolean;
  isStrikethroughActive: () => boolean;
  isSubscriptActive: () => boolean;
  isSuperscriptActive: () => boolean;
  getCurrentFontSize: () => string;
  getCurrentTextColor: () => string;
  getCurrentBackgroundColor: () => string;
  isHeadingActive: (level: 1 | 2 | 3) => boolean;
  isBulletListActive: () => boolean;
  isNumberedListActive: () => boolean;
  isQuoteActive: () => boolean;
}

interface Props {
  showPageGuides?: boolean;
}

const LexicalDocumentEditor = forwardRef<LexicalDocumentEditorHandle, Props>(
  ({ showPageGuides = true }, ref) => {
    const [editor, setEditor] = useState<LexicalEditor | null>(null);
    const hasInitialFocusRef = useRef(false);

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
        TableNode,
        TableRowNode,
        TableCellNode,
        ImageNode,
        CustomTableNode,
        ChartNode,
      ],
    };

    useImperativeHandle(ref, () => ({
      editor,
      insertTable: (rows: number, cols: number) => {
        if (editor) {
          editor.dispatchCommand(INSERT_CUSTOM_TABLE_COMMAND, {
            rows,
            cols,
            width: 600,
            align: 'left',
          });
        }
      },
      insertImage: (url: string, width?: number) => {
        if (editor) {
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src: url,
            altText: 'Inserted image',
            width: width || 400,
            align: 'left',
          });
        }
      },
      insertChart: (type: 'bar' | 'line' | 'pie' | 'column', data: { title: string; labels: string[]; values: number[] }) => {
        if (editor) {
          editor.dispatchCommand(INSERT_CHART_COMMAND, {
            chartType: type,
            title: data.title,
            labels: data.labels,
            values: data.values,
            width: 600,
            align: 'left',
          });
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
      toggleBold: () => {
        if (editor) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }
      },
      toggleItalic: () => {
        if (editor) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }
      },
      toggleUnderline: () => {
        if (editor) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }
      },
      toggleStrikethrough: () => {
        if (editor) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }
      },
      toggleHeading: (level: 1 | 2 | 3) => {
        if (!editor) return;
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode(`h${level}` as 'h1' | 'h2' | 'h3'));
          }
        });
      },
      toggleBulletList: () => {
        if (editor) {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }
      },
      toggleNumberedList: () => {
        if (editor) {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
      },
      toggleQuote: () => {
        if (!editor) return;
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode());
          }
        });
      },
      toggleSubscript: () => {
        if (editor) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
        }
      },
      toggleSuperscript: () => {
        if (editor) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
        }
      },
      setFontSize: (size: string) => {
        if (editor) {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.getNodes().forEach(node => {
                if ($isTextNode(node)) {
                  node.setStyle(`font-size: ${size}`);
                }
              });
            }
          });
        }
      },
      setTextColor: (color: string) => {
        if (editor) {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.getNodes().forEach(node => {
                if ($isTextNode(node)) {
                  const currentStyle = node.getStyle() || '';
                  const newStyle = currentStyle.replace(/color:[^;]+;?/g, '') + `color: ${color};`;
                  node.setStyle(newStyle.trim());
                }
              });
            }
          });
        }
      },
      setBackgroundColor: (color: string) => {
        if (editor) {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.getNodes().forEach(node => {
                if ($isTextNode(node)) {
                  const currentStyle = node.getStyle() || '';
                  const newStyle = currentStyle.replace(/background-color:[^;]+;?/g, '') + `background-color: ${color};`;
                  node.setStyle(newStyle.trim());
                }
              });
            }
          });
        }
      },
      isSubscriptActive: () => {
        if (!editor) return false;
        let isActive = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            isActive = selection.hasFormat('subscript');
          }
        });
        return isActive;
      },
      isSuperscriptActive: () => {
        if (!editor) return false;
        let isActive = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            isActive = selection.hasFormat('superscript');
          }
        });
        return isActive;
      },
      getCurrentFontSize: () => {
        if (!editor) return '16px';
        let fontSize = '16px';
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            if ($isTextNode(node)) {
              const style = node.getStyle() || '';
              const match = style.match(/font-size:\s*([^;]+)/);
              if (match) fontSize = match[1].trim();
            }
          }
        });
        return fontSize;
      },
      getCurrentTextColor: () => {
        if (!editor) return '#000000';
        let color = '#000000';
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            if ($isTextNode(node)) {
              const style = node.getStyle() || '';
              const match = style.match(/color:\s*([^;]+)/);
              if (match) color = match[1].trim();
            }
          }
        });
        return color;
      },
      getCurrentBackgroundColor: () => {
        if (!editor) return 'transparent';
        let bgColor = 'transparent';
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            if ($isTextNode(node)) {
              const style = node.getStyle() || '';
              const match = style.match(/background-color:\s*([^;]+)/);
              if (match) bgColor = match[1].trim();
            }
          }
        });
        return bgColor;
      },
      setAlignment: (alignment: 'left' | 'center' | 'right') => {
        if (editor) {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment as ElementFormatType);
        }
      },
      getAlignment: () => {
        if (!editor) return 'left';

        let alignment = 'left';
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            const element = anchor.getKey() === 'root'
              ? anchor
              : anchor.getTopLevelElementOrThrow();

            if ($isElementNode(element)) {
              const formatType = element.getFormatType();
              alignment = formatType || 'left';
            }
          }
        });

        return alignment;
      },
      insertLink: (url: string, text?: string) => {
        if (editor) {
          editor.update(() => {
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
              if (text && selection.isCollapsed()) {
                selection.insertText(text);

                const node = selection.anchor.getNode();
                const anchorOffset = selection.anchor.offset;

                if ($isTextNode(node)) {
                  selection.setTextNodeRange(
                    node,
                    anchorOffset - text.length,
                    node,
                    anchorOffset
                  );
                }
              }
            }
          });

          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        }
      },
      isBoldActive: () => {
        if (!editor) return false;
        let isBold = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            isBold = selection.hasFormat('bold');
          }
        });
        return isBold;
      },
      isItalicActive: () => {
        if (!editor) return false;
        let isItalic = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            isItalic = selection.hasFormat('italic');
          }
        });
        return isItalic;
      },
      isUnderlineActive: () => {
        if (!editor) return false;
        let isUnderline = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            isUnderline = selection.hasFormat('underline');
          }
        });
        return isUnderline;
      },
      isStrikethroughActive: () => {
        if (!editor) return false;
        let isStrike = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            isStrike = selection.hasFormat('strikethrough');
          }
        });
        return isStrike;
      },
      isHeadingActive: (level: 1 | 2 | 3) => {
        if (!editor) return false;
        let isHeading = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            const element = anchor.getKey() === 'root'
              ? anchor
              : anchor.getTopLevelElementOrThrow();

            if ($isHeadingNode(element)) {
              isHeading = element.getTag() === `h${level}`;
            }
          }
        });
        return isHeading;
      },
      isBulletListActive: () => {
        if (!editor) return false;
        let isActive = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            let node = anchor;

            while (node) {
              if ($isListNode(node)) {
                isActive = node.getListType() === 'bullet';
                break;
              }
              const parent = node.getParent();
              if (!parent) break;
              node = parent;
            }
          }
        });
        return isActive;
      },
      isNumberedListActive: () => {
        if (!editor) return false;
        let isActive = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            let node = anchor;

            while (node) {
              if ($isListNode(node)) {
                isActive = node.getListType() === 'number';
                break;
              }
              const parent = node.getParent();
              if (!parent) break;
              node = parent;
            }
          }
        });
        return isActive;
      },
      isQuoteActive: () => {
        if (!editor) return false;
        let isQuote = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            const element = anchor.getKey() === 'root'
              ? anchor
              : anchor.getTopLevelElementOrThrow();

            isQuote = $isQuoteNode(element);
          }
        });
        return isQuote;
      },
    }), [editor]);

    const EditorCapture = () => {
      const [localEditor] = useLexicalComposerContext();

      useEffect(() => {
        setEditor(localEditor);

        if (!hasInitialFocusRef.current && localEditor) {
          requestAnimationFrame(() => {
            try {
              localEditor.focus();
              hasInitialFocusRef.current = true;
            } catch (err) {
              console.warn('Could not focus editor:', err);
            }
          });
        }
      }, [localEditor]);

      return null;
    };

    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 py-8">
        <style>{`
          @media screen {
            .document-page {
              width: ${LETTER_WIDTH_MM}mm;
              min-height: ${LETTER_HEIGHT_MM}mm;
              padding: ${MARGIN_MM};
              background: white;
              margin: 0 auto 20px;
              box-shadow: 
                0 0 0 1px rgba(0,0,0,0.1),
                0 4px 6px rgba(0,0,0,0.1);
              position: relative;
            }

            .document-page::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 10%;
              right: 10%;
              height: 1px;
              background: repeating-linear-gradient(
                to right,
                #d1d5db 0,
                #d1d5db 10px,
                transparent 10px,
                transparent 20px
              );
            }
          }

          @media print {
            body { background: white !important; }
            .document-page {
              box-shadow: none !important;
              margin: 0 !important;
              page-break-after: always;
            }
            .document-page::after { display: none; }
            .no-print { display: none !important; }
          }

          .editor-content {
            overflow: visible;
            word-wrap: break-word;
          }
        `}</style>

        <div className="document-page">
          <LexicalComposer initialConfig={initialConfig}>
            <div className="relative">
              <EditorCapture />
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="editor-content outline-none prose prose-sm max-w-none focus:outline-none"
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: '#1f2937',
                    }}
                  />
                }
                placeholder={
                  <div className="absolute top-0 left-0 text-gray-400 pointer-events-none text-base" style={{ fontSize: '16px', lineHeight: '1.6' }}>
                    Start typing your document...
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin />
              <TablePlugin />
              <ImagePlugin />
              <CustomTablePlugin />
              <ChartPlugin />
              {showPageGuides && <PageCounterPlugin />}
            </div>
          </LexicalComposer>
        </div>
      </div>
    );
  }
);

LexicalDocumentEditor.displayName = 'LexicalDocumentEditor';

export default LexicalDocumentEditor;