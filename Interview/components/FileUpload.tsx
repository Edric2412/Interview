import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { parseResumeForSkills } from '../services/gemini';
import { Skill } from '../types';

interface FileUploadProps {
  onSkillsExtracted: (skills: Skill[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onSkillsExtracted }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate type
    const validTypes = ['application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF or TXT file.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = (e.target?.result as string).split(',')[1];
        try {
          const skills = await parseResumeForSkills(base64String, file.type);
          onSkillsExtracted(skills);
        } catch (err) {
            console.error(err);
          setError("Failed to analyze resume. Please try a different file.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error reading file.");
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Upload Your Resume</h2>
        <p className="text-slate-500">We'll extract your skills to generate a personalized interview.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'}
          ${loading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-slate-700">
              {loading ? "Analyzing Resume..." : "Drag & drop your resume"}
            </p>
            <p className="text-sm text-slate-400">PDF or TXT (Max 5MB)</p>
          </div>

          {!loading && (
            <>
              <div className="flex items-center space-x-2 text-xs text-slate-400 uppercase tracking-widest font-semibold">
                <span className="h-px w-8 bg-slate-200"></span>
                <span>OR</span>
                <span className="h-px w-8 bg-slate-200"></span>
              </div>

              <label className="cursor-pointer inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                <FileText className="w-4 h-4 mr-2" />
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt"
                  onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};