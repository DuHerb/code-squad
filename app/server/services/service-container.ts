import 'server-only';
import type { IChallengeRepository, IProgressRepository } from '../repositories/interfaces';
import { InMemoryChallengeRepository } from '../repositories/challenges.repository';
import { inMemoryProgressRepository } from '../repositories/in-memory.progress.repository';
import { CodeValidationService } from './code-validation.service';
import { CodeCompilationService } from './code-compilation.service';
import { CodeExecutionService } from './code-execution.service';
import { ChallengeExecutionService } from './challenge-execution.service';

/**
 * Service container for dependency injection
 */
export class ServiceContainer {
  private static instance: ServiceContainer;

  private _challengeRepository: IChallengeRepository;
  private _progressRepository: IProgressRepository;
  private _validationService: CodeValidationService;
  private _compilationService: CodeCompilationService;
  private _executionService: CodeExecutionService;
  private _challengeExecutionService: ChallengeExecutionService;

  private constructor() {
    // Initialize repositories
    this._challengeRepository = new InMemoryChallengeRepository();
    this._progressRepository = inMemoryProgressRepository;

    // Initialize services
    this._validationService = new CodeValidationService();
    this._compilationService = new CodeCompilationService();
    this._executionService = new CodeExecutionService();
    this._challengeExecutionService = new ChallengeExecutionService(
      this._validationService,
      this._compilationService,
      this._executionService
    );
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  get challengeRepository(): IChallengeRepository {
    return this._challengeRepository;
  }

  get progressRepository(): IProgressRepository {
    return this._progressRepository;
  }

  get validationService(): CodeValidationService {
    return this._validationService;
  }

  get compilationService(): CodeCompilationService {
    return this._compilationService;
  }

  get executionService(): CodeExecutionService {
    return this._executionService;
  }

  get challengeExecutionService(): ChallengeExecutionService {
    return this._challengeExecutionService;
  }

  // Method to override dependencies for testing
  public override<K extends keyof this>(
    key: K,
    value: this[K]
  ): void {
    this[key] = value;
  }
}

// Export singleton instance
export const serviceContainer = ServiceContainer.getInstance();