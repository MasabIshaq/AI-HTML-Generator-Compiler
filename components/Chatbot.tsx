import React, { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'model';
    content: string;
}

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    messages: Message[];
    onSend: (message: string) => void;
    isLoading: boolean;
    error: string | null;
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
)

const TypingIndicator = () => (
    <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

export const Chatbot = ({ isOpen, onClose, messages, onSend, isLoading, error }: ChatbotProps) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSend(input);
            setInput('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-5 w-full max-w-md h-[calc(100vh-8rem)] max-h-[600px] bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50 transition-all duration-300 animate-fade-in-up">
            <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-lg font-bold text-cyan-300">Chat with Assistant</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <CloseIcon />
                </button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                           <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white ring-2 ring-indigo-400">
                                A
                            </span>
                        )}
                        <div className={`rounded-xl p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-cyan-800/70 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                            <p className="text-gray-100 text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                        </div>
                         {msg.role === 'user' && (
                           <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white ring-2 ring-cyan-400">
                                U
                            </span>
                        )}
                    </div>
                ))}
                 {isLoading && (
                     <div className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white ring-2 ring-indigo-400">
                             A
                         </span>
                         <div className="bg-gray-700 rounded-xl rounded-bl-none p-3 max-w-[80%]">
                             <TypingIndicator />
                         </div>
                     </div>
                 )}
                 <div ref={messagesEndRef} />
            </main>
            {error && <div className="mx-4 mb-2 text-sm text-red-400 bg-red-900/50 p-2 rounded-md">{error}</div>}
            <footer className="p-4 border-t border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask anything..."
                        className="flex-1 bg-gray-900 text-gray-200 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                        <SendIcon />
                    </button>
                </div>
            </footer>
        </div>
    );
}