import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { auth, googleProvider, signInWithPopup } from '../firebase';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <BackgroundAnimation />
      
      <LoginCard>
        <LogoContainer>
          <LogoText>C y b e r Q</LogoText>
          <Subtitle>Your AI Companion</Subtitle>
        </LogoContainer>
        
        <Description>
          Chat with an advanced AI assistant powered by Google Gemini
        </Description>
        
        <GoogleButton onClick={handleGoogleSignIn} disabled={loading}>
          <GoogleIcon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </GoogleIcon>
          {loading ? 'Connecting...' : 'Continue with Google'}
        </GoogleButton>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Features>
          <Feature>
            <FeatureIcon>✨</FeatureIcon>
            Advanced Conversations
          </Feature>
          <Feature>
            <FeatureIcon>🔒</FeatureIcon>
            Secure Authentication
          </Feature>
          <Feature>
            <FeatureIcon>🚀</FeatureIcon>
            Powered by Gemini
          </Feature>
        </Features>
      </LoginCard>
    </LoginContainer>
  );
};

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(-45deg, #0f0f1a, #1a1a2e, #16213e, #1e3a5f);
  background-size: 400% 400%;
  animation: ${gradientAnimation} 15s ease infinite;
  overflow: hidden;
  position: relative;
`;

const BackgroundAnimation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 30%, rgba(41, 41, 122, 0.15) 0%, transparent 40%),
              radial-gradient(circle at 90% 80%, rgba(66, 133, 244, 0.1) 0%, transparent 40%),
              radial-gradient(circle at 60% 10%, rgba(66, 133, 244, 0.05) 0%, transparent 30%);
  z-index: 1;
`;

const LoginCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 400px;
  background: rgba(17, 17, 34, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2), 
              0 5px 15px rgba(0, 0, 0, 0.1),
              inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 2;
  animation: ${fadeIn} 1s ease-out;
`;

const LogoContainer = styled.div`
  margin-bottom: 30px;
  text-align: center;
  animation: ${floatAnimation} 6s ease-in-out infinite;
`;

const LogoText = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 5px;
  margin: 0;
  background: linear-gradient(to right, #00b4db, #0083b0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 5px 15px rgba(0, 180, 219, 0.3);
`;

const Subtitle = styled.h2`
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 400;
  margin-top: 8px;
  opacity: 0.8;
`;

const Description = styled.p`
  color: #b3b3cc;
  text-align: center;
  margin-bottom: 30px;
  font-size: 1rem;
  line-height: 1.6;
`;

const GoogleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(66, 133, 244, 0.3);
  margin-bottom: 24px;

  &:hover {
    background-color: #357ae8;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(66, 133, 244, 0.4);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    background-color: #7aa6f0;
    cursor: not-allowed;
    transform: none;
  }
`;

const GoogleIcon = styled.span`
  margin-right: 12px;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 50%;
  padding: 6px;
`;

const ErrorMessage = styled.p`
  color: #ff6b6b;
  margin-bottom: 20px;
  font-size: 0.9rem;
  text-align: center;
  padding: 10px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  width: 100%;
`;

const Features = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 20px;
`;

const Feature = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #b3b3cc;
  font-size: 0.85rem;
  text-align: center;
  flex: 1;
`;

const FeatureIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 8px;
`;

export default Login;