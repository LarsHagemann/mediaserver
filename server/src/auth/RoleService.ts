import { ApiError } from "../common/ApiError.js";
import type { Role, RoleRepository } from "./RoleRepository.js";
import { ALL_ACTIONS, type Action } from "./Identity.js";

export type RoleWithPolicies = Role & { policies: Action[] };

export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

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

  async createRole(name: string, description: string | undefined): Promise<RoleWithPolicies> {
    const role = await this.roleRepository.create(name, description);
    return { ...role, policies: [] };
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.roleRepository.findById(id);
    if (!role) throw new ApiError("NotFound", 404, `Role ${id} not found`);
    if (role.isSystem) throw new ApiError("Forbidden", 403, "System roles cannot be deleted");
    await this.roleRepository.delete(id);
  }

  async addPolicy(roleId: string, action: Action): Promise<void> {
    if (!ALL_ACTIONS.includes(action)) {
      throw new ApiError("BadRequest", 400, `Unknown action: ${action}`);
    }
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new ApiError("NotFound", 404, `Role ${roleId} not found`);
    await this.roleRepository.addPolicy(roleId, action);
  }

  async removePolicy(roleId: string, action: Action): Promise<void> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new ApiError("NotFound", 404, `Role ${roleId} not found`);
    await this.roleRepository.removePolicy(roleId, action);
  }

  async getConfig(key: string): Promise<string | undefined> {
    return this.roleRepository.getConfig(key);
  }

  async setConfig(key: string, value: string): Promise<void> {
    await this.roleRepository.setConfig(key, value);
  }
}
