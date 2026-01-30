import React from 'react';
import { Skill } from '../types';
import { Check, Brain, Wrench, Briefcase, ArrowRight } from 'lucide-react';

interface SkillSelectorProps {
  skills: Skill[];
  onToggleSkill: (id: string) => void;
  onConfirm: () => void;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({ skills, onToggleSkill, onConfirm }) => {
  const selectedCount = skills.filter(s => s.selected).length;

  const getIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Wrench className="w-4 h-4" />;
      case 'soft': return <Brain className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Select Focus Areas</h2>
        <p className="text-slate-500">Choose the skills you want to be grilled on.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Detected Skills ({skills.length})</h3>
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{selectedCount} selected</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => onToggleSkill(skill.id)}
              className={`
                flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all duration-200
                ${skill.selected 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}
              `}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <span className={`p-1.5 rounded-md ${skill.selected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                    {getIcon(skill.category)}
                </span>
                <span className="font-medium truncate text-sm">{skill.name}</span>
              </div>
              {skill.selected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onConfirm}
          disabled={selectedCount === 0}
          className={`
            flex items-center px-8 py-3 rounded-lg font-semibold text-white shadow-md transition-all
            ${selectedCount > 0 
              ? 'bg-blue-600 hover:bg-blue-700 hover:translate-y-[-1px]' 
              : 'bg-slate-300 cursor-not-allowed'}
          `}
        >
          Start Interview
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};