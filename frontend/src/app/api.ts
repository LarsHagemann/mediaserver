import type { PaginatedResponse } from "../util/PaginatedResponse";
import { tagToString } from "../util/tag";
import { baseApi } from "./baseApi";

type DocumentUpload = {
  file: File;
  webSocketClientId: string;
  tags: ApiTag[];
  isPublic: boolean;
  friendlyName: string;
};

export type Document = {
  id: string;
  mime: string;
  friendlyName: string;
  previousId: string | undefined;
  nextId: string | undefined;
  queryIndex: number;
  ownerId: string;
  isPublic: boolean;
};

export type DocumentShareEntry = {
  userId: string;
  name: string | null;
  email: string | null;
};

export type DocumentAccess = {
  ownerId: string;
  isPublic: boolean;
  shares: DocumentShareEntry[];
};

export type DocumentWithTags = Document & {
  tags: ApiTag[];
};

interface StoreState {
  free: number;
  total: number;
  used: number;
  numberOfDocuments: number;
  basePath: string;
}

interface BackendPlugin {
  name: string;
  trusted: boolean;
  description: string;
}

interface BackendState {
  stores: StoreState[];
  uptime: number;
  plugins: BackendPlugin[];
  version: string;
  commit: string;
}

export type ApiTag = {
  key: string;
  value?: string;
  type: string;
};

export type CollectionType = "dynamic" | "static";

export type Collection = {
  id: string;
  name: string;
  description?: string;
  filterExpression: string;
  isFavorite: boolean;
  type: CollectionType;
  createdAt: string;
  updatedAt: string;
};

type ApiTagWithCount = ApiTag & {
  usageCount: number;
};

type BulkEditDocumentsRequest = {
  documentIds: string[];
  tagsToAdd: ApiTag[];
  tagsToRemove: ApiTag[];
};

export type Session = {
  id: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
  browser: string | null;
  os: string | null;
  platform: string | null;
};

