import type { PaginatedResponse } from "../util/PaginatedResponse";
export type DocumentUpload = {
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
export interface StoreState {
    free: number;
    total: number;
    used: number;
    numberOfDocuments: number;
    basePath: string;
}
export interface BackendPlugin {
    name: string;
    trusted: boolean;
    description: string;
}
export interface BackendState {
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
    ownerId: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
};
export type CollectionShareEntry = {
    userId: string;
    name: string | null;
    email: string | null;
};
export type CollectionAccess = {
    ownerId: string;
    isPublic: boolean;
    shares: CollectionShareEntry[];
};
export type ApiTagWithCount = ApiTag & {
    usageCount: number;
};
export type BulkEditDocumentsRequest = {
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
export declare const api: import("@reduxjs/toolkit/query").Api<import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, {
    health: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        status: string;
    }, "api", unknown>;
    documentUpload: import("@reduxjs/toolkit/query").MutationDefinition<DocumentUpload, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    listDocuments: import("@reduxjs/toolkit/query").QueryDefinition<{
        limit?: number;
        offset?: number;
        query?: string;
        seed?: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", PaginatedResponse<Document>, "api", unknown>;
    listDocumentsByIds: import("@reduxjs/toolkit/query").QueryDefinition<string[], import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", DocumentWithTags[], "api", unknown>;
    bulkEditDocuments: import("@reduxjs/toolkit/query").MutationDefinition<BulkEditDocumentsRequest, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    deleteDocument: import("@reduxjs/toolkit/query").MutationDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getDocumentAccess: import("@reduxjs/toolkit/query").QueryDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", DocumentAccess, "api", unknown>;
    updateDocumentAccess: import("@reduxjs/toolkit/query").MutationDefinition<{
        id: string;
        isPublic: boolean;
        sharedWith: string[];
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getDocumentTags: import("@reduxjs/toolkit/query").QueryDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        tags: ApiTag[];
    }, "api", unknown>;
    listTags: import("@reduxjs/toolkit/query").QueryDefinition<{
        limit?: number;
        offset?: number;
        query?: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", PaginatedResponse<ApiTagWithCount>, "api", unknown>;
    addTagToDocument: import("@reduxjs/toolkit/query").MutationDefinition<{
        documentId: string;
        tag: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    removeTagFromDocument: import("@reduxjs/toolkit/query").MutationDefinition<{
        documentId: string;
        tag: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getBackendState: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", BackendState, "api", unknown>;
    getCollectionById: import("@reduxjs/toolkit/query").QueryDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", Collection, "api", unknown>;
    listCollections: import("@reduxjs/toolkit/query").QueryDefinition<{
        limit?: number;
        offset?: number;
        type?: CollectionType;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", PaginatedResponse<Collection>, "api", unknown>;
    createCollection: import("@reduxjs/toolkit/query").MutationDefinition<{
        name: string;
        description: string | null;
        filterExpression?: string;
        isFavorite: boolean;
        type: CollectionType;
        isPublic?: boolean;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", Collection, "api", unknown>;
    updateCollection: import("@reduxjs/toolkit/query").MutationDefinition<{
        id: string;
        name: string;
        description: string | null;
        filterExpression: string;
        isFavorite: boolean;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", Collection, "api", unknown>;
    deleteCollection: import("@reduxjs/toolkit/query").MutationDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getCollectionAccess: import("@reduxjs/toolkit/query").QueryDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", CollectionAccess, "api", unknown>;
    updateCollectionAccess: import("@reduxjs/toolkit/query").MutationDefinition<{
        id: string;
        isPublic: boolean;
        sharedWith: string[];
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    addCollectionMember: import("@reduxjs/toolkit/query").MutationDefinition<{
        collectionId: string;
        documentId: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    removeCollectionMember: import("@reduxjs/toolkit/query").MutationDefinition<{
        collectionId: string;
        documentId: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getAppConfig: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", AppConfig, "api", unknown>;
    getMe: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", Identity, "api", unknown>;
    listSessions: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        sessions: Session[];
    }, "api", unknown>;
    deleteSession: import("@reduxjs/toolkit/query").MutationDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getActions: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        actions: string[];
    }, "api", unknown>;
    listRoles: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        roles: AdminRole[];
    }, "api", unknown>;
    createRole: import("@reduxjs/toolkit/query").MutationDefinition<{
        name: string;
        description?: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        role: AdminRole;
    }, "api", unknown>;
    deleteRole: import("@reduxjs/toolkit/query").MutationDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    addRolePolicy: import("@reduxjs/toolkit/query").MutationDefinition<{
        roleId: string;
        action: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    removeRolePolicy: import("@reduxjs/toolkit/query").MutationDefinition<{
        roleId: string;
        action: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    listUsers: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        users: AdminUser[];
    }, "api", unknown>;
    setUserRoles: import("@reduxjs/toolkit/query").MutationDefinition<{
        userId: string;
        roleIds: string[];
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        user: AdminUser;
    }, "api", unknown>;
    getAuthConfig: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", AuthConfig, "api", unknown>;
    updateAuthConfig: import("@reduxjs/toolkit/query").MutationDefinition<{
        anonymousRoleId?: string;
        defaultRoleId?: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
}, "api", "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", typeof import("@reduxjs/toolkit/query").coreModuleName | typeof import("@reduxjs/toolkit/query/react").reactHooksModuleName>;
export type AppConfig = {
    idpEnabled: boolean;
};
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
export declare function updateDocumentFriendlyName(id: string, friendlyName: string): Promise<void>;
export declare function uploadDocumentWithProgress(params: {
    file: File;
    webSocketClientId: string;
    tags: ApiTag[];
    isPublic: boolean;
    friendlyName: string;
}, onProgress: (pct: number) => void): Promise<void>;
