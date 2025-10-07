// src/store/store.ts - Updated store with payment slice
import { configureStore, combineReducers } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';


// NO PERSISTENCE - rely entirely on httpOnly cookies for session management
const rootReducer = combineReducers({
  auth: authReducer,

});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore payment-related actions with non-serializable payloads

        ],
        ignoredPaths: [
          // Ignore certain paths in state that might contain non-serializable data

        ],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;