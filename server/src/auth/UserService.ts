import { ApiError } from "../common/ApiError.js";
import type { UserRepository, User } from "./UserRepository.js";
import type { RoleRepository, Role } from "./RoleRepository.js";

export type UserWithRoles = User & { roles: Role[] };

export type LoginContext = {
  externalId: string;
  email: string | undefined;
  name: string | undefined;
  adminUserIds: string[];
  defaultRoleId: string | undefined;
  adminRole: Role | undefined;
};

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async listUsers(): Promise<UserWithRoles[]> {
    const users = await this.userRepository.findAll();
    return Promise.all(users.map((u) => this.withRoles(u)));
  }

  async getUser(id: string): Promise<UserWithRoles> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new ApiError("NotFound", 404, `User ${id} not found`);
    return this.withRoles(user);
  }

  async setUserRoles(userId: string, roleIds: string[]): Promise<UserWithRoles> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new ApiError("NotFound", 404, `User ${userId} not found`);

    for (const roleId of roleIds) {
      const role = await this.roleRepository.findById(roleId);
      if (!role) throw new ApiError("NotFound", 404, `Role ${roleId} not found`);
    }

    await this.userRepository.setRoles(userId, roleIds);
    return this.withRoles(user);
  }

  async loginOrRegister(ctx: LoginContext): Promise<User> {
    const user = await this.userRepository.upsert(ctx.externalId, ctx.email, ctx.name);
    const hasRoles = await this.userRepository.hasAnyRoles(user.id);

    if (!hasRoles) {
      if (ctx.adminRole && ctx.adminUserIds.includes(ctx.externalId)) {
        await this.userRepository.addRole(user.id, ctx.adminRole.id);
      } else if (ctx.defaultRoleId) {
        await this.userRepository.addRole(user.id, ctx.defaultRoleId);
      }
    }

    return user;
  }

  private async withRoles(user: User): Promise<UserWithRoles> {
    const roleIds = await this.userRepository.getRoleIds(user.id);
    const roles = (await Promise.all(roleIds.map((id) => this.roleRepository.findById(id))))
      .filter((r): r is Role => r !== undefined);
    return { ...user, roles };
  }
}
