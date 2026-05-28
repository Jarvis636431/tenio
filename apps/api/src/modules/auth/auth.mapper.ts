import type { User, UserRole } from "@prisma/client";
import type { AuthUser, SetupProfileResponse } from "@tenio/shared";

function mapRoleName(role: UserRole) {
  return role === "ADMIN" ? "管理员" : "成员";
}

function buildAvatarText(value: string) {
  return value.slice(0, 1).toUpperCase();
}

export function toAuthUser(user: User): AuthUser {
  const username = user.username ?? user.account;
  const displayName = user.displayName ?? username;

  return {
    id: user.id,
    username,
    display_name: displayName,
    role: user.role.toLowerCase(),
    role_name: mapRoleName(user.role),
    avatar_text: buildAvatarText(displayName),
    account: user.account,
    is_profile_completed: user.isProfileCompleted,
  };
}

export function toSetupProfileResponse(user: User): SetupProfileResponse {
  return {
    id: user.id,
    username: user.username ?? user.account,
    account: user.account,
    is_profile_completed: user.isProfileCompleted,
  };
}
