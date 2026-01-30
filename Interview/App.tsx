import React, { useState } from 'react';
import { AppStep, Skill } from './types';
import { FileUpload } from './components/FileUpload';
import { SkillSelector } from './components/SkillSelector';
import { InterviewSession } from './components/InterviewSession';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [skills, setSkills] = useState<Skill[]>([]);

  const handleSkillsExtracted = (extractedSkills: Skill[]) => {
    setSkills(extractedSkills);
    setStep(AppStep.SELECT_SKILLS);
  };

  const handleToggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => 
      s.id === id ? { ...s, selected: !s.selected } : s
    ));
  };

  const startInterview = () => {
    setStep(AppStep.INTERVIEW);
  };

  const resetApp = () => {
    setStep(AppStep.UPLOAD);
    setSkills([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 p-1.5 rounded-lg mr-2">
                 <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">InterviewMaster</span>
            </div>
            <div className="flex items-center">
                {step !== AppStep.UPLOAD && (
                    <button onClick={resetApp} className="text-sm font-medium text-slate-500 hover:text-blue-600">
                        Start Over
                    </button>
                )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        
        {step === AppStep.UPLOAD && (
          <div className="w-full animate-fade-in">
            <FileUpload onSkillsExtracted={handleSkillsExtracted} />
          </div>
        )}

        {step === AppStep.SELECT_SKILLS && (
          <div className="w-full">
            <SkillSelector 
              skills={skills} 
              onToggleSkill={handleToggleSkill} 
              onConfirm={startInterview} 
            />
          </div>
        )}

        {step === AppStep.INTERVIEW && (
          <div className="w-full animate-fade-in flex justify-center">
            <InterviewSession 
                selectedSkills={skills.filter(s => s.selected)} 
                onEndSession={resetApp}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} InterviewMaster AI. Powered by Gemini 2.5 Flash.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;