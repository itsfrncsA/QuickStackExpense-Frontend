import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const Home = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    recentTotal: 0,
    count: 0,
    byCategory: {}
  });
  
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('budgets');
    return saved ? JSON.parse(saved) : {
      Food: { limit: 11500, spent: 0 },
      Transport: { limit: 5000, spent: 0 },
      Shopping: { limit: 3000, spent: 0 },
      Entertainment: { limit: 2000, spent: 0 },
      Bills: { limit: 8000, spent: 0 },
      Healthcare: { limit: 2000, spent: 0 },
      Education: { limit: 3000, spent: 0 },
      Other: { limit: 2000, spent: 0 }
    };
  });
  
  const [newBudget, setNewBudget] = useState({
    category: 'Food',
    limit: '',
    period: 'monthly'
  });
  
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
      
      const updatedBudgets = { ...budgets };
      Object.keys(updatedBudgets).forEach(cat => {
        updatedBudgets[cat].spent = summaryRes.data.byCategory[cat] || 0;
      });
      setBudgets(updatedBudgets);
      localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const updatedBudgets = { ...budgets };
    Object.keys(updatedBudgets).forEach(cat => {
      updatedBudgets[cat].spent = summary.byCategory[cat] || 0;
    });
    setBudgets(updatedBudgets);
    localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
  }, [summary.byCategory]);

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

  const handleSetBudget = () => {
    if (!newBudget.limit || parseFloat(newBudget.limit) <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }
    
    const updatedBudgets = {
      ...budgets,
      [newBudget.category]: {
        limit: parseFloat(newBudget.limit),
        spent: budgets[newBudget.category]?.spent || 0
      }
    };
    setBudgets(updatedBudgets);
    localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
    setShowBudgetForm(false);
    setNewBudget({ category: 'Food', limit: '', period: 'monthly' });
    alert('Budget for ' + newBudget.category + ' set to ?' + parseFloat(newBudget.limit).toLocaleString());
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

  const getProgressColor = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return '#f44336';
    if (percentage >= 80) return '#ff9800';
    return '#4CAF50';
  };

  const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

  if (loading) {
    return React.createElement('div', { style: styles.loadingContainer },
      React.createElement('div', { style: styles.spinner }),
      React.createElement('p', null, 'Loading your finances...')
    );
  }

  const renderOverview = () => {
    return React.createElement(React.Fragment, null,
      React.createElement('div', { style: styles.statsGrid },
        React.createElement('div', { style: styles.statCard },
          React.createElement('div', { style: styles.statIcon }, '??'),
          React.createElement('div', { style: styles.statInfo },
            React.createElement('div', { style: styles.statLabel }, 'Total Balance'),
            React.createElement('div', { style: styles.statValue }, formatAmount(summary.total))
          )
        ),
        React.createElement('div', { style: styles.statCard },
          React.createElement('div', { style: styles.statIcon }, '??'),
          React.createElement('div', { style: styles.statInfo },
            React.createElement('div', { style: styles.statLabel }, 'Total Expenses'),
            React.createElement('div', { style: styles.statValue }, formatAmount(summary.total))
          )
        ),
        React.createElement('div', { style: styles.statCard },
          React.createElement('div', { style: styles.statIcon }, '??'),
          React.createElement('div', { style: styles.statInfo },
            React.createElement('div', { style: styles.statLabel }, 'Last 30 Days'),
            React.createElement('div', { style: styles.statValue }, formatAmount(summary.recentTotal))
          )
        ),
        React.createElement('div', { style: styles.statCard },
          React.createElement('div', { style: styles.statIcon }, '??'),
          React.createElement('div', { style: styles.statInfo },
            React.createElement('div', { style: styles.statLabel }, 'Transactions'),
            React.createElement('div', { style: styles.statValue }, summary.count)
          )
        )
      ),
      !showAddForm ?
        React.createElement('button', { style: styles.addButton, onClick: () => setShowAddForm(true) }, '+ Add New Transaction') :
        React.createElement('div', { style: styles.formContainer },
          React.createElement('h3', { style: styles.formTitle }, 'New Transaction'),
          React.createElement('form', { onSubmit: handleAddExpense, style: styles.form },
            React.createElement('input', { type: 'text', placeholder: 'Title', value: formData.title, onChange: (e) => setFormData({...formData, title: e.target.value}), required: true, style: styles.formInput }),
            React.createElement('input', { type: 'number', step: '0.01', placeholder: 'Amount (?)', value: formData.amount, onChange: (e) => setFormData({...formData, amount: e.target.value}), required: true, style: styles.formInput }),
            React.createElement('select', { value: formData.category, onChange: (e) => setFormData({...formData, category: e.target.value}), style: styles.formInput },
              categories.map(cat => React.createElement('option', { key: cat, value: cat }, getCategoryIcon(cat), ' ', cat))
            ),
            React.createElement('input', { type: 'date', value: formData.date, onChange: (e) => setFormData({...formData, date: e.target.value}), style: styles.formInput }),
            React.createElement('input', { type: 'text', placeholder: 'Description (optional)', value: formData.description, onChange: (e) => setFormData({...formData, description: e.target.value}), style: styles.formInput }),
            React.createElement('div', { style: styles.formButtons },
              React.createElement('button', { type: 'submit', style: styles.submitBtn }, 'Save'),
              React.createElement('button', { type: 'button', style: styles.cancelBtn, onClick: () => setShowAddForm(false) }, 'Cancel')
            )
          )
        )
    );
  };

  const renderBudgets = () => {
    return React.createElement(React.Fragment, null,
      React.createElement('div', { style: styles.budgetsHeader },
        React.createElement('p', { style: styles.budgetsSubtitle }, 'Take control of your expenses and save more money with budgets!'),
        !showBudgetForm && React.createElement('button', { style: styles.createBudgetBtn, onClick: () => setShowBudgetForm(true) }, '+ Create a New Budget')
      ),
      showBudgetForm && React.createElement('div', { style: styles.budgetFormContainer },
        React.createElement('h3', { style: styles.formTitle }, 'Set New Budget'),
        React.createElement('div', { style: styles.budgetForm },
          React.createElement('select', { value: newBudget.category, onChange: (e) => setNewBudget({...newBudget, category: e.target.value}), style: styles.formInput },
            categories.map(cat => React.createElement('option', { key: cat, value: cat }, getCategoryIcon(cat), ' ', cat))
          ),
          React.createElement('input', { type: 'number', step: '0.01', placeholder: 'Monthly Limit (?)', value: newBudget.limit, onChange: (e) => setNewBudget({...newBudget, limit: e.target.value}), style: styles.formInput }),
          React.createElement('div', { style: styles.formButtons },
            React.createElement('button', { onClick: handleSetBudget, style: styles.submitBtn }, 'Set Budget'),
            React.createElement('button', { onClick: () => setShowBudgetForm(false), style: styles.cancelBtn }, 'Cancel')
          )
        )
      ),
      React.createElement('div', { style: styles.budgetsGrid },
        Object.entries(budgets).map(([category, data]) => {
          const spent = data.spent || 0;
          const limit = data.limit || 0;
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;
          const remaining = limit - spent;
          return React.createElement('div', { key: category, style: styles.budgetCard },
            React.createElement('div', { style: styles.budgetHeader },
              React.createElement('div', { style: styles.budgetCategory },
                React.createElement('span', { style: styles.budgetIcon }, getCategoryIcon(category)),
                React.createElement('span', { style: styles.budgetName }, category)
              ),
              React.createElement('div', { style: styles.budgetPeriod }, 'All wallets ? Monthly')
            ),
            React.createElement('div', { style: styles.budgetAmounts },
              React.createElement('div', { style: styles.budgetLeft },
                remaining > 0 ?
                  React.createElement('span', { style: styles.budgetLeftAmount }, formatAmount(remaining), ' left') :
                  React.createElement('span', { style: { color: '#f44336' } }, 'EXCEEDED by ', formatAmount(Math.abs(remaining)))
              ),
              React.createElement('div', { style: styles.budgetTotal }, 'From ', formatAmount(limit))
            ),
            React.createElement('div', { style: styles.progressContainer },
              React.createElement('div', { style: styles.progressBar },
                React.createElement('div', { style: { ...styles.progressFill, width: Math.min(percentage, 100) + '%', backgroundColor: getProgressColor(spent, limit) } })
              ),
              React.createElement('div', { style: styles.budgetPercentage }, percentage.toFixed(1), '%')
            ),
            React.createElement('div', { style: styles.budgetDates }, 'Apr 27, 2026 - May 26, 2026')
          );
        })
      )
    );
  };

  const styles = {
    appContainer: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' },
    sidebar: { width: '280px', backgroundColor: '#1a1a2e', color: 'white', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' },
    logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold' },
    logoIcon: { fontSize: '2rem' },
    logoText: { color: 'white' },
    navMenu: { marginBottom: '2rem' },
    navItem: { width: '100%', padding: '0.75rem 1rem', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', color: '#aaa', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', marginBottom: '0.5rem' },
    navItemActive: { backgroundColor: '#16213e', color: 'white' },
    walletSection: { marginTop: 'auto' },
    sectionTitle: { fontSize: '0.85rem', fontWeight: '500', color: '#aaa', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
    walletCard: { backgroundColor: '#16213e', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px' },
    walletIcon: { fontSize: '2rem' },
    walletInfo: { flex: 1 },
    walletName: { fontSize: '0.85rem', color: '#aaa' },
    walletBalance: { fontSize: '1.25rem', fontWeight: 'bold', color: '#4CAF50' },
    mainContent: { flex: 1, padding: '2rem', overflowY: 'auto' },
    header: { marginBottom: '2rem' },
    pageTitle: { fontSize: '2rem', color: '#1a1a2e' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
    statCard: { backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    statIcon: { fontSize: '2.5rem' },
    statInfo: { flex: 1 },
    statLabel: { fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' },
    statValue: { fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a2e' },
    addButton: { width: '100%', padding: '1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginBottom: '2rem' },
    formContainer: { backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    formTitle: { fontSize: '1.25rem', marginBottom: '1rem', color: '#1a1a2e' },
    form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    formInput: { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' },
    formButtons: { display: 'flex', gap: '1rem' },
    submitBtn: { flex: 1, padding: '0.75rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    cancelBtn: { flex: 1, padding: '0.75rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    budgetsHeader: { marginBottom: '2rem' },
    budgetsSubtitle: { color: '#666', marginBottom: '1rem', fontSize: '0.95rem' },
    createBudgetBtn: { padding: '0.75rem 1.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' },
    budgetFormContainer: { backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    budgetForm: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
    budgetsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' },
    budgetCard: { backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    budgetHeader: { marginBottom: '1rem' },
    budgetCategory: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' },
    budgetIcon: { fontSize: '1.5rem' },
    budgetName: { fontSize: '1.1rem', fontWeight: '600', color: '#1a1a2e' },
    budgetPeriod: { fontSize: '0.75rem', color: '#999' },
    budgetAmounts: { marginBottom: '1rem' },
    budgetLeft: { fontSize: '1.25rem', fontWeight: 'bold' },
    budgetLeftAmount: { color: '#4CAF50' },
    budgetTotal: { fontSize: '0.8rem', color: '#666' },
    progressContainer: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
    progressBar: { flex: 1, height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' },
    budgetPercentage: { fontSize: '0.8rem', color: '#666', minWidth: '45px' },
    budgetDates: { fontSize: '0.7rem', color: '#999', paddingTop: '0.5rem', borderTop: '1px solid #eee' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' },
    spinner: { width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #4CAF50', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  };

  return React.createElement('div', { style: styles.appContainer },
    React.createElement('div', { style: styles.sidebar },
      React.createElement('div', { style: styles.logo },
        React.createElement('span', { style: styles.logoIcon }, '??'),
        React.createElement('span', { style: styles.logoText }, 'QuickStack')
      ),
      React.createElement('div', { style: styles.navMenu },
        React.createElement('button', { style: { ...styles.navItem, ...(activeTab === 'overview' ? styles.navItemActive : {}) }, onClick: () => setActiveTab('overview') }, '?? Dashboard'),
        React.createElement('button', { style: { ...styles.navItem, ...(activeTab === 'budgets' ? styles.navItemActive : {}) }, onClick: () => setActiveTab('budgets') }, '?? Budgets')
      ),
      React.createElement('div', { style: styles.walletSection },
        React.createElement('h3', { style: styles.sectionTitle }, 'Wallets'),
        React.createElement('div', { style: styles.walletCard },
          React.createElement('div', { style: styles.walletIcon }, '??'),
          React.createElement('div', { style: styles.walletInfo },
            React.createElement('div', { style: styles.walletName }, 'Cash Wallet'),
            React.createElement('div', { style: styles.walletBalance }, formatAmount(summary.total))
          )
        )
      )
    ),
    React.createElement('div', { style: styles.mainContent },
      React.createElement('div', { style: styles.header },
        React.createElement('h1', { style: styles.pageTitle }, activeTab === 'overview' ? 'Dashboard' : 'Budgets')
      ),
      activeTab === 'overview' ? renderOverview() : renderBudgets()
    )
  );
};

export default Home;
