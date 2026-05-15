export interface ApiEnv {
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  smsCodeTtlSeconds: number;
  smsCodeCooldownSeconds: number;
}

function requireEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getApiEnv(): ApiEnv {
  return {
    port: Number(process.env.PORT ?? 3001),
    databaseUrl: requireEnv("DATABASE_URL"),
    jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET", "dev-access-secret"),
    jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET", "dev-refresh-secret"),
    jwtAccessExpiresIn: requireEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
    jwtRefreshExpiresIn: requireEnv("JWT_REFRESH_EXPIRES_IN", "30d"),
    smsCodeTtlSeconds: Number(process.env.SMS_CODE_TTL_SECONDS ?? 300),
    smsCodeCooldownSeconds: Number(process.env.SMS_CODE_COOLDOWN_SECONDS ?? 60),
  };
}
