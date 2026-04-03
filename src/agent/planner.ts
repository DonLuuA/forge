import { Message } from '../types/index.js';

export interface PlanStep {
  id: number;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export class Planner {
  private plan: PlanStep[] = [];

  createPlan(steps: string[]) {
    this.plan = steps.map((step, index) => ({
      id: index + 1,
      description: step,
      status: 'pending',
    }));
  }

  updateStepStatus(id: number, status: PlanStep['status']) {
    const step = this.plan.find(s => s.id === id);
    if (step) {
      step.status = status;
    }
  }

  getPlan(): PlanStep[] {
    return this.plan;
  }

  renderPlan(): string {
    return this.plan.map(s => {
      const icon = s.status === 'completed' ? '✅' : s.status === 'in-progress' ? '⏳' : s.status === 'failed' ? '❌' : '⚪';
      return `${icon} ${s.id}. ${s.description}`;
    }).join('\n');
  }
}
