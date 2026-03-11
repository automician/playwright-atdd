import * as playwright from '@playwright/test'
import { withSteps } from './reporting/steps.proxy.js'
import { config } from '../../../project.config.js'

export default withSteps({
  /**
   * @param {{
   *   baseURL?: string;
   *   clientCertificates?: Array<{
   *       origin: string;
   *       certPath?: string;
   *       keyPath?: string;
   *       pfxPath?: string;
   *       passphrase?: string;
   *   }>;
   *   extraHTTPHeaders?: {
   *       [key: string]: string;
   *   };
   *   httpCredentials?: {
   *       username: string;
   *       password: string;
   *       origin?: string;
   *       send?: "unauthorized" | "always";
   *   };
   *   ignoreHTTPSErrors?: boolean;
   *   proxy?: {
   *       server: string;
   *       bypass?: string;
   *       username?: string;
   *       password?: string;
   *   };
   *   storageState?: string | {
   *       cookies: Array<{
   *           name: string;
   *           value: string;
   *           domain: string;
   *           path: string;
   *           expires: number;
   *           httpOnly: boolean;
   *           secure: boolean;
   *           sameSite: "Strict" | "Lax" | "None";
   *       }>;
   *       origins: Array<{
   *           origin: string;
   *           localStorage: Array<{
   *               name: string;
   *               value: string;
   *           }>;
   *       }>;
   *   };
   *   timeout?: number;
   *   userAgent?: string;
   * }} options
   * @returns {Promise<import('@playwright/test').APIRequestContext>}
   */
  async newContext(options = {}) {
    return playwright.request.newContext({
      ...options,
      // can be set playwrigth.config.ts among `use` section,
      // but in case it's used for web UI app testing,
      // then for web API testing we have an alternative way to reuse baseURL ↙
      // TODO: consider refactoring to "optionally requirable from config if it's provided"
      baseURL: options?.baseURL ?? config.apiBaseURL,
      // can be set playwrigth.config.ts among `use` section,
      // but as example of how to use here ↙️
      extraHTTPHeaders: {
        // 'some-special-headeer': 'true',
        ...options?.extraHTTPHeaders,
      },
    })
  },

  toString() {
    return 'request'
  },
})
