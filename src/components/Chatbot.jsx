import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "../firebase";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load messages
  useEffect(() => {
    let unsubscribe = () => {};
    
    if (user) {
      try {
        const q = query(
          collection(db, "chats"), 
          orderBy("createdAt")
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const loadedMessages = [];
          snapshot.forEach((doc) => {
            loadedMessages.push({ id: doc.id, ...doc.data() });
          });
          setMessages(loadedMessages);
        }, (error) => {
          console.error("Error loading messages:", error);
          setError("Failed to load messages. Please refresh the page.");
        });
      } catch (error) {
        console.error("Error setting up message listener:", error);
        setError("Failed to connect to the chat service.");
      }
    }
    
    return () => unsubscribe();
  }, [user]);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setError(null); // Clear any auth errors when signed in
      }
    });
    
    return unsubscribe;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveMessage = async (text, sender) => {
    if (!user && sender === "user") {
      // If no user is signed in but trying to send a message
      setError("Please sign in to send messages");
      return;
    }
    
    try {
      await addDoc(collection(db, "chats"), {
        text,
        sender,
        userId: user?.uid || "anonymous",
        displayName: user?.displayName || "Guest",
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const getAIResponse = async (userInput) => {
    try {
      // Using a try-catch block to handle API key issues
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("API key not configured");
      }
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: userInput
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response format from API");
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("AI API error:", error);
      
      // Return a specific message based on the error
      if (error.message.includes("API key")) {
        return "The AI service is not properly configured. Please check your API key setup.";
      }
      
      return "Sorry, I'm having trouble responding right now. Please try again later.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue;
    setInputValue("");
    setError(null); // Clear any previous errors
    
    await saveMessage(userMessage, "user");
    
    setIsTyping(true);
    try {
      const botResponse = await getAIResponse(userMessage);
      await saveMessage(botResponse, "bot");
    } catch (error) {
      console.error("Error in message flow:", error);
      await saveMessage("Sorry, something went wrong. Please try again later.", "bot");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isTyping) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      
      // Open a popup with a small timeout to help avoid popup blockers
      setTimeout(async () => {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          if (result.user) {
            console.log("Signed in successfully");
          }
        } catch (err) {
          console.error("Sign-in error:", err);
          // Handle specific error codes
          if (err.code === 'auth/popup-closed-by-user') {
            setError("Sign-in was cancelled. Please try again.");
          } else if (err.code === 'auth/popup-blocked') {
            setError("Popup was blocked by your browser. Please allow popups for this site.");
          } else {
            setError("Failed to sign in. Please try again.");
          }
        }
      }, 100);
    } catch (error) {
      console.error("Pre-sign-in error:", error);
      setError("Failed to start sign-in process. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setMessages([]); // Clear messages when signing out
    } catch (error) {
      console.error("Sign-out error:", error);
      setError("Failed to sign out. Please try again.");
    }
  };

  return (
    <ChatbotContainer>
      <ChatHeader>
        <HeaderText>K A I R O</HeaderText>
        {user && (
          <UserInfo>
            <UserAvatar src={user.photoURL || "/default-avatar.png"} alt={user.displayName} />
            <SignOutButton onClick={handleSignOut}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </SignOutButton>
          </UserInfo>
        )}
      </ChatHeader>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <MessagesContainer>
        {messages.length === 0 && !isTyping && (
          <WelcomeMessage>
            Welcome to KAIRO! {user ? `Hi ${user.displayName?.split(' ')[0] || 'there'}!` : 'Please sign in to start chatting.'}
          </WelcomeMessage>
        )}
        
        {messages.map((message) => (
          <Message key={message.id} $sender={message.sender}>
            {message.text}
          </Message>
        ))}
        
        {isTyping && (
          <TypingIndicator>
            <Dot $delay="0s" />
            <Dot $delay="0.2s" />
            <Dot $delay="0.4s" />
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </SendButton>
        </InputContainer>
      )}
    </ChatbotContainer>
  );
};

// Styled components
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(0, 180, 219, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 180, 219, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 180, 219, 0);
  }
`;

const blink = keyframes`
  0% { opacity: 0.2; transform: translateY(0); }
  20% { opacity: 1; transform: translateY(-2px); }
  100% { opacity: 0.2; transform: translateY(0); }
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  margin: 0 2px;
  background-color: white;
  border-radius: 50%;
  animation: ${blink} 1.4s infinite;
  animation-delay: ${props => props.$delay};
`;

const ChatbotContainer = styled.div`
  width: 400px;
  height: 600px;
  background: linear-gradient(to bottom, #1e1e2f, #121222);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 
              0 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;
`;

const ChatHeader = styled.div`
  padding: 16px;
  background: linear-gradient(90deg, #29293d, #24243c);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const HeaderText = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 2px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #121222;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const WelcomeMessage = styled.div`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin: auto;
  padding: 20px;
  font-size: 16px;
  max-width: 80%;
`;

const Message = styled.div`
  background-color: ${props => (props.$sender === "user" ? "#005c97" : "#2d2d42")};
  background: ${props => 
    props.$sender === "user" 
      ? "linear-gradient(135deg, #005c97, #363795)" 
      : "linear-gradient(135deg, #2d2d42, #1f1f32)"};
  color: white;
  padding: 14px 16px;
  border-radius: 12px;
  max-width: 80%;
  align-self: ${props => (props.$sender === "user" ? "flex-end" : "flex-start")};
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  white-space: pre-wrap;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 16px;
  background-color: #1a1a2e;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const Input = styled.input`
  flex: 1;
  padding: 14px 16px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  background-color: #242444;
  color: white;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 180, 219, 0.5);
    background-color: #2a2a50;
  }
  
  &:disabled {
    background-color: #1e1e36;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00b4db, #0083b0);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:enabled {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 180, 219, 0.4);
  }
  
  &:active:enabled {
    transform: translateY(1px);
  }
  
  &:disabled {
    background: #3a3a5a;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    opacity: 0.7;
  }
`;

const SignInButton = styled.button`
  padding: 12px 16px;
  margin: 16px auto;
  font-size: 16px;
  background: linear-gradient(135deg, #4285f4, #357ae8);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #357ae8, #2a67c6);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(66, 133, 244, 0.4);
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const SignOutButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const GoogleIcon = styled.span`
  margin-right: 10px;
  display: flex;
  align-items: center;
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(135deg, #2d2d42, #232338);
  border-radius: 12px;
  align-self: flex-start;
  margin-bottom: 12px;
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 88, 88, 0.1);
  color: #ff7070;
  padding: 10px 16px;
  margin: 0;
  font-size: 14px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 88, 88, 0.2);
`;

export default Chatbot;