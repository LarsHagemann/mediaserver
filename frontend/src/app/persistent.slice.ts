import { createSlice } from "@reduxjs/toolkit";
import type { translations } from "../i18n";
import type { RootState } from "./store";

type PersistentState = {
  language: Omit<keyof typeof translations, "languages">;
  activeThemeName: string | null;
  gallerySeed: string | null;
};

const initialState: PersistentState = {
  language: "en",
  activeThemeName: null,
  gallerySeed: null,
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
  },
});

export const { setLanguage, setActiveTheme, setGallerySeed } = persistentSlice.actions;
export const persistentSliceReducer = persistentSlice.reducer;

export const selectLanguage = (state: RootState) => state.local.language;
export const selectActiveThemeName = (state: RootState) =>
  state.local.activeThemeName;
export const selectGallerySeed = (state: RootState) => state.local.gallerySeed;
