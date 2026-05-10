import { createSlice } from "@reduxjs/toolkit";
import type { translations } from "../i18n";
import type { RootState } from "./store";

type PersistentState = {
  language: Omit<keyof typeof translations, "languages">;
  activeThemeName: string | null;
  gallerySeed: string | null;
  maxConcurrentUploads: number;
  tagInputEasyMode: boolean;
};

const initialState: PersistentState = {
  language: "en",
  activeThemeName: null,
  gallerySeed: null,
  maxConcurrentUploads: 3,
  tagInputEasyMode: true,
};

export const persistentSlice = createSlice({
  name: "local",
  initialState,
  reducers: {
    setLanguage: (state, action: { payload: PersistentState["language"] }) => {
      state.language = action.payload;
    },
    setActiveTheme: (state, action: { payload: string | null }) => {
      state.activeThemeName = action.payload;
    },
    setGallerySeed: (state, action: { payload: string }) => {
      state.gallerySeed = action.payload;
    },
    setMaxConcurrentUploads: (state, action: { payload: number }) => {
      state.maxConcurrentUploads = Math.min(5, Math.max(1, action.payload));
    },
    setTagInputEasyMode: (state, action: { payload: boolean }) => {
      state.tagInputEasyMode = action.payload;
    },
  },
});

export const {
  setLanguage,
  setActiveTheme,
  setGallerySeed,
  setMaxConcurrentUploads,
  setTagInputEasyMode,
} = persistentSlice.actions;
export const persistentSliceReducer = persistentSlice.reducer;

export const selectLanguage = (state: RootState) => state.local.language;
export const selectActiveThemeName = (state: RootState) =>
  state.local.activeThemeName;
export const selectGallerySeed = (state: RootState) => state.local.gallerySeed;
export const selectMaxConcurrentUploads = (state: RootState) =>
  state.local.maxConcurrentUploads ?? 3;
export const selectTagInputEasyMode = (state: RootState) =>
  state.local.tagInputEasyMode ?? true;
