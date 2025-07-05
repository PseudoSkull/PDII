import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Gather from './components/Gather';
import Transcribe from './components/Transcribe';
import Organize from './components/Organize';
import Consume from './components/Consume';
import './styles/App.css';

/**
 * Main App component with 1920s Art Deco styling
 * Implements client-side routing with default redirect to /gather
 */
function App() {
  return (
    <Router>
      <div className="app">
        {/* Art Deco header with navigation */}
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">
              <span className="title-main">Public Domain</span>
              <span className="title-sub">Integration Infrastructure</span>
            </h1>
            <p className="app-subtitle">Elegant Task Management • Est. MMXXV</p>
          </div>
          <Navigation />
        </header>

        {/* Main content area */}
        <main className="app-main">
          <div className="content-container">
            <Routes>
              {/* Default route redirects to gather */}
              <Route path="/" element={<Navigate to="/gather" replace />} />
              
              {/* Main application sections */}
              <Route path="/gather" element={<Gather />} />
              <Route path="/transcribe" element={<Transcribe />} />
              <Route path="/organize" element={<Organize />} />
              <Route path="/consume" element={<Consume />} />
              
              {/* Catch-all route for unknown paths */}
              <Route path="*" element={<Navigate to="/gather" replace />} />
            </Routes>
          </div>
        </main>

        {/* Art Deco footer */}
        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-ornament"></div>
            <p className="footer-text">PDII (Public Domain Integration Infrastructure) v0.1.0</p>
            <div className="footer-ornament"></div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;