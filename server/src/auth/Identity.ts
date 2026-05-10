export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export type Action =
  | "document:read"
  | "document:upload"
  | "document:delete"
  | "tag:manage"
  | "collection:read"
  | "collection:create"
  | "collection:update"
  | "collection:delete"
  | "admin:users"
  | "admin:roles"
  | "admin:config"
  | "admin:state";

export const ALL_ACTIONS: readonly Action[] = [
  "document:read",
  "document:upload",
  "document:delete",
  "tag:manage",
  "collection:read",
  "collection:create",
  "collection:update",
  "collection:delete",
  "admin:users",
  "admin:roles",
  "admin:config",
  "admin:state",
];

export interface Identity {
  readonly userId: string | null;
  readonly isAuthenticated: boolean;
  readonly permissions: readonly Action[];
  hasPermission(action: Action): boolean;
}

export class AllowAllIdentity implements Identity {
  readonly userId = "system";
  readonly isAuthenticated = true;
  readonly permissions: readonly Action[] = ALL_ACTIONS;

  hasPermission(_action: Action): boolean {
    return true;
  }
}

export class SessionIdentity implements Identity {
  readonly isAuthenticated = true;

  constructor(
    readonly userId: string,
    readonly permissions: readonly Action[],
  ) {}

  hasPermission(action: Action): boolean {
    return this.permissions.includes(action);
  }
}

export class AnonymousIdentity implements Identity {
  readonly userId = null;
  readonly isAuthenticated = false;

  constructor(readonly permissions: readonly Action[]) {}

  hasPermission(action: Action): boolean {
    return this.permissions.includes(action);
  }
}
