/**
 * Defines errors emitted from the accelerator
 */
export class AcceleratorError extends Error {
  constructor(errorMessage: string, errorName: string, stack?: string) {
    super(`accVideo: ${errorMessage}`);
    this.name = errorName;
    this.stack = stack;
  }
}
