import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // make sure this is correctly set up
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import './index.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a192f',
      padding: '20px'
    }}>
      {user ? <Chatbot user={user} /> : <Login />}
    </div>
  );
}

export default App;
