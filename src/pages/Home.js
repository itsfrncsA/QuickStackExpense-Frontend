import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const Home = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    total: 0,
    recentTotal: 0,
    count: 0,
    byCategory: {}
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const expensesRes = await axios.get(API_URL + '/api/expenses', {
        headers: { 'x-auth-token': token }
      });
      setExpenses(expensesRes.data);
      
      const summaryRes = await axios.get(API_URL + '/api/expenses/summary', {
        headers: { 'x-auth-token': token }
      });
      setSummary(summaryRes.data);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(API_URL + '/api/expenses', formData, {
        headers: { 'x-auth-token': token }
      });
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      alert('Error adding expense: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(API_URL + '/api/expenses/' + id, {
          headers: { 'x-auth-token': token }
        });
        fetchData();
      } catch (err) {
        alert('Error deleting expense');
      }
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Food: '??',
      Transport: '??',
      Shopping: '???',
      Entertainment: '??',
      Bills: '??',
      Healthcare: '??',
      Education: '??',
      Other: '??'
    };
    return icons[category] || '??';
  };

  const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your finances...</p>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>??</span>
          <span style={styles.logoText}>QuickStack</span>
        </div>
        
        <div style={styles.walletSection}>
          <h3 style={styles.sectionTitle}>Wallets</h3>
          <div style={styles.walletCard}>
            <div style={styles.walletIcon}>??</div>
            <div style={styles.walletInfo}>
              <div style={styles.walletName}>Cash Wallet</div>
              <div style={styles.walletBalance}>{formatAmount(summary.total)}</div>
            </div>
          </div>
          <button style={styles.addWalletBtn}>+ Add New Wallet</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Overview</h1>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>??</div>
            <div style={styles.statInfo}>
              <div style={styles.statLabel}>Total Balance</div>
              <div style={styles.statValue}>{formatAmount(summary.total)}</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>??</div>
            <div style={styles.statInfo}>
              <div style={styles.statLabel}>Total Expenses</div>
              <div style={styles.statValue}>{formatAmount(summary.total)}</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>??</div>
            <div style={styles.statInfo}>
              <div style={styles.statLabel}>Last 30 Days</div>
              <div style={styles.statValue}>{formatAmount(summary.recentTotal)}</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>??</div>
            <div style={styles.statInfo}>
              <div style={styles.statLabel}>Transactions</div>
              <div style={styles.statValue}>{summary.count}</div>
            </div>
          </div>
        </div>

        {/* Add Expense Button */}
        {!showAddForm ? (
          <button style={styles.addButton} onClick={() => setShowAddForm(true)}>
            + Add New Transaction
          </button>
        ) : (
          <div style={styles.formContainer}>
            <h3 style={styles.formTitle}>New Transaction</h3>
            <form onSubmit={handleAddExpense} style={styles.form}>
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                style={styles.formInput}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount (?)"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
                style={styles.formInput}
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                style={styles.formInput}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                ))}
              </select>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                style={styles.formInput}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={styles.formInput}
              />
              <div style={styles.formButtons}>
                <button type="submit" style={styles.submitBtn}>Save</button>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions List */}
        <div style={styles.transactionsSection}>
          <h3 style={styles.sectionTitle}>Recent Transactions</h3>
          {expenses.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>??</div>
              <p>No transactions yet</p>
              <p style={styles.emptySubtext}>Click "Add New Transaction" to get started</p>
            </div>
          ) : (
            <div style={styles.transactionsList}>
              {expenses.slice(0, 10).map(expense => (
                <div key={expense._id} style={styles.transactionItem}>
                  <div style={styles.transactionIcon}>{getCategoryIcon(expense.category)}</div>
                  <div style={styles.transactionInfo}>
                    <div style={styles.transactionTitle}>{expense.title}</div>
                    <div style={styles.transactionDate}>{new Date(expense.date).toLocaleDateString()}</div>
                    {expense.description && <div style={styles.transactionDesc}>{expense.description}</div>}
                  </div>
                  <div style={styles.transactionAmount}>
                    <span style={styles.amountNegative}>-{formatAmount(expense.amount)}</span>
                    <button style={styles.deleteIcon} onClick={() => handleDelete(expense._id)}>???</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#1a1a2e',
    color: 'white',
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '2rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  logoIcon: {
    fontSize: '2rem',
  },
  logoText: {
    color: 'white',
  },
  walletSection: {
    marginTop: '1rem',
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#aaa',
    marginBottom: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  walletCard: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '1rem',
  },
  walletIcon: {
    fontSize: '2rem',
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: '0.85rem',
    color: '#aaa',
  },
  walletBalance: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  addWalletBtn: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'transparent',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
  },
  header: {
    marginBottom: '2rem',
  },
  pageTitle: {
    fontSize: '2rem',
    color: '#1a1a2e',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  statIcon: {
    fontSize: '2.5rem',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '0.25rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  addButton: {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '2rem',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  formTitle: {
    fontSize: '1.25rem',
    marginBottom: '1rem',
    color: '#1a1a2e',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formInput: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  formButtons: {
    display: 'flex',
    gap: '1rem',
  },
  submitBtn: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  cancelBtn: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  transactionsSection: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  transactionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  transactionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    borderBottom: '1px solid #eee',
  },
  transactionIcon: {
    fontSize: '2rem',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#1a1a2e',
  },
  transactionDate: {
    fontSize: '0.75rem',
    color: '#999',
  },
  transactionDesc: {
    fontSize: '0.75rem',
    color: '#aaa',
    marginTop: '0.25rem',
  },
  transactionAmount: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  amountNegative: {
    color: '#f44336',
    fontWeight: '600',
  },
  deleteIcon: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    opacity: 0.5,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
    gap: '1rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #4CAF50',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#999',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  emptySubtext: {
    fontSize: '0.85rem',
    marginTop: '0.5rem',
  },
};

// Add animation style
const styleSheet = document.createElement('style');
styleSheet.textContent = \
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
\;
document.head.appendChild(styleSheet);

export default Home;
