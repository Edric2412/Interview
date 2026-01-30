import React, { useState, useEffect, useRef } from 'react';
import { Message, Skill } from '../types';
import { generateInterviewQuestion, validateAnswer, generateSpeech } from '../services/gemini';
import { audioService } from '../services/audio';
import { Send, Mic, PlayCircle, StopCircle, User, Bot, Award, RotateCcw } from 'lucide-react';

interface InterviewSessionProps {
  selectedSkills: Skill[];
  onEndSession: () => void;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({ selectedSkills, onEndSession }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Question
  useEffect(() => {
    const startInterview = async () => {
      setIsLoading(true);
      const question = await generateInterviewQuestion(selectedSkills, []);
      const newMessage: Message = { id: 'init', role: 'ai', text: question };
      setMessages([newMessage]);
      setIsLoading(false);
      
      // Auto-play audio for first question
      handlePlayAudio(question);
    };
    startInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handlePlayAudio = async (text: string) => {
    if (isPlaying) {
      audioService.stop();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const audioData = await generateSpeech(text);
    if (audioData) {
      await audioService.playAudio(audioData, () => setIsPlaying(false));
    } else {
      setIsPlaying(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const currentQuestion = messages[messages.length - 1].text;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // 1. Validate Answer
      const validation = await validateAnswer(currentQuestion, userMsg.text);
      
      // Update user message with feedback
      setMessages(prev => prev.map(m => 
        m.id === userMsg.id ? { ...m, feedback: validation.feedback, score: validation.score } : m
      ));

      // 2. Generate Next Question
      const prevQuestions = messages.filter(m => m.role === 'ai').map(m => m.text);
      const nextQuestion = await generateInterviewQuestion(selectedSkills, prevQuestions);
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: nextQuestion };
      setMessages(prev => [...prev, aiMsg]);
      
      // Play audio for new question
      handlePlayAudio(nextQuestion);

    } catch (error) {
      console.error("Interview loop error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Interview Session</h3>
            <p className="text-xs text-slate-500">{selectedSkills.length} topics selected</p>
          </div>
        </div>
        <button 
            onClick={onEndSession}
            className="text-slate-500 hover:text-red-600 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
        >
            End Session
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Bubble */}
              <div className="flex flex-col gap-2">
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>

                {/* AI Audio Control (Only for AI messages) */}
                {msg.role === 'ai' && (
                  <button 
                    onClick={() => handlePlayAudio(msg.text)}
                    className="self-start flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    {isPlaying && messages[messages.length-1].id === msg.id ? (
                      <><StopCircle className="w-4 h-4" /> <span>Stop Speaking</span></>
                    ) : (
                      <><PlayCircle className="w-4 h-4" /> <span>Read Aloud</span></>
                    )}
                  </button>
                )}

                {/* Feedback Card (Only for user messages that have been evaluated) */}
                {msg.feedback && (
                  <div className="bg-green-50 border border-green-100 p-3 rounded-xl mt-1 text-xs animate-fade-in">
                    <div className="flex items-center space-x-2 text-green-800 font-semibold mb-1">
                      <Award className="w-4 h-4" />
                      <span>Score: {msg.score}/10</span>
                    </div>
                    <p className="text-green-700 leading-snug">{msg.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
            <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 ml-11">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your answer here..."
            className="flex-1 resize-none bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[50px] max-h-[120px]"
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className={`
              p-3 rounded-xl transition-all duration-200 flex-shrink-0
              ${!inputText.trim() || isLoading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}
            `}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-center text-slate-400 mt-2">
          AI generated content may be inaccurate.
        </p>
      </div>
    </div>
  );
};