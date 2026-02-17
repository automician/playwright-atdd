export {}

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T = unknown> {
      toHaveStatus(
        expected: number | string | { code: number; text: string },
      ): Promise<R>
      toHaveJsonFields(expectedSample: Record<string, unknown>): Promise<R>
      toHaveCountGreaterThanOrEqual(
        expected: number,
        options?: { timeout?: number },
      ): Promise<R>
    }
  }
}
