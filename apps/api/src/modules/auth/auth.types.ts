import type { UserRole } from "@prisma/client";

export interface AuthenticatedRequestUser {
  id: string;
  account: string;
  phone: string | null;
  role: UserRole;
}

export interface AccessTokenPayload {
  sub: string;
  account: string;
  role: UserRole;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: "refresh";
}
