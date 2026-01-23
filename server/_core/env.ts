export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "agKJdfdgjklsjkgsfgjaslkdslaksdljf",
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://mynumperphon_user:IAuuflz6GSsbXNW5SJ17dHSv5dj4R7DQ@dpg-d567geumcj7s73fo109g-a.singapore-postgres.render.com/mynumperphon?sslmode=require",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://learning-5wrv.onrender.com",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Storage Configuration
  storageType: process.env.STORAGE_TYPE ?? "",
  uploadDir: process.env.UPLOAD_DIR ?? "",
  
  // Cloudinary Configuration (optional)
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
};
