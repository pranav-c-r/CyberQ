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
        <HeaderText>C y b e r Q</HeaderText>
        {user && (
          <UserInfo>
            <UserAvatar src={user.photoURL || "/default-avatar.png"} alt={user.displayName} />
            <SignOutButton onClick={handleSignOut}>
  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 20.7499H6C5.65324 20.7647 5.30697 20.7109 4.98101 20.5917C4.65505 20.4725 4.3558 20.2902 4.10038 20.0552C3.84495 19.8202 3.63837 19.5371 3.49246 19.2222C3.34654 18.9073 3.26415 18.5667 3.25 18.2199V5.77994C3.26415 5.43316 3.34654 5.09256 3.49246 4.77765C3.63837 4.46274 3.84495 4.17969 4.10038 3.9447C4.3558 3.70971 4.65505 3.52739 4.98101 3.40818C5.30697 3.28896 5.65324 3.23519 6 3.24994H9C9.19891 3.24994 9.38968 3.32896 9.53033 3.46961C9.67098 3.61027 9.75 3.80103 9.75 3.99994C9.75 4.19886 9.67098 4.38962 9.53033 4.53027C9.38968 4.67093 9.19891 4.74994 9 4.74994H6C5.70307 4.72412 5.4076 4.81359 5.17487 4.99977C4.94213 5.18596 4.78999 5.45459 4.75 5.74994V18.2199C4.78999 18.5153 4.94213 18.7839 5.17487 18.9701C5.4076 19.1563 5.70307 19.2458 6 19.2199H9C9.19891 19.2199 9.38968 19.299 9.53033 19.4396C9.67098 19.5803 9.75 19.771 9.75 19.9699C9.75 20.1689 9.67098 20.3596 9.53033 20.5003C9.38968 20.6409 9.19891 20.7199 9 20.7199V20.7499Z" fill="#ffffff"/>
    <path d="M16 16.7499C15.9015 16.7504 15.8038 16.7312 15.7128 16.6934C15.6218 16.6556 15.5392 16.6 15.47 16.5299C15.3296 16.3893 15.2507 16.1987 15.2507 15.9999C15.2507 15.8012 15.3296 15.6105 15.47 15.4699L18.94 11.9999L15.47 8.52991C15.3963 8.46125 15.3372 8.37845 15.2962 8.28645C15.2552 8.19445 15.2332 8.09513 15.2314 7.99443C15.2296 7.89373 15.2482 7.7937 15.2859 7.70031C15.3236 7.60692 15.3797 7.52209 15.451 7.45087C15.5222 7.37965 15.607 7.32351 15.7004 7.28579C15.7938 7.24807 15.8938 7.22954 15.9945 7.23132C16.0952 7.23309 16.1945 7.25514 16.2865 7.29613C16.3785 7.33712 16.4613 7.39622 16.53 7.46991L20.53 11.4699C20.6705 11.6105 20.7493 11.8012 20.7493 11.9999C20.7493 12.1987 20.6705 12.3893 20.53 12.5299L16.53 16.5299C16.4608 16.6 16.3782 16.6556 16.2872 16.6934C16.1962 16.7312 16.0985 16.7504 16 16.7499Z" fill="#ffffff"/>
    <path d="M20 12.75H9C8.80109 12.75 8.61032 12.671 8.46967 12.5303C8.32902 12.3897 8.25 12.1989 8.25 12C8.25 11.8011 8.32902 11.6103 8.46967 11.4697C8.61032 11.329 8.80109 11.25 9 11.25H20C20.1989 11.25 20.3897 11.329 20.5303 11.4697C20.671 11.6103 20.75 11.8011 20.75 12C20.75 12.1989 20.671 12.3897 20.5303 12.5303C20.3897 12.671 20.1989 12.75 20 12.75Z" fill="#ffffff"/>
  </svg>
</SignOutButton>
          </UserInfo>
        )}
      </ChatHeader>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <MessagesContainer>
        {messages.length === 0 && !isTyping && (
          <WelcomeMessage>
            Welcome to CyberQ chatbot! {user ? `Hi ${user.displayName?.split(' ')[0] || 'there'}!` : 'Please sign in to start chatting.'}
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
  border-radius: 50%;  // Changed to circle shape
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
  svg {
    transition: all 0.2s ease;
  }
  &:hover svg {
    stroke: #ff6b6b;  // Changes color on hover
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


