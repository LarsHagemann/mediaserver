import { ApiError } from "../common/ApiError.js";
import type { Role, RoleRepository } from "./RoleRepository.js";
import { ALL_ACTIONS, type Action, type Identity } from "./Identity.js";
import type { PermissionVersionService } from "./PermissionVersionService.js";

export type RoleWithPolicies = Role & { policies: Action[] };

export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionVersion: PermissionVersionService,
  ) {}

  async listRoles(): Promise<RoleWithPolicies[]> {
    const roles = await this.roleRepository.findAll();
    return Promise.all(
      roles.map(async (role) => ({
        ...role,
        policies: await this.roleRepository.getPolicies(role.id),
      })),
    );
  }

  async getRole(id: string): Promise<RoleWithPolicies> {
    const role = await this.roleRepository.findById(id);
    if (!role) throw new ApiError("NotFound", 404, `Role ${id} not found`);
    const policies = await this.roleRepository.getPolicies(id);
    return { ...role, policies };
  }

  async createRole(
    name: string,
    description: string | undefined,
  ): Promise<RoleWithPolicies> {
    const role = await this.roleRepository.create(name, description);
    return { ...role, policies: [] };
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.roleRepository.findById(id);
    if (!role) throw new ApiError("NotFound", 404, `Role ${id} not found`);
    if (role.isSystem)
      throw new ApiError("Forbidden", 403, "System roles cannot be deleted");
    await this.roleRepository.delete(id);
    // Users that had this role lose its permissions.
    await this.permissionVersion.bump();
  }

  async addPolicy(
    roleId: string,
    action: Action,
    actingIdentity: Identity,
  ): Promise<void> {
    if (!ALL_ACTIONS.includes(action)) {
      throw new ApiError("BadRequest", 400, `Unknown action: ${action}`);
    }
    // Prevent privilege escalation: a user managing roles cannot grant a
    // permission they do not themselves hold.
    if (!actingIdentity.hasPermission(action)) {
      throw new ApiError(
        "Forbidden",
        403,
        `You cannot grant a permission you do not have: ${action}`,
      );
    }
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new ApiError("NotFound", 404, `Role ${roleId} not found`);
    await this.roleRepository.addPolicy(roleId, action);
    await this.permissionVersion.bump();
  }

  async removePolicy(roleId: string, action: Action): Promise<void> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new ApiError("NotFound", 404, `Role ${roleId} not found`);
    await this.roleRepository.removePolicy(roleId, action);
    await this.permissionVersion.bump();
  }

  async getConfig(key: string): Promise<string | undefined> {
    return this.roleRepository.getConfig(key);
  }

  async setConfig(key: string, value: string): Promise<void> {
    await this.roleRepository.setConfig(key, value);
    // anonymous_role_id / default_role_id changes affect resolved permissions.
    await this.permissionVersion.bump();
  }
}
