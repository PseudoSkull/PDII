import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Art Deco navigation component
 * Provides elegant navigation between the four main sections
 */
function Navigation() {
  const navItems = [
    { path: '/gather', label: 'GATHER', description: 'Queue & Process' },
    { path: '/transcribe', label: 'TRANSCRIBE', description: 'Extract Text' },
    { path: '/organize', label: 'ORGANIZE', description: 'Categorize Content' },
    { path: '/consume', label: 'CONSUME', description: 'View Results' }
  ];

  return (
    <nav className="navigation">
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <span className="nav-label">{item.label}</span>
              <span className="nav-description">{item.description}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;