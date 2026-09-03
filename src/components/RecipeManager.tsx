import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  Plus, 
  Trash2, 
  CheckCircle, 
  PauseCircle,
  FileCode,
  UserCheck
} from 'lucide-react';
import type { Recipe, RecipeStep } from '../types/reactor';
import { recipeEngine } from '../services/RecipeEngine';
import type { IReactorController } from '../services/IReactorController';

interface RecipeManagerProps {
  controller: IReactorController;
}

export const RecipeManager: React.FC<RecipeManagerProps> = ({ controller }) => {
  const [recipes, setRecipes] = useState<Recipe[]>(recipeEngine.getRecipes());
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(recipes[0] || null);

  const [engineStatus, setEngineStatus] = useState({
    isRunning: false,
    activeRecipe: null as Recipe | null,
    currentStepIdx: 0,
    stepTimer: 0,
    isPausedForOperator: false,
    operatorPromptMessage: '',
  });

  useEffect(() => {
    const unsub = recipeEngine.subscribe(status => {
      setEngineStatus(status);
    });
    return unsub;
  }, []);

  const handleStartRecipe = (recipeId: string) => {
    recipeEngine.startRecipe(recipeId, controller);
  };

  const handleStopRecipe = () => {
    recipeEngine.stopRecipe(controller);
  };

  const handleConfirmOperator = () => {
    recipeEngine.confirmOperatorStep(controller);
  };

  const handleAddStep = () => {
    if (!selectedRecipe) return;
    const newStep: RecipeStep = {
      id: `step-${Date.now()}`,
      stepNumber: selectedRecipe.steps.length + 1,
      name: `Step ${selectedRecipe.steps.length + 1}`,
      targetTemp: 60,
      overheadRPM: 300,
      magneticRPM: 500,
      heating: true,
      cooling: false,
      durationSeconds: 60,
      waitCondition: 'TIME',
    };
    const updated = {
      ...selectedRecipe,
      steps: [...selectedRecipe.steps, newStep]
    };
    setSelectedRecipe(updated);
    recipeEngine.saveRecipe(updated);
    setRecipes(recipeEngine.getRecipes());
  };

  const handleDeleteStep = (stepId: string) => {
    if (!selectedRecipe) return;
    const updated = {
      ...selectedRecipe,
      steps: selectedRecipe.steps.filter(s => s.id !== stepId).map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
    };
    setSelectedRecipe(updated);
    recipeEngine.saveRecipe(updated);
    setRecipes(recipeEngine.getRecipes());
  };

  const handleUpdateStep = (stepId: string, field: keyof RecipeStep, value: any) => {
    if (!selectedRecipe) return;
    const updatedSteps = selectedRecipe.steps.map(s => {
      if (s.id === stepId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    const updated = { ...selectedRecipe, steps: updatedSteps };
    setSelectedRecipe(updated);
    recipeEngine.saveRecipe(updated);
    setRecipes(recipeEngine.getRecipes());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Semi-Automatic Intervention Dialog Banner */}
      {engineStatus.isPausedForOperator && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 0 25px rgba(245, 158, 11, 0.3)',
          animation: 'pulse-glow 1.5s infinite alternate'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: '#f59e0b', color: '#ffffff', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SEMI-AUTOMATIC MODE — OPERATOR INTERVENTION REQUIRED
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
                {engineStatus.operatorPromptMessage}
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmOperator}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '12px 24px', fontSize: '1rem' }}
          >
            <CheckCircle size={20} /> CONFIRM ADDITION & CONTINUE
          </button>
        </div>
      )}

      {/* Main Grid: Left Recipe Selector & Right Recipe Builder/Runner */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        
        {/* Recipe Library Column */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={18} color="#38bdf8" /> RECIPE LIBRARY
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recipes.map(r => {
              const isSelected = selectedRecipe?.id === r.id;
              const isRunningThis = engineStatus.activeRecipe?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecipe(r)}
                  className="glass-panel glass-panel-hover"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    borderColor: isSelected ? '#38bdf8' : 'var(--border-glass)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{r.name}</span>
                    {isRunningThis && (
                      <span className="led-indicator pulse" style={{ color: '#10b981' }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {r.steps.length} Steps • Target R[{r.targetReactorIds.join(',')}]
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recipe Builder & Run Monitor Column */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedRecipe ? (
            <>
              {/* Recipe Top Header & Control Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedRecipe.name}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {selectedRecipe.description} • Author: {selectedRecipe.author}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {engineStatus.isRunning && engineStatus.activeRecipe?.id === selectedRecipe.id ? (
                    <button
                      onClick={handleStopRecipe}
                      className="btn-danger"
                    >
                      <PauseCircle size={18} /> ABORT RECIPE
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartRecipe(selectedRecipe.id)}
                      className="btn-primary"
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    >
                      <PlayCircle size={18} /> RUN AUTOMATIC RECIPE
                    </button>
                  )}
                </div>
              </div>

              {/* Active Execution Monitor Progress Flow */}
              {engineStatus.isRunning && engineStatus.activeRecipe?.id === selectedRecipe.id && (
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px', padding: '16px', border: '1px solid #38bdf8' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
                    RECIPE EXECUTION IN PROGRESS — STEP {engineStatus.currentStepIdx + 1} OF {selectedRecipe.steps.length}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {selectedRecipe.steps.map((st, idx) => {
                      const isCurrent = engineStatus.currentStepIdx === idx;
                      const isDone = engineStatus.currentStepIdx > idx;

                      return (
                        <div
                          key={st.id}
                          style={{
                            minWidth: '180px',
                            padding: '12px',
                            borderRadius: '10px',
                            border: isCurrent ? '1px solid #38bdf8' : isDone ? '1px solid #10b981' : '1px solid var(--border-glass)',
                            background: isCurrent ? 'rgba(56, 189, 248, 0.2)' : isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                            opacity: isDone ? 0.7 : 1
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isCurrent ? '#38bdf8' : isDone ? '#10b981' : 'var(--text-muted)' }}>
                            Step {st.stepNumber}: {st.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                            {st.targetTemp}°C • {st.overheadRPM} RPM
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Steps Table Builder */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Sequence Steps</h4>
                <button onClick={handleAddStep} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                  <Plus size={14} /> Add Step
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedRecipe.steps.map((step) => (
                  <div
                    key={step.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'grid',
                      gridTemplateColumns: '40px 1.5fr 1fr 1fr 1fr 1.2fr 40px',
                      gap: '12px',
                      alignItems: 'center'
                    }}
                  >
                    <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>
                      #{step.stepNumber}
                    </span>

                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => handleUpdateStep(step.id, 'name', e.target.value)}
                      style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-glass)', color: '#ffffff', fontSize: '0.85rem' }}
                    />

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target Temp</span>
                      <input
                        type="number"
                        className="font-mono"
                        value={step.targetTemp}
                        onChange={(e) => handleUpdateStep(step.id, 'targetTemp', parseFloat(e.target.value))}
                        style={{ width: '100%', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#38bdf8', padding: '4px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Overhead RPM</span>
                      <input
                        type="number"
                        className="font-mono"
                        value={step.overheadRPM}
                        onChange={(e) => handleUpdateStep(step.id, 'overheadRPM', parseInt(e.target.value, 10))}
                        style={{ width: '100%', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#a855f7', padding: '4px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Magnetic RPM</span>
                      <input
                        type="number"
                        className="font-mono"
                        value={step.magneticRPM}
                        onChange={(e) => handleUpdateStep(step.id, 'magneticRPM', parseInt(e.target.value, 10))}
                        style={{ width: '100%', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#06b6d4', padding: '4px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Wait Condition</span>
                      <select
                        value={step.waitCondition}
                        onChange={(e) => handleUpdateStep(step.id, 'waitCondition', e.target.value)}
                        style={{ width: '100%', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#ffffff', padding: '4px', fontSize: '0.75rem' }}
                      >
                        <option value="TIME">Hold Duration (Sec)</option>
                        <option value="TEMP_REACHED">Temp Reached & Hold</option>
                        <option value="OPERATOR_CONFIRM">Semi-Auto Operator Pause</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
              Select or create a recipe from the left panel.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
