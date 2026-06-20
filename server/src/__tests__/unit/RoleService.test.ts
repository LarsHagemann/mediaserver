import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoleService } from "../../auth/RoleService.js";
import type { RoleRepository, Role } from "../../auth/RoleRepository.js";
import type { PermissionVersionService } from "../../auth/PermissionVersionService.js";
import type { Identity, Action } from "../../auth/Identity.js";

const makeRole = (overrides: Partial<Role> = {}): Role => ({
  id: "role-1",
  name: "editor",
  description: undefined,
  isSystem: false,
  createdAt: new Date("2025-01-01"),
  ...overrides,
});

const makeIdentity = (permissions: Action[]): Identity =>
  ({
    userId: "user-1",
    isAuthenticated: true,
    permissions,
    hasPermission: (p: Action) => permissions.includes(p),
  }) as Identity;

const makeRoleRepository = (): RoleRepository =>
  ({
    findById: vi.fn(),
    addPolicy: vi.fn(),
    removePolicy: vi.fn(),
    delete: vi.fn(),
    setConfig: vi.fn(),
  }) as unknown as RoleRepository;

const makePermissionVersion = (): PermissionVersionService =>
  ({
    bump: vi.fn(),
    getVersion: vi.fn(),
  }) as unknown as PermissionVersionService;

describe("RoleService", () => {
  let roleRepository: ReturnType<typeof makeRoleRepository>;
  let permissionVersion: ReturnType<typeof makePermissionVersion>;
  let roleService: RoleService;

  beforeEach(() => {
    roleRepository = makeRoleRepository();
    permissionVersion = makePermissionVersion();
    roleService = new RoleService(roleRepository, permissionVersion);
    vi.mocked(roleRepository.findById).mockResolvedValue(makeRole());
  });

  describe("addPolicy", () => {
    it("lets an admin grant a permission they hold and bumps the version", async () => {
      const identity = makeIdentity(["admin:roles", "document:read"]);

      await roleService.addPolicy("role-1", "document:read", identity);

      expect(roleRepository.addPolicy).toHaveBeenCalledWith(
        "role-1",
        "document:read",
      );
      expect(permissionVersion.bump).toHaveBeenCalledTimes(1);
    });

    it("prevents granting a permission the actor does not have (no escalation)", async () => {
      const identity = makeIdentity(["admin:roles"]); // lacks admin:users

      await expect(
        roleService.addPolicy("role-1", "admin:users", identity),
      ).rejects.toMatchObject({ name: "Forbidden", status: 403 });

      expect(roleRepository.addPolicy).not.toHaveBeenCalled();
      expect(permissionVersion.bump).not.toHaveBeenCalled();
    });

    it("rejects unknown actions", async () => {
      const identity = makeIdentity(["admin:roles"]);

      await expect(
        roleService.addPolicy(
          "role-1",
          "not-a-real-action" as Action,
          identity,
        ),
      ).rejects.toMatchObject({ status: 400 });

      expect(roleRepository.addPolicy).not.toHaveBeenCalled();
    });
  });

  describe("version bumping", () => {
    it("bumps on removePolicy", async () => {
      await roleService.removePolicy("role-1", "document:read");
      expect(permissionVersion.bump).toHaveBeenCalledTimes(1);
    });

    it("bumps on deleteRole", async () => {
      await roleService.deleteRole("role-1");
      expect(permissionVersion.bump).toHaveBeenCalledTimes(1);
    });

    it("bumps on setConfig", async () => {
      await roleService.setConfig("anonymous_role_id", "role-2");
      expect(permissionVersion.bump).toHaveBeenCalledTimes(1);
    });
  });
});
