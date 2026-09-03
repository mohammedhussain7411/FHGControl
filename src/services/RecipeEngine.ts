import type { Recipe } from '../types/reactor';
import type { IReactorController } from './IReactorController';
import { auditLogger } from './AuditLogger';

export class RecipeEngine {
  private recipes: Recipe[] = [
    {
      id: 'REC-001',
      name: 'SYNTHESIS_001 (Exothermic Reflux)',
      version: 1,
      author: 'Dr. Hussain',
      description: 'Standard 4-step organic reaction synthesis recipe with reagent addition prompt.',
      targetReactorIds: [1],
      createdDate: '2026-09-01',
      modifiedDate: '2026-09-03',
      steps: [
        {
          id: 's1',
          stepNumber: 1,
          name: 'Pre-heating & Dissolution',
          targetTemp: 60.0,
          overheadRPM: 0,
          magneticRPM: 500,
          heating: true,
          cooling: false,
          durationSeconds: 30, // 30 sec for demo
          waitCondition: 'TEMP_REACHED',
        },
        {
          id: 's2',
          stepNumber: 2,
          name: 'High Temp Reaction & Overhead Stir',
          targetTemp: 80.0,
          overheadRPM: 350,
          magneticRPM: 600,
          heating: true,
          cooling: false,
          durationSeconds: 60,
          waitCondition: 'TIME',
        },
        {
          id: 's3',
          stepNumber: 3,
          name: 'Reagent Addition (Semi-Auto Pause)',
          targetTemp: 80.0,
          overheadRPM: 200,
          magneticRPM: 400,
          heating: true,
          cooling: false,
          durationSeconds: 0,
          waitCondition: 'OPERATOR_CONFIRM',
          operatorPrompt: 'Please add 25 mL Catalyst Solution X to Reactor 1 vessel port B.',
        },
        {
          id: 's4',
          stepNumber: 4,
          name: 'Controlled Cooling & Quench',
          targetTemp: 20.0,
          overheadRPM: 150,
          magneticRPM: 300,
          heating: false,
          cooling: true,
          durationSeconds: 45,
          waitCondition: 'TEMP_REACHED',
        }
      ]
    },
    {
      id: 'REC-002',
      name: 'CRYSTALLIZATION_FAST (Parallel 4-Reactor)',
      version: 2,
      author: 'Process Eng',
      description: 'Crystallization thermal ramp across all 4 reactors simultaneously.',
      targetReactorIds: [1, 2, 3, 4],
      createdDate: '2026-09-02',
      modifiedDate: '2026-09-03',
      steps: [
        {
          id: 'c1',
          stepNumber: 1,
          name: 'Homogenization 50°C',
          targetTemp: 50.0,
          overheadRPM: 400,
          magneticRPM: 600,
          heating: true,
          cooling: false,
          durationSeconds: 40,
          waitCondition: 'TEMP_REACHED'
        },
        {
          id: 'c2',
          stepNumber: 2,
          name: 'Cooling to 15°C',
          targetTemp: 15.0,
          overheadRPM: 200,
          magneticRPM: 300,
          heating: false,
          cooling: true,
          durationSeconds: 60,
          waitCondition: 'TIME'
        }
      ]
    }
  ];

  private activeRecipe: Recipe | null = null;
  private currentStepIdx: number = 0;
  private isRunning: boolean = false;
  private isPausedForOperator: boolean = false;
  private operatorPromptMessage: string = '';
  private stepTimer: number = 0;
  private intervalId: number | null = null;
  private subscribers: ((status: {
    isRunning: boolean;
    activeRecipe: Recipe | null;
    currentStepIdx: number;
    stepTimer: number;
    isPausedForOperator: boolean;
    operatorPromptMessage: string;
  }) => void)[] = [];

  public getRecipes(): Recipe[] {
    return this.recipes;
  }

  public saveRecipe(recipe: Recipe): void {
    const idx = this.recipes.findIndex(r => r.id === recipe.id);
    if (idx >= 0) {
      this.recipes[idx] = recipe;
    } else {
      this.recipes.push(recipe);
    }
    auditLogger.logAction('Operator', 'OPERATOR', 'Recipe Saved', `Saved recipe "${recipe.name}"`);
  }

  public deleteRecipe(id: string): void {
    this.recipes = this.recipes.filter(r => r.id !== id);
  }

  public startRecipe(recipeId: string, controller: IReactorController, operator: string = 'Operator'): boolean {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe || this.isRunning) return false;

    this.activeRecipe = recipe;
    this.currentStepIdx = 0;
    this.isRunning = true;
    this.isPausedForOperator = false;
    this.operatorPromptMessage = '';
    this.stepTimer = 0;

    auditLogger.logAction(operator, 'OPERATOR', 'Recipe Started', `Started recipe "${recipe.name}" on reactors [${recipe.targetReactorIds.join(', ')}]`);

