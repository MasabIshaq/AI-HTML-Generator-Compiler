import React, { useState, useCallback } from 'react';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { Chatbot } from './components/Chatbot';
import { generateOrUpdateHtmlCode, generateSpeechFromText, resetHtmlChatSession, askChatbot } from './services/geminiService';
import { useAudioPlayer } from './hooks/useAudioPlayer';

const Header = () => (
    <header className="bg-gray-900/80 backdrop-blur-sm text-white p-4 flex items-center shadow-lg border-b border-gray-700 sticky top-0 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        <h1 className="text-2xl font-bold tracking-wider">AI HTML Generator & Compiler</h1>
    </header>
);

const INITIAL_HTML_CONTENT = '<div class="flex items-center justify-center h-full text-gray-500 font-sans p-8 text-center">Your HTML preview will appear here. Describe what you want to build and click "Generate".</div>';

interface Message {
    role: 'user' | 'model';
    content: string;
}

const ChatbotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);


export default function App() {
    const [prompt, setPrompt] = useState<string>('');
    const [generatedHtml, setGeneratedHtml] = useState<string>(INITIAL_HTML_CONTENT);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isChatStarted, setIsChatStarted] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<string[]>([]);
    
    const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
    const [chatbotMessages, setChatbotMessages] = useState<Message[]>([
        { role: 'model', content: 'Hello! I am a web development assistant. How can I help you today?' }
    ]);
    const [isChatbotLoading, setIsChatbotLoading] = useState<boolean>(false);
    const [chatbotError, setChatbotError] = useState<string | null>(null);

    const { isPlaying, play, stop } = useAudioPlayer();

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please enter a description or a change request.');
            return;
        }
        setIsGenerating(true);
        setError(null);
        try {
            const html = await generateOrUpdateHtmlCode(prompt);
            setGeneratedHtml(html);
            if (!isChatStarted) {
                setIsChatStarted(true);
            }
            setChatHistory(prev => [...prev, prompt]);
            setPrompt(''); // Clear input after successful generation/update
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            // If the session failed, reset the chat state
            setIsChatStarted(false);
            setChatHistory([]);
            resetHtmlChatSession();
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, isChatStarted]);

    const handleReset = useCallback(() => {
        stop();
        setPrompt('');
        setGeneratedHtml(INITIAL_HTML_CONTENT);
        setError(null);
        setIsChatStarted(false);
        setChatHistory([]);
        resetHtmlChatSession();
    }, [stop]);
    
    const handlePlayAudio = useCallback(async () => {
        if (!generatedHtml || generatedHtml === INITIAL_HTML_CONTENT) return;
        setIsSynthesizing(true);
        setError(null);
        try {
            const base64Audio = await generateSpeechFromText(generatedHtml);
            await play(base64Audio);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred during TTS synthesis.');
        } finally {
            setIsSynthesizing(false);
        }
    }, [generatedHtml, play]);

    const handleStopAudio = useCallback(() => {
        stop();
    }, [stop]);

    const handleChatbotSend = useCallback(async (message: string) => {
        setChatbotError(null);
        setChatbotMessages(prev => [...prev, { role: 'user', content: message }]);
        setIsChatbotLoading(true);
        try {
            const response = await askChatbot(message);
            setChatbotMessages(prev => [...prev, { role: 'model', content: response }]);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setChatbotError(errorMessage);
        } finally {
            setIsChatbotLoading(false);
        }
    }, []);

    return (
        <div className="flex flex-col h-screen bg-gray-900 font-sans">
            <Header />
            <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
                <EditorPanel
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onGenerate={handleGenerate}
                    onPlayAudio={handlePlayAudio}
                    onStopAudio={handleStopAudio}
                    onReset={handleReset}
                    isGenerating={isGenerating}
                    isSynthesizing={isSynthesizing}
                    isPlaying={isPlaying}
                    error={error}
                    generatedHtml={generatedHtml}
                    isChatStarted={isChatStarted}
                    chatHistory={chatHistory}
                />
                <PreviewPanel 
                    htmlContent={generatedHtml} 
                    isLoading={isGenerating}
                />
            </main>
            <div className="fixed bottom-5 right-5 z-40">
                <button 
                    onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                    className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-transform transform hover:scale-110"
                    aria-label="Toggle Chatbot"
                >
                    <ChatbotIcon />
                </button>
            </div>
            <Chatbot 
                isOpen={isChatbotOpen}
                onClose={() => setIsChatbotOpen(false)}
                messages={chatbotMessages}
                onSend={handleChatbotSend}
                isLoading={isChatbotLoading}
                error={chatbotError}
            />
        </div>
    );
}