import React, { useState, useCallback, useMemo } from 'react';
import { createEditor, Transforms, Editor, Element as SlateElement, BaseEditor, Descendant} from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote,
  Image, Link2, Smile, Upload, X, Check,
  Type, Paintbrush
} from 'lucide-react';

// TypeScript types
type CustomElement = 
  | { type: 'paragraph'; align?: string; children: CustomText[] }
  | { type: 'heading1'; align?: string; children: CustomText[] }
  | { type: 'heading2'; align?: string; children: CustomText[] }
  | { type: 'heading3'; align?: string; children: CustomText[] }
  | { type: 'bulleted-list'; children: CustomElement[] }
  | { type: 'numbered-list'; children: CustomElement[] }
  | { type: 'list-item'; children: CustomText[] }
  | { type: 'block-quote'; children: CustomText[] }
  | { type: 'image'; url: string; children: CustomText[] };

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

// Custom plugins
const withImages = (editor: Editor) => {
  const { isVoid } = editor;
  editor.isVoid = (element) => {
    return element.type === 'image' ? true : isVoid(element);
  };
  return editor;
};

const CereforgeEditor: React.FC = () => {
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showFontSize, setShowFontSize] = useState<boolean>(false);
  const [showTextColor, setShowTextColor] = useState<boolean>(false);
  const [showBgColor, setShowBgColor] = useState<boolean>(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState<boolean>(false);
  const [resizingImage, setResizingImage] = useState<{ path: number[]; startX: number; startWidth: number } | null>(null);

  const editor = useMemo(() => withImages(withHistory(withReact(createEditor()))), []);
  const [value, setValue] = useState<Descendant[]>([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    } as CustomElement,
  ]);

  // Toggle mark formatting
  const toggleFormat = useCallback((format: keyof Omit<CustomText, 'text'>) => {
    const isActive = isFormatActive(format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  }, [editor]);

  const isFormatActive = (format: keyof Omit<CustomText, 'text'>): boolean => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };

  // Toggle block type
  const toggleBlock = useCallback((format: string) => {
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
  }, [editor]);

  const isBlockActive = (format: string): boolean => {
    const [match] = Editor.nodes(editor, {
      match: (n) => 
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === format,
    });
    return !!match;
  };

  // Set text alignment - Fixed type error
  const setAlignment = useCallback((align: string) => {
    Transforms.setNodes<SlateElement>(
      editor,
      { align } as Partial<CustomElement>,
      { 
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && Editor.isBlock(editor, n)
      }
    );
  }, [editor]);

  // Set font size
  const setFontSize = useCallback((size: string) => {
    Editor.addMark(editor, 'fontSize', size);
    setShowFontSize(false);
  }, [editor]);

  // Set text color
  const setTextColor = useCallback((color: string) => {
    Editor.addMark(editor, 'color', color);
    setShowTextColor(false);
  }, [editor]);

  // Set background color
  const setBgColor = useCallback((color: string) => {
    Editor.addMark(editor, 'backgroundColor', color);
    setShowBgColor(false);
  }, [editor]);

  // Insert image
  const insertImage = useCallback((url: string) => {
    const image: CustomElement = {
      type: 'image',
      url,
      children: [{ text: '' }],
    };
    Transforms.insertNodes(editor, image);
    setShowImageModal(false);
    setImageUrl('');
  }, [editor]);

  // Handle file upload
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

  // Handle drag and drop
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

  // Image resizing handlers
  const handleImageMouseDown = (e: React.MouseEvent, path: number[]) => {
    e.preventDefault();
    const img = e.currentTarget as HTMLImageElement;
    setResizingImage({
      path,
      startX: e.clientX,
      startWidth: img.offsetWidth
    });
  };

  

  React.useEffect(() => {
    if (!resizingImage) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingImage) return;
      
      const deltaX = e.clientX - resizingImage.startX;
      const newWidth = Math.max(100, resizingImage.startWidth + deltaX);
      
      // Update image width in the editor
      const img = document.querySelector(`[data-image-path="${resizingImage.path.join('-')}"]`) as HTMLImageElement;
      if (img) {
        img.style.width = `${newWidth}px`;
      }
    };

    const handleMouseUp = () => {
      setResizingImage(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingImage]);

  

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
      case 'image':
        const path = ReactEditor.findPath(editor, element);
        return (
          <div {...props.attributes} contentEditable={false} className="my-4">
            <img 
              src={(element as any).url} 
              alt="Inserted" 
              data-image-path={path.join('-')}
              onMouseDown={(e) => handleImageMouseDown(e, path)}
              className="max-w-full rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-nwse-resize"
              style={{ cursor: 'nwse-resize' }}
            />
            {props.children}
          </div>
        );
      default:
        return (
          <p {...props.attributes} style={style} className="min-h-[1.5em] my-1">
            {props.children}
          </p>
        );
    }
  }, [editor, handleImageMouseDown]);

  // Render leaf (text formatting)
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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Slate editor={editor} initialValue={value} onValueChange={setValue}>
        {/* Fixed Toolbar at Top */}
        <div className="flex-shrink-0 px-4 pt-4 flex justify-center">
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 w-full max-w-4xl">
            {/* Main Formatting Toolbar */}
            <div className="bg-gray-700 px-4 py-3 rounded-xl">
              <div className="flex flex-wrap items-center gap-1">
                {/* Text Formatting Group */}
                <ToolbarButton
                  icon={<Bold size={18} />}
                  active={isFormatActive('bold')}
                  onClick={() => toggleFormat('bold')}
                />
                <ToolbarButton
                  icon={<Italic size={18} />}
                  active={isFormatActive('italic')}
                  onClick={() => toggleFormat('italic')}
                />
                <ToolbarButton
                  icon={<Underline size={18} />}
                  active={isFormatActive('underline')}
                  onClick={() => toggleFormat('underline')}
                />
                <ToolbarButton
                  icon={<Strikethrough size={18} />}
                  active={isFormatActive('strikethrough')}
                  onClick={() => toggleFormat('strikethrough')}
                />
                
                <ToolbarDivider />

                {/* Heading Dropdown */}
                <div className="relative">
                  <ToolbarButton
                    icon={<Type size={18} />}
                    onClick={() => setShowHeadingMenu(!showHeadingMenu)}
                  />
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

                {/* Font Size Dropdown */}
                <div className="relative">
                  <ToolbarButton
                    icon={<span className="text-sm font-medium">A</span>}
                    onClick={() => setShowFontSize(!showFontSize)}
                  />
                  <AnimatePresence>
                    {showFontSize && (
                      <DropdownMenu onClose={() => setShowFontSize(false)}>
                        {fontSizes.map((size) => (
                          <DropdownItem 
                            key={size} 
                            onClick={() => setFontSize(`${size}px`)}
                          >
                            {size}px
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    )}
                  </AnimatePresence>
                </div>

                {/* Text Color */}
                <div className="relative">
                  <ToolbarButton
                    icon={<Paintbrush size={18} />}
                    onClick={() => setShowTextColor(!showTextColor)}
                  />
                  <AnimatePresence>
                    {showTextColor && (
                      <ColorPicker colors={colors} onSelect={setTextColor} onClose={() => setShowTextColor(false)} label="Text Color" />
                    )}
                  </AnimatePresence>
                </div>

                {/* Background Color */}
                <div className="relative">
                  <ToolbarButton
                    icon={<div className="w-5 h-5 border-2 border-gray-300 rounded" style={{ background: 'linear-gradient(to right, yellow, orange)' }} />}
                    onClick={() => setShowBgColor(!showBgColor)}
                  />
                  <AnimatePresence>
                    {showBgColor && (
                      <ColorPicker colors={colors} onSelect={setBgColor} onClose={() => setShowBgColor(false)} label="Background Color" />
                    )}
                  </AnimatePresence>
                </div>

                <ToolbarDivider />

                {/* Subscript/Superscript */}
                <ToolbarButton
                  icon={<Subscript size={18} />}
                  active={isFormatActive('subscript')}
                  onClick={() => toggleFormat('subscript')}
                />
                <ToolbarButton
                  icon={<Superscript size={18} />}
                  active={isFormatActive('superscript')}
                  onClick={() => toggleFormat('superscript')}
                />

                <ToolbarDivider />

                {/* Lists and Quote */}
                <ToolbarButton
                  icon={<List size={18} />}
                  active={isBlockActive('bulleted-list')}
                  onClick={() => toggleBlock('bulleted-list')}
                />
                <ToolbarButton
                  icon={<ListOrdered size={18} />}
                  active={isBlockActive('numbered-list')}
                  onClick={() => toggleBlock('numbered-list')}
                />
                <ToolbarButton
                  icon={<Quote size={18} />}
                  active={isBlockActive('block-quote')}
                  onClick={() => toggleBlock('block-quote')}
                />

                <ToolbarDivider />

                {/* Alignment */}
                <ToolbarButton
                  icon={<AlignLeft size={18} />}
                  onClick={() => setAlignment('left')}
                />
                <ToolbarButton
                  icon={<AlignCenter size={18} />}
                  onClick={() => setAlignment('center')}
                />
                <ToolbarButton
                  icon={<AlignRight size={18} />}
                  onClick={() => setAlignment('right')}
                />
                <ToolbarButton
                  icon={<AlignJustify size={18} />}
                  onClick={() => setAlignment('justify')}
                />

                <ToolbarDivider />

                {/* Media and Links */}
                <ToolbarButton
                  icon={<Link2 size={18} />}
                  onClick={() => alert('Link functionality coming soon')}
                />
                <ToolbarButton
                  icon={<Image size={18} />}
                  onClick={() => setShowImageModal(true)}
                />
                <ToolbarButton
                  icon={<Smile size={18} />}
                  onClick={() => alert('Emoji picker coming soon')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Editor Content Area - Scrollable with narrower width */}
        <div className="flex-1 overflow-hidden px-4 py-6 flex justify-center">
          <div
            className={`h-full bg-white rounded-xl shadow-lg border-2 transition-all duration-300 overflow-y-auto w-full max-w-4xl ${
              isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-8 max-w-3xl mx-auto">
              <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="Start writing..."
                className="outline-none min-h-full"
                spellCheck
              />
            </div>
          </div>
        </div>
      </Slate>

      {/* Image Upload Modal */}
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
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => insertImage(imageUrl)}
                  disabled={!imageUrl}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={18} />
                  <span>Insert</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Toolbar Button Component
const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}> = ({ icon, active, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onMouseDown={(e) => {
      e.preventDefault(); // Prevent focus loss
      onClick();
    }}
    className={`p-2 rounded transition-colors ${
      active ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-600 hover:text-white'
    }`}
  >
    {icon}
  </motion.button>
);

// Toolbar Divider
const ToolbarDivider: React.FC = () => (
  <div className="w-px h-6 bg-gray-600 mx-1" />
);

// Dropdown Menu
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

// Dropdown Item
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

// Color Picker
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

  // ✅ Use capture phase to ensure click inside is ignored properly
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