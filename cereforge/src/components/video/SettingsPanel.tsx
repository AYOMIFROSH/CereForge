// src/components/video/SettingsPanel.tsx
import React, { useState, useEffect } from 'react';
import { X, Camera, Mic, Volume2, Monitor, Check } from 'lucide-react';
import { MediaDevice, VideoSettings } from '@/types/video.types';

interface SettingsPanelProps {
  isOpen: boolean;
  isGuest: boolean;
  onClose: () => void;
  settings: VideoSettings;
  onSaveSettings: (settings: VideoSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen, 
  onClose,
  settings,
  onSaveSettings
}) => {
  const [localSettings, setLocalSettings] = useState<VideoSettings>(settings);
  const [availableDevices, setAvailableDevices] = useState<{
    cameras: MediaDevice[];
    microphones: MediaDevice[];
    speakers: MediaDevice[];
  }>({
    cameras: [],
    microphones: [],
    speakers: []
  });

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      setAvailableDevices({
        cameras: devices
          .filter(d => d.kind === 'videoinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}`, kind: 'videoinput' })),
        microphones: devices
          .filter(d => d.kind === 'audioinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`, kind: 'audioinput' })),
        speakers: devices
          .filter(d => d.kind === 'audiooutput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 5)}`, kind: 'audiooutput' }))
      });
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between z-10">
          <h2 className="text-white text-2xl font-semibold">Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            aria-label="Close settings"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Camera Settings */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Camera className="w-5 h-5 text-blue-400" />
              <h3 className="text-white text-lg font-medium">Camera</h3>
            </div>
            <select 
              value={localSettings.selectedCamera || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, selectedCamera: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
            >
              <option value="">Select Camera</option>
              {availableDevices.cameras.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          {/* Microphone Settings */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Mic className="w-5 h-5 text-green-400" />
              <h3 className="text-white text-lg font-medium">Microphone</h3>
            </div>
            <select 
              value={localSettings.selectedMicrophone || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, selectedMicrophone: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
            >
              <option value="">Select Microphone</option>
              {availableDevices.microphones.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>

            {/* Noise Suppression */}
            <label className="flex items-center mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.enableNoiseSuppression}
                onChange={(e) => setLocalSettings({ ...localSettings, enableNoiseSuppression: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                localSettings.enableNoiseSuppression 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'bg-gray-800 border-gray-600'
              }`}>
                {localSettings.enableNoiseSuppression && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className="ml-3 text-white text-sm">Enable noise suppression</span>
            </label>
          </div>

          {/* Speaker Settings */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Volume2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-white text-lg font-medium">Speaker</h3>
            </div>
            <select 
              value={localSettings.selectedSpeaker || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, selectedSpeaker: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
            >
              <option value="">Select Speaker</option>
              {availableDevices.speakers.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          {/* Video Quality */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Monitor className="w-5 h-5 text-orange-400" />
              <h3 className="text-white text-lg font-medium">Video Quality</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => setLocalSettings({ ...localSettings, videoQuality: quality })}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    localSettings.videoQuality === quality
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Virtual Background */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <h3 className="text-white text-lg font-medium mb-1">Virtual Background</h3>
                <p className="text-gray-400 text-sm">Blur or replace your background</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.enableVirtualBackground}
                onChange={(e) => setLocalSettings({ ...localSettings, enableVirtualBackground: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-all ${
                localSettings.enableVirtualBackground ? 'bg-blue-500' : 'bg-gray-700'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${
                  localSettings.enableVirtualBackground ? 'translate-x-6' : 'translate-x-1'
                } mt-0.5`} />
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex items-center justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;