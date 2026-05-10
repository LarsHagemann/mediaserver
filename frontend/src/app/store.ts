import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { enhancedApi } from "./enhancedApi";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import { persistentSlice } from "./persistent.slice";
import { useDispatch, useSelector } from "react-redux";

const persistConfig = {
  key: "local",
  storage,
};

const rootReducer = combineReducers({
  [enhancedApi.reducerPath]: enhancedApi.reducer,
  [persistentSlice.reducerPath]: persistReducer(
    persistConfig,
    persistentSlice.reducer,
  ),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(enhancedApi.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

setupListeners(store.dispatch);
