// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PesquisarCamera from './pages/PesquisarCamera';
import Consulta from './pages/Consulta';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h1>Inventário Patrimonial <br/> BESNI</h1>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '40px' }}>
        
        <Link to="/Consulta">
          <button style={{ padding: 10, fontSize: 16, width: 200 }}>Consulta Manual</button>
        </Link>

        <Link to="/PesquisarCamera">
          <button style={{ padding: 10, fontSize: 16, width: 200, marginTop: '15px' }}>Leitor de Câmera</button>
        </Link>

      </div>
            <div style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        opacity: 0.5,
        fontSize: 12,
        color: '#555',
        pointerEvents: 'none'
      }}>
        V - 1.1 (Revisão hoje)
      
      {/* 23/10/2025 - Adicionado mais sobre o produto */}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/PesquisarCamera" element={<PesquisarCamera />} />
        <Route path="/Consulta" element={<Consulta />} />
      </Routes>
    </Router>
  );
}

export default App;