    this.applyCurrentStep(controller);
    this.startExecutionLoop(controller, operator);
    this.notifySubscribers();
    return true;
  }

  public confirmOperatorStep(controller: IReactorController, operator: string = 'Operator'): void {
    if (!this.isPausedForOperator) return;

    this.isPausedForOperator = false;
    this.operatorPromptMessage = '';
    auditLogger.logAction(operator, 'OPERATOR', 'Semi-Auto Step Confirmed', `Confirmed operator action for step ${this.currentStepIdx + 1}`);

    this.advanceStep(controller, operator);
  }

  public stopRecipe(controller: IReactorController, operator: string = 'Operator'): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.activeRecipe) {
      this.activeRecipe.targetReactorIds.forEach(rId => {
        controller.stopHeating(rId);
        controller.stopCooling(rId);
      });
    }

    auditLogger.logAction(operator, 'OPERATOR', 'Recipe Aborted', `Stopped active recipe execution`);

    this.activeRecipe = null;
    this.notifySubscribers();
  }

  public subscribe(callback: (status: {
    isRunning: boolean;
    activeRecipe: Recipe | null;
    currentStepIdx: number;
    stepTimer: number;
    isPausedForOperator: boolean;
    operatorPromptMessage: string;
  }) => void): () => void {
    this.subscribers.push(callback);
    this.notifySubscribers();
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private applyCurrentStep(controller: IReactorController): void {
    if (!this.activeRecipe || this.currentStepIdx >= this.activeRecipe.steps.length) return;

    const step = this.activeRecipe.steps[this.currentStepIdx];
    this.stepTimer = 0;

    this.activeRecipe.targetReactorIds.forEach(rId => {
      controller.setTargetTemperature(rId, step.targetTemp);
      controller.setOverheadSpeed(rId, step.overheadRPM);
      controller.setMagneticSpeed(rId, step.magneticRPM);

      if (step.heating) {
        controller.startHeating(rId);
      } else {
        controller.stopHeating(rId);
      }

      if (step.cooling) {
        controller.startCooling(rId);
      } else {
        controller.stopCooling(rId);
      }

      if (step.overheadRPM > 0) {
        controller.startOverheadStirrer(rId);
      } else {
        controller.stopOverheadStirrer(rId);
      }

      if (step.magneticRPM > 0) {
        controller.startMagneticStirrer(rId);
      } else {
        controller.stopMagneticStirrer(rId);
      }
    });

    if (step.waitCondition === 'OPERATOR_CONFIRM') {
      this.isPausedForOperator = true;
      this.operatorPromptMessage = step.operatorPrompt || 'Operator intervention required. Click confirm when ready.';
    }
  }

  private startExecutionLoop(controller: IReactorController, operator: string): void {
    if (this.intervalId) window.clearInterval(this.intervalId);

    this.intervalId = window.setInterval(() => {
      if (!this.isRunning || !this.activeRecipe) return;
      if (this.isPausedForOperator) return; // Wait for user button click

      this.stepTimer++;
      const currentStep = this.activeRecipe.steps[this.currentStepIdx];
      const reactorStates = controller.getReactorStates();

      let stepComplete = false;

      if (currentStep.waitCondition === 'TIME') {
        if (this.stepTimer >= currentStep.durationSeconds) {
          stepComplete = true;
        }
      } else if (currentStep.waitCondition === 'TEMP_REACHED') {
        // Check if target reactor(s) reached temperature within ±1.5°C
        const allReached = this.activeRecipe.targetReactorIds.every(rId => {
          const st = reactorStates.find(r => r.id === rId);
          if (!st) return false;
          return Math.abs(st.currentTemp - currentStep.targetTemp) <= 1.5;
        });

        if (allReached) {
          // Now wait for duration seconds at temperature
          if (this.stepTimer >= currentStep.durationSeconds) {
            stepComplete = true;
          }
        }
      } else if (currentStep.waitCondition === 'NONE') {
        stepComplete = true;
      }

      if (stepComplete) {
        this.advanceStep(controller, operator);
      }

      this.notifySubscribers();
    }, 1000);
  }

  private advanceStep(controller: IReactorController, operator: string): void {
    if (!this.activeRecipe) return;

    this.currentStepIdx++;
    if (this.currentStepIdx >= this.activeRecipe.steps.length) {
      // Recipe Complete!
      this.isRunning = false;
      if (this.intervalId) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
      }

      auditLogger.logAction(operator, 'OPERATOR', 'Recipe Complete', `Recipe "${this.activeRecipe.name}" finished successfully!`);
      this.activeRecipe = null;
    } else {
      // Load next step
      this.applyCurrentStep(controller);
    }
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    const status = {
      isRunning: this.isRunning,
      activeRecipe: this.activeRecipe,
      currentStepIdx: this.currentStepIdx,
      stepTimer: this.stepTimer,
      isPausedForOperator: this.isPausedForOperator,
      operatorPromptMessage: this.operatorPromptMessage,
    };
    this.subscribers.forEach(cb => cb(status));
  }
}

export const recipeEngine = new RecipeEngine();
