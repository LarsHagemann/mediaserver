export declare const enhancedApi: import("@reduxjs/toolkit/query").Api<import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, import("@reduxjs/toolkit/query").UpdateDefinitions<{
    health: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        status: string;
    }, "api", unknown>;
    documentUpload: import("@reduxjs/toolkit/query").MutationDefinition<import("./api").DocumentUpload, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    listDocuments: import("@reduxjs/toolkit/query").QueryDefinition<{
        limit?: number;
        offset?: number;
        query?: string;
        seed?: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("../util/PaginatedResponse").PaginatedResponse<import("./api").Document>, "api", unknown>;
    listDocumentsByIds: import("@reduxjs/toolkit/query").QueryDefinition<string[], import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").DocumentWithTags[], "api", unknown>;
    bulkEditDocuments: import("@reduxjs/toolkit/query").MutationDefinition<import("./api").BulkEditDocumentsRequest, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    deleteDocument: import("@reduxjs/toolkit/query").MutationDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getDocumentAccess: import("@reduxjs/toolkit/query").QueryDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").DocumentAccess, "api", unknown>;
    updateDocumentAccess: import("@reduxjs/toolkit/query").MutationDefinition<{
        id: string;
        isPublic: boolean;
        sharedWith: string[];
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getDocumentTags: import("@reduxjs/toolkit/query").QueryDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        tags: import("./api").ApiTag[];
    }, "api", unknown>;
    listTags: import("@reduxjs/toolkit/query").QueryDefinition<{
        limit?: number;
        offset?: number;
        query?: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("../util/PaginatedResponse").PaginatedResponse<import("./api").ApiTagWithCount>, "api", unknown>;
    addTagToDocument: import("@reduxjs/toolkit/query").MutationDefinition<{
        documentId: string;
        tag: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    removeTagFromDocument: import("@reduxjs/toolkit/query").MutationDefinition<{
        documentId: string;
        tag: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getBackendState: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").BackendState, "api", unknown>;
    getCollectionById: import("@reduxjs/toolkit/query").QueryDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").Collection, "api", unknown>;
    listCollections: import("@reduxjs/toolkit/query").QueryDefinition<{
        limit?: number;
        offset?: number;
        type?: import("./api").CollectionType;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("../util/PaginatedResponse").PaginatedResponse<import("./api").Collection>, "api", unknown>;
    createCollection: import("@reduxjs/toolkit/query").MutationDefinition<{
        name: string;
        description: string | null;
        filterExpression?: string;
        isFavorite: boolean;
        type: import("./api").CollectionType;
        isPublic?: boolean;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").Collection, "api", unknown>;
    updateCollection: import("@reduxjs/toolkit/query").MutationDefinition<{
        id: string;
        name: string;
        description: string | null;
        filterExpression: string;
        isFavorite: boolean;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").Collection, "api", unknown>;
    deleteCollection: import("@reduxjs/toolkit/query").MutationDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getCollectionAccess: import("@reduxjs/toolkit/query").QueryDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").CollectionAccess, "api", unknown>;
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
    listDuplicates: import("@reduxjs/toolkit/query").QueryDefinition<{
        limit?: number;
        offset?: number;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("../util/PaginatedResponse").PaginatedResponse<import("./api").DuplicateGroup>, "api", unknown>;
    getDuplicateIndexingStatus: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").IndexingStatus, "api", unknown>;
    startDuplicateIndexing: import("@reduxjs/toolkit/query").MutationDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").IndexingStatus, "api", unknown>;
    resolveDuplicateGroup: import("@reduxjs/toolkit/query").MutationDefinition<import("./api").ResolveDuplicateGroupRequest, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").ResolveDuplicateGroupResult, "api", unknown>;
    getAppConfig: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").AppConfig, "api", unknown>;
    getMe: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").Identity, "api", unknown>;
    listSessions: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        sessions: import("./api").Session[];
    }, "api", unknown>;
    deleteSession: import("@reduxjs/toolkit/query").MutationDefinition<string, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
    getActions: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        actions: string[];
    }, "api", unknown>;
    listRoles: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        roles: import("./api").AdminRole[];
    }, "api", unknown>;
    createRole: import("@reduxjs/toolkit/query").MutationDefinition<{
        name: string;
        description?: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        role: import("./api").AdminRole;
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
        users: import("./api").AdminUser[];
    }, "api", unknown>;
    setUserRoles: import("@reduxjs/toolkit/query").MutationDefinition<{
        userId: string;
        roleIds: string[];
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", {
        user: import("./api").AdminUser;
    }, "api", unknown>;
    getAuthConfig: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", import("./api").AuthConfig, "api", unknown>;
    updateAuthConfig: import("@reduxjs/toolkit/query").MutationDefinition<{
        anonymousRoleId?: string;
        defaultRoleId?: string;
    }, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", void, "api", unknown>;
}, "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", never>, "api", "document" | "tag" | "collection" | "identity" | "role" | "user" | "authConfig" | "session", typeof import("@reduxjs/toolkit/query").coreModuleName | typeof import("@reduxjs/toolkit/query/react").reactHooksModuleName>;
