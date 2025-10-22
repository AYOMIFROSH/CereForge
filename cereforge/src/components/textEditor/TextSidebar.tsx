import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, Search, Image, Smile, Video, Table, BarChart3, Plus, Minus, Loader2, FileText, Mail
} from 'lucide-react';
import { giphyService, GiphyImage } from '../../services/giphyService';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// cereforge logo
import cereforeLogo from '../../assets/cereForge.png'

import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Sidebar view types
type SidebarView = 'main' | 'gif' | 'sticker' | 'clips' | 'emoji' | 'tables' | 'csv' | 'charts';
type ChartType = 'bar' | 'line' | 'pie' | 'column';
type EditorMode = 'email' | 'document';

interface EditorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertGif: (url: string) => void;
  onInsertSticker: (url: string) => void;
  onInsertClip: (url: string) => void;
  onInsertEmoji: (emoji: string) => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertChart: (type: ChartType, data: any) => void;
  onUploadCSV?: (file: File) => void;
  editorMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

// Transform Giphy data to our format
const transformGiphyData = (items: GiphyImage[]) => {
  return items.map(item => ({
    id: item.id,
    url: item.images.fixed_height.url,
    title: item.title || 'Untitled'
  }));
};

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  isOpen,
  onClose,
  onInsertGif,
  onInsertSticker,
  onInsertClip,
  onInsertEmoji,
  onInsertTable,
  onInsertChart,
  onUploadCSV,
  editorMode,
  onModeChange
}) => {
  useDocumentTitle(
    "Cereforge - Editor",
    "Cereforge - Edit Document, Compose Mails, Send Mails, Free will, Elegantly Crafted",
    "/editor"
  );
  const [sidebarView, setSidebarView] = useState<SidebarView>('main');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [tableRows, setTableRows] = useState<number>(3);
  const [tableCols, setTableCols] = useState<number>(3);
  const [showChartModal, setShowChartModal] = useState<boolean>(false);
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);

  // Giphy data states
  const [gifs, setGifs] = useState<any[]>([]);
  const [stickers, setStickers] = useState<any[]>([]);
  const [clips, setClips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);

  // Chart form state
  const [chartTitle, setChartTitle] = useState<string>('');
  const [chartLabels, setChartLabels] = useState<string[]>(['Label 1', 'Label 2', 'Label 3']);
  const [chartValues, setChartValues] = useState<number[]>([10, 20, 15]);

  // Fetch content with offset for infinite scroll
  useEffect(() => {
    const fetchContent = async () => {
      if (sidebarView !== 'gif' && sidebarView !== 'sticker' && sidebarView !== 'clips') {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let response;

        if (sidebarView === 'gif') {
          response = searchQuery
            ? await giphyService.searchGifs(searchQuery, 20, offset)
            : await giphyService.getTrendingGifs(20, offset);

          const newItems = transformGiphyData(response.data);
          setGifs(prev => offset === 0 ? newItems : [...prev, ...newItems]);
          setHasMore(response.data.length === 20);
        }
        else if (sidebarView === 'sticker') {
          response = searchQuery
            ? await giphyService.searchStickers(searchQuery, 20, offset)
            : await giphyService.getTrendingStickers(20, offset);

          const newItems = transformGiphyData(response.data);
          setStickers(prev => offset === 0 ? newItems : [...prev, ...newItems]);
          setHasMore(response.data.length === 20);
        }
        else if (sidebarView === 'clips') {
          response = searchQuery
            ? await giphyService.searchClips(searchQuery, 20, offset)
            : await giphyService.getTrendingClips(20, offset);

          const newItems = transformGiphyData(response.data);
          setClips(prev => offset === 0 ? newItems : [...prev, ...newItems]);
          setHasMore(response.data.length === 20);
        }
      } catch (err) {
        console.error('Error fetching Giphy content:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [sidebarView, searchQuery, offset]);

  // Debounce search query and reset offset
  useEffect(() => {
    if (!searchQuery) return;

    const timeoutId = setTimeout(() => {
      setOffset(0);
      setHasMore(true);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset offset and hasMore when view changes
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setSearchQuery('');
  }, [sidebarView]);

  const navigateToView = (view: SidebarView) => {
    setSidebarView(view);
  };

  const goBackToMain = () => {
    setSidebarView('main');
  };

  const handleInsertGif = (url: string) => {
    onInsertGif(url);
  };

  const handleInsertSticker = (url: string) => {
    onInsertSticker(url);
  };

  const handleInsertClip = (url: string) => {
    onInsertClip(url);
  };

  const handleEmojiSelect = (emoji: any) => {
    onInsertEmoji(emoji.native);
  };

  const loadMoreContent = useCallback(() => {
    if (!isLoading && hasMore) {
      setOffset(prev => prev + 20);
    }
  }, [isLoading, hasMore]);

  const handleInsertTable = () => {
    onInsertTable(tableRows, tableCols);
    setShowTableModal(false);
  };

  const handleInsertChart = () => {
    if (selectedChartType) {
      const chartData = {
        title: chartTitle || `${selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} Chart`,
        labels: chartLabels.filter(label => label.trim() !== ''),
        values: chartValues
      };
      onInsertChart(selectedChartType, chartData);
      resetChartForm();
    }
  };

  const resetChartForm = () => {
    setShowChartModal(false);
    setSelectedChartType(null);
    setChartTitle('');
    setChartLabels(['Label 1', 'Label 2', 'Label 3']);
    setChartValues([10, 20, 15]);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadCSV) {
      onUploadCSV(file);
    }
  };

  const addChartDataRow = () => {
    setChartLabels([...chartLabels, `Label ${chartLabels.length + 1}`]);
    setChartValues([...chartValues, 0]);
  };

  const removeChartDataRow = (index: number) => {
    if (chartLabels.length > 1) {
      setChartLabels(chartLabels.filter((_, i) => i !== index));
      setChartValues(chartValues.filter((_, i) => i !== index));
    }
  };

  const updateChartLabel = (index: number, value: string) => {
    const newLabels = [...chartLabels];
    newLabels[index] = value;
    setChartLabels(newLabels);
  };

  const updateChartValue = (index: number, value: number) => {
    const newValues = [...chartValues];
    newValues[index] = value;
    setChartValues(newValues);
  };

  const loadChartTemplate = (template: 'sales' | 'products' | 'months') => {
    switch (template) {
      case 'sales':
        setChartTitle('Monthly Sales');
        setChartLabels(['Jan', 'Feb', 'Mar', 'Apr']);
        setChartValues([100, 150, 120, 180]);
        break;
      case 'products':
        setChartTitle('Product Performance');
        setChartLabels(['Product A', 'Product B', 'Product C']);
        setChartValues([30, 45, 25]);
        break;
      case 'months':
        setChartTitle('Quarterly Data');
        setChartLabels(['Q1', 'Q2', 'Q3', 'Q4']);
        setChartValues([250, 300, 280, 320]);
        break;
    }
  };

  return (
    <>
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : -320,
          width: isOpen ? 320 : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white border-r border-gray-200 shadow-xl flex flex-col h-full overflow-hidden"
        style={{ flexShrink: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-r border-b border-gray-200 bg-gray-700">
          <div className="flex items-center space-x-2">
            <img src={cereforeLogo} alt="cereforge logo" className='w-5' />
            <div className="flex items-center space-x-0.5">
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
              {/* MODE SECTION - FIRST */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Mode</h3>
                <div className="grid grid-cols-2 gap-2">
                  <ModeButton 
                    active={editorMode === 'email'} 
                    onClick={() => onModeChange('email')} 
                    icon={<Mail size={20} />} 
                    label="Email" 
                  />
                  <ModeButton 
                    active={editorMode === 'document'} 
                    onClick={() => onModeChange('document')} 
                    icon={<FileText size={20} />} 
                    label="Document" 
                  />
                </div>
              </div>

              {/* ANIMATIONS SECTION */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Animations</h3>
                <div className="grid grid-cols-2 gap-2">
                  <SidebarButton onClick={() => navigateToView('gif')} icon={<Image size={20} />} label="GIF" />
                  <SidebarButton onClick={() => navigateToView('sticker')} icon={<Smile size={20} />} label="Sticker" />
                  <SidebarButton onClick={() => navigateToView('clips')} icon={<Video size={20} />} label="Clips" />
                  <SidebarButton onClick={() => navigateToView('emoji')} icon={<Smile size={20} />} label="Emoji" />
                </div>
              </div>

              {/* FORMAT SECTION */}
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

          {/* Other views remain the same... */}
          {sidebarView === 'gif' && (
            <MediaView
              title="GIFs"
              items={gifs}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onBack={goBackToMain}
              onItemClick={handleInsertGif}
              emptyIcon={<Image size={48} />}
              emptyMessage="No GIFs found"
              isLoading={isLoading}
              error={error}
              hasMore={hasMore}
              onLoadMore={loadMoreContent}
            />
          )}

          {sidebarView === 'sticker' && (
            <MediaView
              title="Stickers"
              items={stickers}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onBack={goBackToMain}
              onItemClick={handleInsertSticker}
              emptyIcon={<Smile size={48} />}
              emptyMessage="No stickers found"
              isLoading={isLoading}
              error={error}
              hasMore={hasMore}
              onLoadMore={loadMoreContent}
            />
          )}

          {sidebarView === 'clips' && (
            <MediaView
              title="Video Clips"
              items={clips}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onBack={goBackToMain}
              onItemClick={handleInsertClip}
              emptyIcon={<Video size={48} />}
              emptyMessage="No clips found"
              isLoading={isLoading}
              error={error}
              hasMore={hasMore}
              onLoadMore={loadMoreContent}
            />
          )}

          {sidebarView === 'emoji' && (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <button onClick={goBackToMain} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft size={20} className="text-gray-600" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900">Emoji</h3>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-2">
                <Picker 
                  data={data} 
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                  previewPosition="none"
                  skinTonePosition="search"
                  maxFrequentRows={2}
                />
              </div>
            </div>
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

      {/* Chart Modal - keeping existing implementation */}
      <AnimatePresence>
        {showChartModal && selectedChartType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={resetChartForm}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize">
                Create {selectedChartType} Chart
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Title
                  </label>
                  <input
                    type="text"
                    value={chartTitle}
                    onChange={(e) => setChartTitle(e.target.value)}
                    placeholder={`${selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} Chart`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => loadChartTemplate('sales')}
                      className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                    >
                      Monthly Sales
                    </button>
                    <button
                      onClick={() => loadChartTemplate('products')}
                      className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                    >
                      Products
                    </button>
                    <button
                      onClick={() => loadChartTemplate('months')}
                      className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                    >
                      Quarterly
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Chart Data
                    </label>
                    <button
                      onClick={addChartDataRow}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      <Plus size={14} />
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {chartLabels.map((label, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={label}
                          onChange={(e) => updateChartLabel(index, e.target.value)}
                          placeholder="Label"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="number"
                          value={chartValues[index]}
                          onChange={(e) => updateChartValue(index, Number(e.target.value))}
                          placeholder="Value"
                          className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {chartLabels.length > 1 && (
                          <button
                            onClick={() => removeChartDataRow(index)}
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

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Tip:</strong> Add labels and values for your chart. The chart will be visualized in your document.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={resetChartForm}
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

// NEW: Mode Button Component
const ModeButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}> = ({ icon, label, onClick, active }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
      active 
        ? 'border-blue-500 bg-blue-50 text-blue-600' 
        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-gray-600'
    }`}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-xs font-medium">{label}</span>
  </motion.button>
);

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
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
}> = ({ title, items, searchQuery, onSearchChange, onBack, onItemClick, emptyIcon, emptyMessage, isLoading, error, hasMore, onLoadMore }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Load more when user is 200px from bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      onLoadMore();
    }
  }, [isLoading, hasMore, onLoadMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-3 flex justify-center">
              <X size={48} />
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : items.length > 0 ? (
          <>
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
                    <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded truncate w-full">
                      {item.title}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Loading more indicator */}
            {isLoading && (
              <div className="text-center py-6">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading more...</p>
              </div>
            )}

            {/* End of results */}
            {!hasMore && !isLoading && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No more {title.toLowerCase()} to load</p>
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading {title.toLowerCase()}...</p>
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
};

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

export default EditorSidebar