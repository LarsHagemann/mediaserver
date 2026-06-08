import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_BACKEND_URL,
  credentials: "include",
});
export type BaseQuery = typeof baseQuery;

export const baseApi = createApi({
  baseQuery,
  endpoints: () => ({}),
  tagTypes: [
    "document",
    "tag",
    "collection",
    "identity",
    "role",
    "user",
    "authConfig",
    "session",
  ],
  reducerPath: "api",
});
