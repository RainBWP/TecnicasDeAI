import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import AlgoritmosGeneticos from './components/AlgoritmosGeneticos';
import FeedbackNN from './components/FeedbackNN';
import Main from './components/Main';

function App() {
  return (
    <Router basename="/TecnicasDeAI">
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/algoritmos-geneticos" element={<AlgoritmosGeneticos />} />
        <Route path="/feedback-neural-network" element={<FeedbackNN />} />
        <Route path="*" element={<Navigate to="/" replace  />} />
      </Routes>
    </Router>
  );
}

export default App;