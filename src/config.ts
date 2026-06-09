import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 8000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",

  // JWT
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? "access-secret",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET ?? "refresh-secret",
  maxAgeAccessToken: process.env.MAX_AGE_ACCESS_TOKEN ?? "1d",
  maxAgeRefreshToken: process.env.MAX_AGE_REFRESH_TOKEN ?? "1d",

  // Genesis seed
  seedGenesisUsername: process.env.SEED_GENESIS_USERNAME ?? "SUPER",
  seedGenesisDisplayName: process.env.SEED_GENESIS_DISPLAY_NAME ?? "Super Admin",
  seedGenesisPassword: process.env.SEED_GENESIS_PASSWORD ?? "genesis123",

  // CORS
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET ?? "idomain_unsigned",
};
