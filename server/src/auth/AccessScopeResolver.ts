import type { Identity } from "./Identity.js";
import type { CollectionAccessScope, DocumentAccessScope } from "./AccessScope.js";

export class AccessScopeResolver {
  collectionScope(identity: Identity): CollectionAccessScope {
    return identity.hasPermission("collection:read") ? { type: "all" } : { type: "none" };
  }

  documentScope(identity: Identity): DocumentAccessScope {
    if (!identity.hasPermission("document:read")) return { type: "none" };
    // AllowAllIdentity (IDP disabled) or admin role
    if (identity.userId === "system" || identity.hasPermission("admin:users")) {
      return { type: "all" };
    }
    if (identity.userId !== null) {
      return { type: "accessible-by", userId: identity.userId };
    }
    // Anonymous user with document:read permission
    return { type: "public-only" };
  }
}
