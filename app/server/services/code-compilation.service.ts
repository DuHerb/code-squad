import 'server-only';

/**
 * Service responsible for compiling and validating JavaScript code
 */
export class CodeCompilationService {
  /**
   * Validates that code can be compiled without syntax errors
   */
  async validateCompilation(userCode: string): Promise<void> {
    const ivm = (await import('isolated-vm')).default;
    let isolate: any | null = null;
    try {
      isolate = new ivm.Isolate({ memoryLimit: 8 });
      await isolate.compileScript(userCode);
    } catch (compileError: any) {
      throw new Error(`Compilation Error: ${compileError.message}`);
    } finally {
      isolate?.dispose();
    }
  }

  /**
   * Compiles code in an isolated context
   */
  async compileInContext(userCode: string): Promise<any> {
    const ivm = (await import('isolated-vm')).default;
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    try {
      return await isolate.compileScript(userCode);
    } catch (error) {
      isolate.dispose();
      throw error;
    }
  }
}