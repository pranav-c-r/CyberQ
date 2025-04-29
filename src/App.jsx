import Chatbot from './Chatbot' // Make sure this path matches your file structure
import './index.css';

function App() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a192f',
      padding: '20px'
    }}>
      <Chatbot />
    </div>
  )
}

export default App