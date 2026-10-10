/** Server-side deployment boundary. NODE_ENV=production also means preview builds. */
export function isProductionDeployment(env: Partial<NodeJS.ProcessEnv> = process.env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV === 'production';
  return env.MBR_RUNTIME_ENV === 'production';
}
