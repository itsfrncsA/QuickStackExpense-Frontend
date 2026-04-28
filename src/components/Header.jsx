import React from 'react';

const Header = ({ darkMode, setDarkMode }) => {
  return (
    <header style={{
      backgroundColor: darkMode ? '#1E1E2E' : '#FFFFFF',
      borderBottom: '1px solid ' + (darkMode ? '#2A2A3E' : '#E5E7EB'),
      padding: '1rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/layout.png" alt="QuickStack" style={{ height: '40px' }} />
          <h1 style={{ fontSize: '1.25rem', color: darkMode ? '#FFFFFF' : '#1A1A2E', margin: 0 }}>QuickStack</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              backgroundColor: darkMode ? '#2A2A3E' : '#E5E7EB'
            }}
          >
            <img 
              src={darkMode ? "/lightmode.png" : "/nightmode.png"} 
              alt="Theme"
              style={{ width: '24px', height: '24px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#1E3A8A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              FA
            </div>
            <span style={{ color: darkMode ? '#FFFFFF' : '#1A1A2E', fontWeight: '500' }}>Welcome, Francis</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
