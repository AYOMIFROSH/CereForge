import { useState, useEffect, useCallback } from 'react';

type EditorMode = 'email' | 'document';

interface EditorPreferences {
  editorMode: EditorMode;
  sidebarOpen: boolean;
}

const STORAGE_KEY = 'cereforge_editor_preferences';

const DEFAULT_PREFERENCES: EditorPreferences = {
  editorMode: 'email',
  sidebarOpen: true,
};

/**
 * Custom hook for managing editor preferences with localStorage persistence
 * Optimized with no redundancy or memory leaks
 */
export const useEditorPreferences = () => {
  // Initialize state from localStorage or defaults
  const [preferences, setPreferences] = useState<EditorPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as EditorPreferences;
        // Validate parsed data
        if (
          parsed &&
          typeof parsed === 'object' &&
          (parsed.editorMode === 'email' || parsed.editorMode === 'document') &&
          typeof parsed.sidebarOpen === 'boolean'
        ) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load editor preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  // Persist to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save editor preferences:', error);
    }
  }, [preferences]);

  // Optimized setters with useCallback
  const setEditorMode = useCallback((mode: EditorMode) => {
    setPreferences((prev) => ({
      ...prev,
      editorMode: mode,
    }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      sidebarOpen: open,
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen,
    }));
  }, []);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  }, []);

  return {
    editorMode: preferences.editorMode,
    sidebarOpen: preferences.sidebarOpen,
    setEditorMode,
    setSidebarOpen,
    toggleSidebar,
    resetPreferences,
  };
};