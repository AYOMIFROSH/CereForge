import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import API slices
import { authApi } from './api/authApi';
import { userApi } from './api/userApi';
import { getStartedApi } from './api/getStartedApi';
import { calendarApi } from './api/calendarApi';  // ✅ ADD THIS
import { partnersApi } from './api/partnersApi';

// Import regular slices
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

// ✅ PRODUCTION-OPTIMIZED: No persistence, cookies handle auth
export const store = configureStore({
  reducer: {
    // RTK Query API slices (auto-cached in memory)
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [getStartedApi.reducerPath]: getStartedApi.reducer,
    [calendarApi.reducerPath]: calendarApi.reducer,  // ✅ ADD THIS
    [partnersApi.reducerPath]: partnersApi.reducer,
    
    // Regular slices (memory-only, no localStorage)
    auth: authReducer,
    ui: uiReducer
  },
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // ✅ Performance: No serialization checks needed
      serializableCheck: false
    })
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      .concat(getStartedApi.middleware)
      .concat(calendarApi.middleware)  // ✅ ADD THIS
      .concat(partnersApi.middleware),
  
  devTools: import.meta.env.DEV // Only in development
});

// ✅ Setup RTK Query listeners for:
// - refetchOnFocus: Refetch when user returns to tab
// - refetchOnReconnect: Refetch when internet reconnects
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;