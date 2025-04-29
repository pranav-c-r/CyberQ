import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: "Hello, I'm Kairo. Your digital companion.", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const fetchGeminiResponse = async (userInput) => {
    try {
      const response = await axios.post(GEMINI_API_URL, {
        contents: [{ parts: [{ text: userInput }] }]
      });

      const botText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't understand that.";
      setMessages(prev => [...prev, { text: botText, sender: 'bot' }]);
    } catch (error) {
      console.error('Gemini API error:', error);
      setMessages(prev => [...prev, { text: "Error connecting to Gemini API.", sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    fetchGeminiResponse(userMessage.text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isTyping) {
      handleSendMessage();
    }
  };

  return (
    <ChatbotContainer>
      <ChatHeader>K A I R O</ChatHeader>
      <MessagesContainer>
        {messages.map((message, index) => (
          <Message key={index} sender={message.sender}>
            {message.text}
          </Message>
        ))}
        {isTyping && (
          <TypingIndicator>
            <Dot delay="0s" />
            <Dot delay="0.2s" />
            <Dot delay="0.4s" />
          </TypingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <InputContainer>
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isTyping}
        />
        <SendButton
          onClick={handleSendMessage}
          disabled={inputValue.trim() === '' || isTyping}
        >
          Send
        </SendButton>
      </InputContainer>
    </ChatbotContainer>
  );
};

export default Chatbot;

// ====== Styled Components ======
const ChatbotContainer = styled.div`
  width: 400px;
  height: 600px;
  background-color: #1e1e2f;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const ChatHeader = styled.div`
  padding: 16px;
  background-color: #29293d;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  text-align: center;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #121222;
`;

const Message = styled.div`
  background-color: ${({ sender }) => (sender === 'user' ? '#005c97' : '#444')};
  color: white;
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: 10px;
  align-self: ${({ sender }) => (sender === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 80%;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 12px;
  background-color: #29293d;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  margin-right: 8px;
  background-color: #1a1a2e;
  color: white;
`;

const SendButton = styled.button`
  padding: 12px 16px;
  font-size: 16px;
  background-color: #00b4db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

// ====== Typing Indicator Animation ======
const blink = keyframes`
  0% { opacity: 0.2; }
  20% { opacity: 1; }
  100% { opacity: 0.2; }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  padding-left: 8px;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  margin: 0 2px;
  background-color: white;
  border-radius: 50%;
  animation: ${blink} 1.4s infinite;
  animation-delay: ${({ delay }) => delay};
`;

