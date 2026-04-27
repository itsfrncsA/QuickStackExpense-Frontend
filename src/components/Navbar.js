import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <img 
            src="/quicksatcklogo.png" 
            alt="QuickStack" 
            style={styles.logoImage}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span style={styles.logoText}>QuickStack</span>
        </Link>
        <div style={styles.tagline}>
          <span style={styles.taglineText}>TRACK EXPENSES. TAKE CONTROL.</span>
        </div>
        {user && (
          <div style={styles.navLinks}>
            <span style={styles.welcome}>Welcome, {user.name}!</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#1a1a2e',
    padding: '1rem 2rem',
    color: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  logoImage: {
    height: '40px',
    width: 'auto',
    objectFit: 'contain',
  },
  logoText: {
    color: 'white',
    fontSize: '1.3rem',
    fontWeight: 'bold',
  },
  tagline: {
    flex: 1,
    textAlign: 'center',
  },
  taglineText: {
    fontSize: '0.85rem',
    letterSpacing: '2px',
    color: '#aaa',
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '0.25rem 1rem',
    borderRadius: '20px',
  },
  navLinks: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  welcome: {
    marginRight: '1rem',
    fontSize: '0.9rem',
    color: '#ddd',
  },
  logoutBtn: {
    padding: '0.5rem 1.25rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
};

export default Navbar;