export const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    health: build.query<{ status: string }, void>({
      query: () => ({
        url: "/health",
        method: "GET",
      }),
    }),

    documentUpload: build.mutation<void, DocumentUpload>({
      query: ({ file, webSocketClientId, tags, isPublic }) => {
        const formData = new FormData();
        formData.append("upload", file);
        formData.append("tags", JSON.stringify(tags));
        formData.append("isPublic", String(isPublic));
        return {
          url: `/documents/upload?webSocketClientId=${encodeURIComponent(
            webSocketClientId,
          )}&extension=${encodeURIComponent(
            (file.name.split(".").pop() || "").toLocaleLowerCase(),
          )}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["tag", "document"],
    }),

    listDocuments: build.query<
      PaginatedResponse<Document>,
      { limit?: number; offset?: number; query?: string; seed?: string }
    >({
      query: ({ limit = 100, offset = 0, query = "", seed }) => ({
        url: `/documents?limit=${limit}&offset=${offset}&query=${encodeURIComponent(query)}${seed ? `&seed=${encodeURIComponent(seed)}` : ""}`,
        method: "GET",
      }),
      providesTags: (response) => [
        "document",
        "tag",
        ...(response?.items.map(
          (doc) => ({ type: "document", id: doc.id }) as const,
        ) || []),
      ],
    }),

    listDocumentsByIds: build.query<DocumentWithTags[], string[]>({
      query: (ids) => ({
        url: `/documents/by-ids?${ids.map((id) => `id=${encodeURIComponent(id)}`).join("&")}`,
        method: "GET",
      }),
      providesTags: (response) => [
        "document",
        "tag",
        ...(response?.map(
          (doc) => ({ type: "document", id: doc.id }) as const,
        ) || []),
      ],
    }),

    bulkEditDocuments: build.mutation<void, BulkEditDocumentsRequest>({
      query: (body) => ({
        url: `/documents/bulk-edit`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["document", "tag"],
    }),

    deleteDocument: build.mutation<void, string>({
      query: (id) => ({
        url: `/documents/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "document",
        { type: "document", id },
      ],
    }),

    getDocumentAccess: build.query<DocumentAccess, string>({
      query: (id) => ({
        url: `/documents/${encodeURIComponent(id)}/access`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "document", id }],
    }),

    updateDocumentAccess: build.mutation<
      void,
      { id: string; isPublic: boolean; sharedWith: string[] }
    >({
      query: ({ id, ...body }) => ({
        url: `/documents/${encodeURIComponent(id)}/access`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "document", id }],
    }),

    getDocumentTags: build.query<{ tags: ApiTag[] }, string>({
      query: (documentId) => ({
        url: `/tags/${encodeURIComponent(documentId)}`,
        method: "GET",
      }),
      providesTags: (result, _result, documentId) => [
        "tag",
        { type: "document", id: documentId },
        ...(result?.tags.map(
          (t) => ({ type: "tag", id: tagToString(t) }) as const,
        ) || []),
      ],
    }),

    listTags: build.query<
      PaginatedResponse<ApiTagWithCount>,
      { limit?: number; offset?: number; query?: string }
    >({
      query: ({ limit = 100, offset = 0, query = "" }) => ({
        url: `/tags?limit=${limit}&offset=${offset}&query=${encodeURIComponent(
          query,
        )}`,
        method: "GET",
      }),
      providesTags: ["tag"],
    }),

    addTagToDocument: build.mutation<void, { documentId: string; tag: string }>(
      {
        query: ({ documentId, tag }) => ({
          url: `/tags/${encodeURIComponent(documentId)}/add`,
          method: "POST",
          body: { tag },
        }),
        invalidatesTags: (_result, _error, arg) => [
          "tag",
          { type: "document", id: arg.documentId },
        ],
      },
    ),

    removeTagFromDocument: build.mutation<
      void,
      { documentId: string; tag: string }
    >({
      query: ({ documentId, tag }) => ({
        url: `/tags/${encodeURIComponent(documentId)}/remove`,
        method: "POST",
        body: { tag },
      }),
      invalidatesTags: (_result, _error, arg) => [
        "tag",
        { type: "document", id: arg.documentId },
      ],
    }),

    getBackendState: build.query<BackendState, void>({
      query: () => ({
        url: `/state`,
        method: "GET",
      }),
    }),

    getCollectionById: build.query<Collection, string>({
      query: (id) => ({
        url: `/collections/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "collection", id }],
    }),

    listCollections: build.query<
      PaginatedResponse<Collection>,
      { limit?: number; offset?: number; type?: CollectionType }
    >({
      query: ({ limit = 20, offset = 0, type }) => ({
        url: `/collections?limit=${limit}&offset=${offset}${type ? `&type=${type}` : ""}`,
        method: "GET",
      }),
      providesTags: (response) => [
        "collection",
        ...(response?.items.map((c) => ({
          type: "collection" as const,
          id: c.id,
        })) ?? []),
      ],
    }),

    createCollection: build.mutation<
      Collection,
      {
        name: string;
        description: string | null;
        filterExpression?: string;
        isFavorite: boolean;
        type: CollectionType;
      }
    >({
      query: (body) => ({
        url: `/collections`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["collection"],
    }),

    updateCollection: build.mutation<
      Collection,
      {
        id: string;
        name: string;
        description: string | null;
        filterExpression: string;
        isFavorite: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/collections/${encodeURIComponent(id)}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "collection", id: arg.id },
      ],
    }),

    deleteCollection: build.mutation<void, string>({
      query: (id) => ({
        url: `/collections/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "collection",
        { type: "collection", id },
      ],
    }),

    addCollectionMember: build.mutation<
      void,
      { collectionId: string; documentId: string }
    >({
      query: ({ collectionId, documentId }) => ({
        url: `/collections/${encodeURIComponent(collectionId)}/members`,
        method: "POST",
        body: { documentId },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "collection", id: arg.collectionId },
        { type: "document", id: arg.documentId },
        "tag",
      ],
    }),

    removeCollectionMember: build.mutation<
      void,
      { collectionId: string; documentId: string }
    >({
      query: ({ collectionId, documentId }) => ({
        url: `/collections/${encodeURIComponent(collectionId)}/members/${encodeURIComponent(documentId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "collection", id: arg.collectionId },
        { type: "document", id: arg.documentId },
        "tag",
      ],
    }),

    // --- Auth ---

    getMe: build.query<Identity, void>({
      query: () => ({ url: "/auth/me", method: "GET" }),
      providesTags: ["identity"],
      keepUnusedDataFor: 0,
    }),

    listSessions: build.query<{ sessions: Session[] }, void>({
      query: () => ({ url: "/auth/sessions", method: "GET" }),
      providesTags: ["session"],
    }),

    deleteSession: build.mutation<void, string>({
      query: (id) => ({
        url: `/auth/sessions/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["session"],
    }),

    getActions: build.query<{ actions: string[] }, void>({
      query: () => ({ url: "/auth/actions", method: "GET" }),
    }),

    // --- Admin: Roles ---

    listRoles: build.query<{ roles: AdminRole[] }, void>({
      query: () => ({ url: "/admin/roles", method: "GET" }),
      providesTags: ["role"],
    }),

    createRole: build.mutation<
      { role: AdminRole },
      { name: string; description?: string }
    >({
      query: (body) => ({ url: "/admin/roles", method: "POST", body }),
      invalidatesTags: ["role"],
    }),

    deleteRole: build.mutation<void, string>({
      query: (id) => ({
        url: `/admin/roles/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["role"],
    }),

    addRolePolicy: build.mutation<void, { roleId: string; action: string }>({
      query: ({ roleId, action }) => ({
        url: `/admin/roles/${encodeURIComponent(roleId)}/policies`,
        method: "POST",
        body: { action },
      }),
      invalidatesTags: ["role"],
    }),

    removeRolePolicy: build.mutation<void, { roleId: string; action: string }>({
      query: ({ roleId, action }) => ({
        url: `/admin/roles/${encodeURIComponent(roleId)}/policies/${encodeURIComponent(action)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["role"],
    }),

    // --- Admin: Users ---

    listUsers: build.query<{ users: AdminUser[] }, void>({
      query: () => ({ url: "/admin/users", method: "GET" }),
      providesTags: ["user"],
    }),

    setUserRoles: build.mutation<
      { user: AdminUser },
      { userId: string; roleIds: string[] }
    >({
      query: ({ userId, roleIds }) => ({
        url: `/admin/users/${encodeURIComponent(userId)}/roles`,
        method: "PUT",
        body: { roleIds },
      }),
      invalidatesTags: ["user"],
    }),

    // --- Admin: Config ---

    getAuthConfig: build.query<AuthConfig, void>({
      query: () => ({ url: "/admin/config", method: "GET" }),
      providesTags: ["authConfig"],
    }),

    updateAuthConfig: build.mutation<
      void,
      { anonymousRoleId?: string; defaultRoleId?: string }
    >({
      query: (body) => ({ url: "/admin/config", method: "PUT", body }),
      invalidatesTags: ["authConfig"],
    }),
  }),
});

export type Identity = {
  userId: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  name: string | null;
  email: string | null;
  registrationAllowed: boolean;
};

export type AdminRole = {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  policies: string[];
};

export type AdminUser = {
  id: string;
  externalId: string;
  email?: string;
  name?: string;
  createdAt: string;
  roles: Array<{
    id: string;
    name: string;
    isSystem: boolean;
    description?: string;
    createdAt: string;
    policies: string[];
  }>;
};

export type AuthConfig = {
  anonymousRoleId: string | null;
  defaultRoleId: string | null;
};

export async function updateDocumentFriendlyName(
  id: string,
  friendlyName: string,
): Promise<void> {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/documents/${id}/friendly-name`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendlyName }),
    },
  );
  if (!res.ok) throw new Error(`Failed to update friendly name: ${res.status}`);
}

export function uploadDocumentWithProgress(
  params: {
    file: File;
    webSocketClientId: string;
    tags: ApiTag[];
    isPublic: boolean;
    friendlyName: string;
  },
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("upload", params.file);
    formData.append("tags", JSON.stringify(params.tags));
    formData.append("isPublic", String(params.isPublic));
    formData.append("friendlyName", params.friendlyName);

    const extension = (
      params.file.name.split(".").pop() ?? ""
    ).toLocaleLowerCase();
    const url = `${import.meta.env.VITE_BACKEND_URL}/documents/upload?webSocketClientId=${encodeURIComponent(params.webSocketClientId)}&extension=${encodeURIComponent(extension)}`;

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else
        reject(
          new Error(
            xhr.statusText || `Upload failed with status ${xhr.status}`,
          ),
        );
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));

    xhr.send(formData);
  });
}
