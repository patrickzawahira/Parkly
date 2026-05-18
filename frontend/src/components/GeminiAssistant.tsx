import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Mic, Car, MicOff, Volume2 } from 'lucide-react';
import { chat } from '../services/api';
import { MOCK_PARKING_SPOTS } from '../services/mockData';
import { ChatMessage } from '../types';
import { voiceService } from '../services/voiceService';

export const GeminiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Hi! I can help you find parking. Try "Find cheap parking" or "Where is EV charging?"' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Stop voice when closing
  useEffect(() => {
    if (!isOpen) {
      voiceService.setEnabled(false);
      setIsListening(false);
    } else {
      voiceService.setEnabled(true);
    }
  }, [isOpen]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Get current location
      let userLocation = undefined;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (e) {
          console.warn('Location access denied or failed', e);
        }
      }

      // Send to backend with location context
      const response = await chat.sendMessage(text, userLocation);
      const responseText = response.reply;

      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, aiMsg]);

      // In driving mode, speak the response and then listen again
      if (isDrivingMode) {
        voiceService.speak(responseText, {
          onEnd: () => {
            // Auto-listen after speaking finished
            startListening();
          }
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having trouble connecting to the server. Please try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    setIsListening(true);
    voiceService.startListening(
      (text) => {
        setIsListening(false);
        setInput(text);
        handleSend(text);
      },
      (error) => {
        console.error('Voice error:', error);
        setIsListening(false);
      }
    );
  };

  const stopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
  };

  const toggleDrivingMode = () => {
    const newMode = !isDrivingMode;
    setIsDrivingMode(newMode);
    if (newMode) {
      voiceService.speak("Driving mode enabled. I'm listening.");
      startListening();
    } else {
      voiceService.stopSpeaking();
      stopListening();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-xl flex items-center justify-center z-40 hover:scale-105 transition-transform"
          aria-label="Open AI Assistant"
        >
          <MessageSquare className="text-white" size={28} />
        </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className={`bg-white w-full sm:w-96 ${isDrivingMode ? 'h-[90vh]' : 'h-[80vh] sm:h-[600px]'} rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}>

            {/* Header */}
            <div className={`${isDrivingMode ? 'bg-slate-900 py-6' : 'bg-indigo-600 p-4'} flex justify-between items-center text-white transition-all`}>
              <div className="flex items-center gap-3 px-4">
                <div className={`w-2 h-2 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-400'} rounded-full`}></div>
                <h2 className={`font-bold ${isDrivingMode ? 'text-2xl' : 'text-lg'}`}>
                  {isDrivingMode ? 'Driving Assistant' : 'AI Assistant'}
                </h2>
              </div>
              <div className="flex items-center gap-2 px-2">
                <button
                  onClick={toggleDrivingMode}
                  className={`p-2 rounded-full ${isDrivingMode ? 'bg-blue-600 text-white' : 'hover:bg-white/20 text-white/80'}`}
                  title={isDrivingMode ? "Exit Driving Mode" : "Enter Driving Mode"}
                >
                  <Car size={24} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Driving Mode UI */}
            {isDrivingMode ? (
              <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-6 space-y-8 relative overflow-hidden">
                {/* Visualizer Effect */}
                {isListening && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <div className="w-64 h-64 bg-blue-500 rounded-full animate-ping"></div>
                    <div className="absolute w-48 h-48 bg-blue-400 rounded-full animate-ping delay-75"></div>
                  </div>
                )}

                {/* Last Message Display */}
                <div className="w-full text-center space-y-4 z-10">
                  {messages.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                      <p className="text-slate-300 text-sm mb-2 uppercase tracking-wider">
                        {messages[messages.length - 1].role === 'user' ? 'You said' : 'Assistant'}
                      </p>
                      <p className="text-white text-2xl font-medium leading-relaxed">
                        "{messages[messages.length - 1].text}"
                      </p>
                    </div>
                  )}

                  {isLoading && (
                    <p className="text-blue-300 animate-pulse text-xl">Thinking...</p>
                  )}
                </div>

                {/* Big Mic Button */}
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-2xl z-10 ${isListening
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/50'
                    }`}
                >
                  {isListening ? (
                    <MicOff size={48} className="text-white" />
                  ) : (
                    <Mic size={48} className="text-white" />
                  )}
                </button>

                <p className="text-slate-400 text-sm">
                  {isListening ? "Listening..." : "Tap to speak"}
                </p>
              </div>
            ) : (
              /* Standard Chat UI */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 shadow-sm border border-slate-200 rounded-bl-none'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-200 p-3 rounded-2xl rounded-bl-none animate-pulse text-slate-500 text-xs">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask while driving..."
                      className="bg-transparent flex-1 outline-none text-slate-800 placeholder-slate-400"
                    />
                    <button
                      onClick={startListening}
                      className={`text-slate-400 hover:text-blue-600 ${isListening ? 'text-red-500 animate-pulse' : ''}`}
                    >
                      <Mic size={20} />
                    </button>
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim()}
                      className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};