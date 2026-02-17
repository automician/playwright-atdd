export interface StepFn {
  (): Promise<undefined>
  <T>(body: () => T | Promise<T>): Promise<T>
  <T>(title: string, body: () => T | Promise<T>): Promise<T>
  <T>(value: T): Promise<T>
  <T>(title: string, value: T): Promise<T>
}
