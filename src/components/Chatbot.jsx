import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { auth, googleProvider, signInWithPopup, signOut } from "../firebase";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: "Hello, I'm Kairo. Your digital companion.", sender: "bot" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // ... rest of your chatbot logic remains the same ...

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

      {!user ? (
        <SignInButton onClick={handleGoogleSignIn}>
          <GoogleIcon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ffffff"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff"/>
            </svg>
          </GoogleIcon>
          Sign In with Google
        </SignInButton>
      ) : (
        <>
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
              disabled={inputValue.trim() === "" || isTyping}
            >
              Send
            </SendButton>
          </InputContainer>
          <SignOutButton onClick={handleSignOut}>Sign Out</SignOutButton>
        </>
      )}
    </ChatbotContainer>
  );
};

// ====== Styled Components ======

const GoogleIcon = styled.span`
  margin-right: 8px;
  display: flex;
  align-items: center;
`;


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
  background-color: ${({ sender }) => (sender === "user" ? "#005c97" : "#444")};
  color: white;
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: 10px;
  align-self: ${({ sender }) => (sender === "user" ? "flex-end" : "flex-start")};
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

const SignInButton = styled.button`
  padding: 12px 16px;
  font-size: 16px;
  background-color: #4285f4; /* Google blue */
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin: 20px;
`;

const SignOutButton = styled.button`
  padding: 12px 16px;
  font-size: 16px;
  background-color: #db4437; /* Google red */
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin: 20px;
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


export default Chatbot;