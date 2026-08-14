import type { Identity } from "./Identity.js";
import type {
  CollectionAccessScope,
  DocumentAccessScope,
} from "./AccessScope.js";

export class AccessScopeResolver {
  collectionScope(identity: Identity): CollectionAccessScope {
    if (!identity.hasPermission("collection:read")) return { type: "none" };
    if (identity.userId === "system" || identity.hasPermission("admin:users")) {
      return { type: "all" };
    }
    if (identity.userId !== null) {
      return { type: "accessible-by", userId: identity.userId };
    }
    return { type: "public-only" };
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

  /**
   * Scope for destructive bulk operations such as duplicate resolution. Unlike
   * `documentScope`, this never includes documents that are merely visible to
   * the user (public or shared with them) — resolving a duplicate group deletes
   * documents, so every member of a group must be one the user actually owns.
   */
  ownedDocumentScope(identity: Identity): DocumentAccessScope {
    if (!identity.hasPermission("document:read")) return { type: "none" };
    // AllowAllIdentity (IDP disabled) or admin: the whole library is in play
    if (identity.userId === "system" || identity.hasPermission("admin:users")) {
      return { type: "all" };
    }
    if (identity.userId !== null) {
      return { type: "owned-by", userId: identity.userId };
    }
    // Anonymous users own nothing, so there is nothing for them to resolve.
    return { type: "none" };
  }
}
