import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, DollarSign, TrendingUp, PiggyBank, Lightbulb, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

function FinancialChatbot({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadAnalysis();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAnalysis = async () => {
    setIsTyping(true);
    try {
      const response = await api.post('/chat/analyze', { user_id: userId });
      if (response.data.status === 'success') {
        setAnalysis(response.data.data);
        
        // Add welcome message with analysis summary
        const welcomeMessage = {
          id: Date.now(),
          type: 'bot',
          content: `👋 Namaste! I'm your personal AI Financial Advisor (CA).\n\nBased on your financial data:\n\n💰 Monthly Income: ₹${response.data.data.metrics.monthly_income.toLocaleString('en-IN')}\n📉 Monthly Expenses: ₹${response.data.data.metrics.monthly_expenses.toLocaleString('en-IN')}\n💵 Monthly Savings: ₹${response.data.data.metrics.monthly_savings.toLocaleString('en-IN')}\n📊 Savings Rate: ${response.data.data.metrics.savings_rate}%\n\nHow can I help you today? You can ask me about:\n• How to save more money\n• Best investment options\n• Tax saving tips\n• Reducing unnecessary expenses\n• Planning for goals`
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      toast.error('Failed to load financial analysis');
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await api.post('/chat/message', {
        user_id: userId,
        message: inputMessage,
        history: messages.slice(-5)
      });

      if (response.data.status === 'success') {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.data.response
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    { icon: <DollarSign className="h-4 w-4" />, text: "How can I save more money?" },
    { icon: <TrendingUp className="h-4 w-4" />, text: "Best investment options for me?" },
    { icon: <PiggyBank className="h-4 w-4" />, text: "How to reduce expenses?" },
    { icon: <Lightbulb className="h-4 w-4" />, text: "Tax saving tips for 80C?" }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-xl flex justify-between items-center">
        <div className="flex items-center">
          <Bot className="h-6 w-6 mr-2" />
          <div>
            <h3 className="font-semibold">AI Financial Advisor</h3>
            <p className="text-xs text-blue-100">Your Personal CA • Online</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
              }`}
            >
              {message.type === 'bot' && (
                <div className="flex items-center mb-1">
                  <Bot className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-xs text-blue-600 font-medium">CA Advisor</span>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg rounded-bl-none shadow-sm border border-gray-200">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length < 2 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">Quick Questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputMessage(q.text);
                  sendMessage();
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-xs text-gray-700 hover:bg-gray-100 transition"
              >
                {q.icon}
                <span>{q.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your finances..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            rows="1"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          I can help with savings, investments, taxes, and financial planning
        </p>
      </div>
    </div>
  );
}

export default FinancialChatbot;