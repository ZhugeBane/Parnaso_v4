import React, { useState, useEffect, useRef } from 'react';

interface FocusModeProps {
  onExit: (sessionData?: { startTime: string; endTime: string }) => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ onExit }) => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Ref for interval to clear it properly
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      if (!startTime) setStartTime(new Date());
      intervalRef.current = window.setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, startTime]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const endTime = new Date();
    const formattedStart = startTime 
      ? startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
      : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formattedEnd = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    onExit({ startTime: formattedStart, endTime: formattedEnd });
  };

  return (
    <div className="fixed inset-0 bg-slate-900 text-slate-100 z-50 flex flex-col animate-fade-in">
      {/* Minimal Header */}
      <div className="flex justify-between items-center p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
            <img src="logo.png" className="w-8 h-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all" alt="Logo" />
            <h2 className="text-xl font-light tracking-widest uppercase text-slate-400">Modo de Foco</h2>
        </div>
        <button 
          onClick={() => onExit()} 
          className="text-slate-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* Timer Display */}
        <div className="mb-12 text-center">
          <div className="text-8xl md:text-9xl font-mono font-bold tracking-tighter text-teal-300 tabular-nums">
            {formatTime(seconds)}
          </div>
          <p className="text-slate-500 mt-4 text-lg">Tempo de Escrita</p>
        </div>

        {/* Writing Area Placeholder */}
        <div className="w-full max-w-4xl h-64 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 relative group">
           <textarea 
             className="w-full h-full bg-transparent border-none outline-none resize-none text-slate-300 text-lg leading-relaxed font-serif placeholder-slate-600"
             placeholder="Digite aqui livremente... (Este texto não é salvo, use para rascunhos rápidos ou sprints)"
           ></textarea>
           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Rascunho Temporário</span>
           </div>
        </div>

        {/* Controls */}
        <div className="mt-12 flex items-center gap-6">
          <button 
            onClick={toggleTimer}
            className={`h-16 w-16 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg ${
              isActive 
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' 
                : 'bg-teal-500 hover:bg-teal-600 text-white'
            }`}
          >
            {isActive ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 pl-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {seconds > 0 && (
             <button 
               onClick={handleFinish}
               className="px-6 py-3 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-medium transition-colors"
             >
               Encerrar e Salvar
             </button>
          )}
        </div>
      </div>
    </div>
  );
};