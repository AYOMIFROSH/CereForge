import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface UIState {
  // Global loading
  isLoading: boolean;
  
  // Toast notifications
  toasts: Toast[];
  
  // Network status
  isOnline: boolean;
  isSlowConnection: boolean;
  
  // Mobile menu
  isMobileMenuOpen: boolean;
}

const initialState: UIState = {
  isLoading: false,
  toasts: [],
  isOnline: navigator.onLine,
  isSlowConnection: false,
  isMobileMenuOpen: false
};

// ✅ UI Slice for app-wide UI state
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Toast notifications
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      state.toasts.push({
        id,
        ...action.payload,
        duration: action.payload.duration || 5000
      });
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    
    clearToasts: (state) => {
      state.toasts = [];
    },
    
    // Network status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    
    setSlowConnection: (state, action: PayloadAction<boolean>) => {
      state.isSlowConnection = action.payload;
    },
    
    // Mobile menu
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    }
  }
});

// ✅ Export actions
export const {
  setLoading,
  addToast,
  removeToast,
  clearToasts,
  setOnlineStatus,
  setSlowConnection,
  toggleMobileMenu,
  closeMobileMenu
} = uiSlice.actions;

// ✅ Export selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectIsLoading = (state: { ui: UIState }) => state.ui.isLoading;
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;
export const selectIsOnline = (state: { ui: UIState }) => state.ui.isOnline;
export const selectIsSlowConnection = (state: { ui: UIState }) => state.ui.isSlowConnection;
export const selectIsMobileMenuOpen = (state: { ui: UIState }) => state.ui.isMobileMenuOpen;

// ✅ Export reducer
export default uiSlice.reducer;