import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, Search, Image, Smile, Video, Table, BarChart3
} from 'lucide-react';
import cereforge from '../../assets/cereForge.png';

// Sidebar view types
type SidebarView = 'main' | 'gif' | 'sticker' | 'clips' | 'tables' | 'csv' | 'charts';
type ChartType = 'bar' | 'line' | 'pie' | 'column';

interface EditorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertGif: (url: string) => void;
  onInsertSticker: (url: string) => void;
  onInsertClip: (url: string) => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertChart: (type: ChartType, data: any) => void;
  onUploadCSV?: (file: File) => void;
}

// Sample data
const sampleGifs = [
  { id: 1, url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', title: 'Celebrating' },
  { id: 2, url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', title: 'Happy' },
  { id: 3, url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', title: 'Dancing' },
  { id: 4, url: 'https://media.giphy.com/media/3o7absbD7PbTFQa0c8/giphy.gif', title: 'Excited' },
  { id: 5, url: 'https://media.giphy.com/media/l0HlKrB02QY0f1mbm/giphy.gif', title: 'Working' },
  { id: 6, url: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif', title: 'Success' },
  { id: 7, url: 'https://media.giphy.com/media/26tnjjQQRqPbwDxdK/giphy.gif', title: 'Thinking' },
  { id: 8, url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', title: 'Coding' },
];

const sampleStickers = [
  { id: 1, url: 'https://media.giphy.com/media/3o6Zt2qU8f3KJqqBKo/giphy.gif', title: 'Thumbs Up' },
  { id: 2, url: 'https://media.giphy.com/media/3o6ZtpvPW6fqxkE1xu/giphy.gif', title: 'Heart' },
  { id: 3, url: 'https://media.giphy.com/media/l0HlO3BJ8LALPW4sE/giphy.gif', title: 'Star' },
  { id: 4, url: 'https://media.giphy.com/media/3o6Zt6fzS6qEbLhKWQ/giphy.gif', title: 'Fire' },
  { id: 5, url: 'https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif', title: 'Clap' },
  { id: 6, url: 'https://media.giphy.com/media/l0MYGb8O8zqBt3o76/giphy.gif', title: 'Cool' },
];

const sampleClips = [
  { id: 1, url: 'https://media.giphy.com/media/26tPplGWjN0xLybiU/giphy.gif', title: 'Nature' },
  { id: 2, url: 'https://media.giphy.com/media/3oriO13PHvBaxIEGFi/giphy.gif', title: 'Tech' },
  { id: 3, url: 'https://media.giphy.com/media/l0HlRnAWXxn0MhKLK/giphy.gif', title: 'Space' },
  { id: 4, url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', title: 'Science' },
];

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  isOpen,
  onClose,
  onInsertGif,
  onInsertSticker,
  onInsertClip,
  onInsertTable,
  onInsertChart,
  onUploadCSV
}) => {
  const [sidebarView, setSidebarView] = useState<SidebarView>('main');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [tableRows, setTableRows] = useState<number>(3);
  const [tableCols, setTableCols] = useState<number>(3);
  const [showChartModal, setShowChartModal] = useState<boolean>(false);
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);
  const [chartData, setChartData] = useState<string>('');

  const navigateToView = (view: SidebarView) => {
    setSidebarView(view);
    setSearchQuery('');
  };

  const goBackToMain = () => {
    setSidebarView('main');
    setSearchQuery('');
  };

  const getFilteredContent = (items: any[]) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredGifs = useMemo(() => getFilteredContent(sampleGifs), [searchQuery]);
  const filteredStickers = useMemo(() => getFilteredContent(sampleStickers), [searchQuery]);
  const filteredClips = useMemo(() => getFilteredContent(sampleClips), [searchQuery]);

  const handleInsertGif = (url: string) => {
    onInsertGif(url);
    // Don't close sidebar - removed onClose()
  };

  const handleInsertSticker = (url: string) => {
    onInsertSticker(url);
    // Don't close sidebar - removed onClose()
  };

  const handleInsertClip = (url: string) => {
    onInsertClip(url);
    // Don't close sidebar - removed onClose()
  };

  const handleInsertTable = () => {
    onInsertTable(tableRows, tableCols);
    setShowTableModal(false);
    // Don't close sidebar - removed onClose()
  };

  const handleInsertChart = () => {
    if (selectedChartType) {
      try {
        const data = chartData ? JSON.parse(chartData) : { labels: [], values: [] };
        onInsertChart(selectedChartType, data);
        setShowChartModal(false);
        setSelectedChartType(null);
        setChartData('');
        // Don't close sidebar - removed onClose()
      } catch (e) {
        alert('Invalid JSON format. Please check your data.');
      }
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadCSV) {
      onUploadCSV(file);
      // Don't close sidebar - removed onClose()
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 bg-white border-r border-gray-200 shadow-xl flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 rounded-r border-b border-gray-200 bg-gray-700 ">
              <div className="flex items-center space-x-2">
                <img src={cereforge} alt="cereforge logo" className='w-5'/>
                <div className="flex items-center space-x-0.5 ">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-blue-900 backdrop-blur-sm rounded-lg transform -skew-x-12 shadow-lg border border-blue-900"></div>
                    <span className="text-blue relative z-10 px-3 py-1 font-bold text-xl">CERE</span>
                  </div>
                  <span className="text-white font-bold text-xl">FORGE</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-orange-400 transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {sidebarView === 'main' && (
                <div className="p-4 space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Animations</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <SidebarButton onClick={() => navigateToView('gif')} icon={<Image size={20} />} label="GIF" />
                      <SidebarButton onClick={() => navigateToView('sticker')} icon={<Smile size={20} />} label="Sticker" />
                      <SidebarButton onClick={() => navigateToView('clips')} icon={<Video size={20} />} label="Clips" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Format</h3>
                    <div className="space-y-2">
                      <SidebarButton onClick={() => navigateToView('tables')} icon={<Table size={20} />} label="Tables" fullWidth />
                      <SidebarButton onClick={() => navigateToView('csv')} icon={<Table size={20} />} label="CSV" fullWidth />
                      <SidebarButton onClick={() => navigateToView('charts')} icon={<BarChart3 size={20} />} label="Charts" fullWidth />
                    </div>
                  </div>
                </div>
              )}

              {sidebarView === 'gif' && (
                <MediaView
                  title="Animations"
                  items={filteredGifs}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onBack={goBackToMain}
                  onItemClick={handleInsertGif}
                  emptyIcon={<Image size={48} />}
                  emptyMessage="No GIFs found"
                />
              )}

              {sidebarView === 'sticker' && (
                <MediaView
                  title="Stickers"
                  items={filteredStickers}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onBack={goBackToMain}
                  onItemClick={handleInsertSticker}
                  emptyIcon={<Smile size={48} />}
                  emptyMessage="No stickers found"
                />
              )}

              {sidebarView === 'clips' && (
                <MediaView
                  title="Video Clips"
                  items={filteredClips}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onBack={goBackToMain}
                  onItemClick={handleInsertClip}
                  emptyIcon={<Video size={48} />}
                  emptyMessage="No clips found"
                />
              )}

              {sidebarView === 'tables' && (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button onClick={goBackToMain} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                      </button>
                      <h3 className="text-lg font-bold text-gray-900">Tables</h3>
                    </div>
                  </div>
                  <div className="flex-1 p-4 space-y-4">
                    <button
                      onClick={() => setShowTableModal(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <Table size={32} className="mx-auto text-gray-400 group-hover:text-blue-500 mb-2" />
                      <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Create New Table</p>
                    </button>
                  </div>
                </div>
              )}

              {sidebarView === 'csv' && (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button onClick={goBackToMain} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                      </button>
                      <h3 className="text-lg font-bold text-gray-900">CSV</h3>
                    </div>
                  </div>
                  <div className="flex-1 p-4 space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Upload CSV File</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </label>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        Upload a CSV file to insert as a table in your document.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sidebarView === 'charts' && (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button onClick={goBackToMain} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                      </button>
                      <h3 className="text-lg font-bold text-gray-900">Charts</h3>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <ChartTypeButton type="bar" label="Bar Chart" onClick={() => { setSelectedChartType('bar'); setShowChartModal(true); }} />
                      <ChartTypeButton type="column" label="Column Chart" onClick={() => { setSelectedChartType('column'); setShowChartModal(true); }} />
                      <ChartTypeButton type="pie" label="Pie Chart" onClick={() => { setSelectedChartType('pie'); setShowChartModal(true); }} />
                      <ChartTypeButton type="line" label="Line Chart" onClick={() => { setSelectedChartType('line'); setShowChartModal(true); }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Modal */}
      <AnimatePresence>
        {showTableModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTableModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Table</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rows: {tableRows}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={tableRows}
                    onChange={(e) => setTableRows(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Columns: {tableCols}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={tableCols}
                    onChange={(e) => setTableCols(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInsertTable}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Insert Table
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Modal */}
      <AnimatePresence>
        {showChartModal && selectedChartType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setShowChartModal(false); setSelectedChartType(null); setChartData(''); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize">{selectedChartType} Chart</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Data (JSON format)
                  </label>
                  <textarea
                    value={chartData}
                    onChange={(e) => setChartData(e.target.value)}
                    placeholder='{"labels": ["A", "B", "C"], "values": [10, 20, 30]}'
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter chart data in JSON format or use a template
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setChartData('{"labels": ["Jan", "Feb", "Mar"], "values": [100, 150, 120]}')}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Sales Data
                    </button>
                    <button
                      onClick={() => setChartData('{"labels": ["Product A", "Product B", "Product C"], "values": [30, 45, 25]}')}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Products
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => { setShowChartModal(false); setSelectedChartType(null); setChartData(''); }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInsertChart}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Insert Chart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Sub-components
const SidebarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  fullWidth?: boolean;
}> = ({ icon, label, onClick, fullWidth }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`${fullWidth ? 'w-full' : ''} flex flex-col items-center justify-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group`}
  >
    <div className="text-gray-600 group-hover:text-blue-600 mb-1">{icon}</div>
    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">{label}</span>
  </motion.button>
);

const MediaView: React.FC<{
  title: string;
  items: any[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBack: () => void;
  onItemClick: (url: string) => void;
  emptyIcon: React.ReactNode;
  emptyMessage: string;
}> = ({ title, items, searchQuery, onSearchChange, onBack, onItemClick, emptyIcon, emptyMessage }) => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b border-gray-200 space-y-3">
      <div className="flex items-center space-x-2">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-4">
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onItemClick(item.url)}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all shadow-sm hover:shadow-md group"
            >
              <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end p-2">
                <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                  {item.title}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-300 mb-3 flex justify-center">{emptyIcon}</div>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  </div>
);

const ChartTypeButton: React.FC<{
  type: ChartType;
  label: string;
  onClick: () => void;
}> = ({ type, label, onClick }) => {
  const getChartIcon = () => {
    switch (type) {
      case 'bar':
        return (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="13" width="4" height="8" />
            <rect x="10" y="9" width="4" height="12" />
            <rect x="17" y="5" width="4" height="16" />
          </svg>
        );
      case 'column':
        return (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="4" height="18" />
            <rect x="10" y="8" width="4" height="13" />
            <rect x="17" y="13" width="4" height="8" />
          </svg>
        );
      case 'pie':
        return (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2 L12 12 L21 12" />
          </svg>
        );
      case 'line':
        return (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 17 9 11 13 15 21 7" />
            <polyline points="14 7 21 7 21 14" />
          </svg>
        );
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group aspect-square"
    >
      <div className="text-gray-600 group-hover:text-blue-600 mb-2">{getChartIcon()}</div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{label}</span>
    </motion.button>
  );
};

export default EditorSidebar;