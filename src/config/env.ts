
interface AppConfig {
  apiUrl: string;
  isDev: boolean;
  isProd: boolean;
  cloudFrontUrl: string;
}

const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  cloudFrontUrl: import.meta.env.VITE_CLOUDFRONT_URL,
  frontendUrl: import.meta.env.VITE_FRONTEND_URL
} as const;

export default config;