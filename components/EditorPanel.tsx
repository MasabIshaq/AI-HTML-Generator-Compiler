import React, { useState, useRef, useEffect } from 'react';

interface EditorPanelProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    onGenerate: () => void;
    onPlayAudio: () => void;
    onStopAudio: () => void;
    onReset: () => void;
    isGenerating: boolean;
    isSynthesizing: boolean;
    isPlaying: boolean;
    error: string | null;
    generatedHtml: string;
    isChatStarted: boolean;
    chatHistory: string[];
}

const LoaderIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}>
        <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);

const StopIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="6" y="6" width="12" height="12"></rect></svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const CompilerIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);

const GenerateIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
);

const EditIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);


export const EditorPanel = ({ prompt, setPrompt, onGenerate, onPlayAudio, onStopAudio, onReset, isGenerating, isSynthesizing, isPlaying, error, generatedHtml, isChatStarted, chatHistory }: EditorPanelProps) => {
    const [isCopied, setIsCopied] = useState(false);
    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const hasHtml = !generatedHtml.startsWith('<div class="flex items-center');
    const isAudioBusy = isSynthesizing || isPlaying;

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleCopy = () => {
        if (!hasHtml || isCopied) return;
        navigator.clipboard.writeText(generatedHtml).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy HTML: ', err);
        });
    };
    
    const openCompiler = () => {
        window.open('https://dragoncodelab.oneapp.dev/', '_blank', 'noopener,noreferrer');
    }

    return (
        <div className="w-full md:w-1/2 flex flex-col bg-gray-800 p-4 border-r border-gray-700 overflow-hidden">
            <div className="flex-grow flex flex-col min-h-0">
                <label htmlFor="prompt-editor" className="text-lg font-semibold mb-3 text-cyan-300 flex-shrink-0">
                    {isChatStarted ? 'Your Conversation' : 'Describe what to build'}
                </label>
                
                {isChatStarted ? (
                    <div ref={chatHistoryRef} className="flex-1 min-h-0 overflow-y-auto mb-3 border border-gray-700 rounded-md p-3 bg-gray-900/50 space-y-4">
                        {chatHistory.map((message, index) => (
                             <div key={index} className="flex items-start gap-3 justify-end">
                                <div className="bg-cyan-800/70 rounded-xl rounded-br-none p-3 max-w-[80%]">
                                    <p className="text-gray-100 text-sm font-medium">{message}</p>
                                </div>
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white ring-2 ring-cyan-400">
                                    U
                                </span>
                            </div>
                        ))}
                    </div>
                ) : null}

                <textarea
                    id="prompt-editor"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={isChatStarted ? "e.g., Make the background dark gray" : "e.g., A modern login form with a 'Forgot Password' link"}
                    className="flex-shrink-0 w-full bg-gray-900 text-gray-200 border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none text-base"
                    rows={isChatStarted ? 4 : 10}
                />
            </div>
            
            <div className="flex-shrink-0 pt-4">
                {error && <div className="mb-3 text-red-400 bg-red-900/50 p-3 rounded-md">{error}</div>}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={onGenerate}
                            disabled={isGenerating || isAudioBusy || isChatStarted}
                            className="flex items-center justify-center px-6 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isGenerating && !isChatStarted ? <LoaderIcon className="w-5 h-5 mr-2"/> : <GenerateIcon className="mr-2" />}
                            {isGenerating && !isChatStarted ? 'Building...' : 'Build From Start'}
                        </button>
                        <button
                            onClick={onGenerate}
                            disabled={isGenerating || isAudioBusy || !isChatStarted}
                            className="flex items-center justify-center px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isGenerating && isChatStarted ? <LoaderIcon className="w-5 h-5 mr-2"/> : <EditIcon className="mr-2" />}
                            {isGenerating && isChatStarted ? 'Applying Change...' : 'Make Change'}
                        </button>
                        {isChatStarted && (
                            <button
                                onClick={onReset}
                                className="flex items-center justify-center px-4 py-2 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-500 transition-colors duration-200"
                                title="Start a new project from scratch"
                            >
                                <RefreshIcon className="w-5 h-5 mr-2" />
                                Reset Project
                            </button>
                        )}
                        <button
                            onClick={openCompiler}
                            className="flex items-center justify-center px-6 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-500 transition-colors duration-200"
                        >
                            <CompilerIcon className="w-5 h-5 mr-2" />
                            Compiler
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            disabled={isGenerating || !hasHtml || isCopied}
                            className={`flex items-center justify-center px-4 py-2 text-white font-semibold rounded-md transition-colors duration-200 ${
                                isCopied 
                                    ? 'bg-green-600 cursor-default' 
                                    : 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed'
                            }`}
                        >
                            {isCopied ? <CheckIcon className="w-5 h-5 mr-2"/> : <CopyIcon className="w-5 h-5 mr-2"/>}
                            {isCopied ? 'Copied!' : 'Copy HTML'}
                        </button>

                        {isAudioBusy ? (
                            <button
                                onClick={onStopAudio}
                                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition-colors duration-200"
                            >
                                <StopIcon className="w-5 h-5 mr-2"/>
                                Stop
                            </button>
                        ) : (
                            <button
                                onClick={onPlayAudio}
                                disabled={isGenerating || !hasHtml}
                                className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {isSynthesizing ? <LoaderIcon className="w-5 h-5 mr-2" /> : <PlayIcon className="w-5 h-5 mr-2"/> }
                                {isSynthesizing ? 'Loading...' : 'Read Aloud'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};