export interface ApiEnv {
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  smsCodeTtlSeconds: number;
  smsCodeCooldownSeconds: number;
  storageEndpoint: string;
  storageRegion: string;
  storageAccessKey: string;
  storageSecretKey: string;
  storageBucket: string;
  storageForcePathStyle: boolean;
  storagePresignExpiresInSeconds: number;
  corsOrigins: string[];
}

function requireEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseCsv(value: string | undefined, fallback: string): string[] {
  return (value ?? fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
    storageEndpoint: requireEnv("STORAGE_ENDPOINT", "http://127.0.0.1:9000"),
    storageRegion: requireEnv("STORAGE_REGION", "us-east-1"),
    storageAccessKey: requireEnv("STORAGE_ACCESS_KEY", "minioadmin"),
    storageSecretKey: requireEnv("STORAGE_SECRET_KEY", "minioadmin"),
    storageBucket: requireEnv("STORAGE_BUCKET", "tenio-dev"),
    storageForcePathStyle: (process.env.STORAGE_FORCE_PATH_STYLE ?? "true") === "true",
    storagePresignExpiresInSeconds: Number(
      process.env.STORAGE_PRESIGN_EXPIRES_IN_SECONDS ?? 900,
    ),
    corsOrigins: parseCsv(
      process.env.CORS_ORIGINS,
      "http://localhost:8080,http://127.0.0.1:8080",
    ),
  };
}
