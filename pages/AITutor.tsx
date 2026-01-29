import React, { useState, useRef, useEffect } from 'react';
import { getTutorResponse } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, Bot, User } from 'lucide-react';

const AITutor: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'שלום! אני מספרי 🤖. אני כאן כדי לעזור לכם להבין חשבון בצורה כיפית. מה תרצו ללמוד היום? אפשר לשאול אותי על שברים, כפל, או סתם חידה!'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Prepare history for API
    const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));

    const responseText = await getTutorResponse(userMsg.text, history);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] p-4 flex flex-col">
      <div className="bg-white rounded-3xl shadow-xl flex-1 flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-secondary p-4 flex items-center shadow-sm z-10">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-secondary ml-3">
             <Bot size={24} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">המאמן האישי</h2>
            <p className="text-purple-100 text-xs">תמיד כאן לעזור</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 
                  ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600 ml-2' : 'bg-purple-100 text-purple-600 mr-2'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-4 rounded-2xl text-sm md:text-base shadow-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? 'bg-white text-gray-800 rounded-tr-none border border-gray-100' 
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-tl-none'}`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex w-full justify-end">
                <div className="flex flex-row-reverse max-w-[80%]">
                    <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                        <Bot size={16} />
                    </div>
                    <div className="bg-gray-200 p-4 rounded-2xl rounded-tl-none flex space-x-1 space-x-reverse items-center h-12">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center space-x-2 space-x-reverse bg-gray-100 rounded-full px-2 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="שאל אותי שאלה בחשבון..."
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-gray-700 placeholder-gray-400 outline-none"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`p-3 rounded-full transition-all 
                ${!input.trim() || isTyping 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-secondary text-white hover:bg-purple-600 shadow-md transform hover:scale-105'}`}
            >
              <Send size={20} className={isTyping ? 'opacity-0' : 'opacity-100'} /> 
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AITutor;