import { test as base, expect, type APIRequestContext, type BrowserContext } from '@playwright/test';

const headerName = 'x-vercel-protection-bypass';

// Never put the automation credential on a browser context: it also loads third-party URLs.
export async function protectBrowserContext(context: BrowserContext, baseURL: string | undefined, secret: string | undefined) {
    if (secret) {
      if (!baseURL || new URL(baseURL).protocol !== 'https:') throw new Error('Protected staging requires an HTTPS baseURL');
      const origin = new URL(baseURL).origin;
      await context.route('**/*', async route => {
        if (new URL(route.request().url()).origin !== origin) return route.continue();
        // Do not forward the header along redirects. The browser follows Location
        // itself, allowing the destination to pass through the origin check again.
        const response = await route.fetch({
          headers: { ...route.request().headers(), [headerName]: secret }, maxRedirects: 0,
        });
        await route.fulfill({ response });
      });
    }
}
export function protectApiRequest(request: APIRequestContext, baseURL: string | undefined, secret: string | undefined): APIRequestContext {
    if (!secret) return request;
    if (!baseURL || new URL(baseURL).protocol !== 'https:') throw new Error('Protected staging requires an HTTPS baseURL');
    const origin = new URL(baseURL).origin;
    const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'fetch']);
    const scoped = new Proxy(request, {
      get(target, property) {
        const value = Reflect.get(target, property);
        if (typeof value !== 'function') return value;
        if (!methods.has(String(property))) return value.bind(target);
        return (url: string, options: Record<string, unknown> = {}) => {
          if (typeof url !== 'string' || new URL(url, baseURL).origin !== origin) {
            throw new Error('Protected staging API request must stay on the configured origin');
          }
          return value.call(target, url, {
            ...options, maxRedirects: 0,
            headers: { ...(options.headers as Record<string, string>), [headerName]: secret },
          });
        };
      },
    }) as APIRequestContext;
    return scoped;
}
export const test = base.extend({
  context: async ({ context, baseURL }, provide) => {
    await protectBrowserContext(context, baseURL, process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
    await provide(context);
  },
  request: async ({ request, baseURL }, provide) => {
    await provide(protectApiRequest(request, baseURL, process.env.VERCEL_AUTOMATION_BYPASS_SECRET));
  },
});
export { expect };
