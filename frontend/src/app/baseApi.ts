import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_BACKEND_URL,
});
export type BaseQuery = typeof baseQuery;

export const baseApi = createApi({
  baseQuery,
  endpoints: () => ({}),
  tagTypes: ["document", "tag", "collection"],
  reducerPath: "api",
});
