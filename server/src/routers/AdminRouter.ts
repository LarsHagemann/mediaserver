import { Router } from "express";
import { apiHandler } from "../ApiHandler.js";
import { requirePermission } from "../auth/requirePermission.js";
import { services } from "../DefaultDiContainer.js";
import type { RoleService } from "../auth/RoleService.js";
import type { UserService } from "../auth/UserService.js";
import type { Action } from "../auth/Identity.js";
import type { EmptyObject } from "../common/EmptyObject.js";

export const adminRouter = Router();

// All admin routes require at least one admin permission.
// Individual endpoints apply their specific permission.

// --- Roles ---

adminRouter.get(
  "/roles",
  requirePermission("admin:roles"),
  apiHandler(async ({ diContainer }) => {
    const roleService = diContainer.get<RoleService>(services.roleService);
    const roles = await roleService.listRoles();
    return { status: 200, body: { roles } };
  }),
);

adminRouter.post(
  "/roles",
  requirePermission("admin:roles"),
  apiHandler<
    { role: object },
    EmptyObject,
    { name: string; description?: string }
  >(async ({ diContainer, body }) => {
    const roleService = diContainer.get<RoleService>(services.roleService);
    const role = await roleService.createRole(body.name, body.description);
    return { status: 201, body: { role } };
  }),
);

adminRouter.delete(
  "/roles/:id",
  requirePermission("admin:roles"),
  apiHandler<EmptyObject, EmptyObject, EmptyObject, { id: string }>(
    async ({ diContainer, params: { id } }) => {
      const roleService = diContainer.get<RoleService>(services.roleService);
      await roleService.deleteRole(id);
      return { status: 204, body: {} };
    },
  ),
);

adminRouter.post(
  "/roles/:id/policies",
  requirePermission("admin:roles"),
  apiHandler<EmptyObject, EmptyObject, { action: Action }, { id: string }>(
    async ({ diContainer, params: { id }, body, identity }) => {
      const roleService = diContainer.get<RoleService>(services.roleService);
      await roleService.addPolicy(id, body.action, identity);
      return { status: 204, body: {} };
    },
  ),
);

adminRouter.delete(
  "/roles/:id/policies/:action",
  requirePermission("admin:roles"),
  apiHandler<
    EmptyObject,
    EmptyObject,
    EmptyObject,
    { id: string; action: Action }
  >(async ({ diContainer, params: { id, action } }) => {
    const roleService = diContainer.get<RoleService>(services.roleService);
    await roleService.removePolicy(id, action);
    return { status: 204, body: {} };
  }),
);

// --- Users ---

adminRouter.get(
  "/users",
  requirePermission("admin:users"),
  apiHandler(async ({ diContainer }) => {
    const userService = diContainer.get<UserService>(services.userService);
    const users = await userService.listUsers();
    return { status: 200, body: { users } };
  }),
);

adminRouter.put(
  "/users/:id/roles",
  requirePermission("admin:users"),
  apiHandler<
    { user: object },
    EmptyObject,
    { roleIds: string[] },
    { id: string }
  >(async ({ diContainer, params: { id }, body }) => {
    const userService = diContainer.get<UserService>(services.userService);
    const user = await userService.setUserRoles(id, body.roleIds);
    return { status: 200, body: { user } };
  }),
);

// --- Config ---

adminRouter.get(
  "/config",
  requirePermission("admin:config"),
  apiHandler(async ({ diContainer }) => {
    const roleService = diContainer.get<RoleService>(services.roleService);
    const [anonymousRoleId, defaultRoleId] = await Promise.all([
      roleService.getConfig("anonymous_role_id"),
      roleService.getConfig("default_role_id"),
    ]);
    return {
      status: 200,
      body: {
        anonymousRoleId: anonymousRoleId ?? null,
        defaultRoleId: defaultRoleId ?? null,
      },
    };
  }),
);

adminRouter.put(
  "/config",
  requirePermission("admin:config"),
  apiHandler<
    EmptyObject,
    EmptyObject,
    { anonymousRoleId?: string; defaultRoleId?: string }
  >(async ({ diContainer, body }) => {
    const roleService = diContainer.get<RoleService>(services.roleService);
    if (body.anonymousRoleId !== undefined) {
      await roleService.setConfig("anonymous_role_id", body.anonymousRoleId);
    }
    if (body.defaultRoleId !== undefined) {
      await roleService.setConfig("default_role_id", body.defaultRoleId);
    }
    return { status: 204, body: {} };
  }),
);
