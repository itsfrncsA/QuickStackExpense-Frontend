import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://quickstackexpense.onrender.com';

const Home = () => {
  // State with proper defaults
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [summary, setSummary] = useState({ total: 0, recentTotal: 0, count: 0, byCategory: {} });
  const [income, setIncome] = useState(() => {
    const saved = localStorage.getItem('monthlyIncome');
    return saved && !isNaN(parseFloat(saved)) ? parseFloat(saved) : 0;
  });
  const [savingsGoals, setSavingsGoals] = useState(() => {
    const saved = localStorage.getItem('savingsGoals');
    return saved ? JSON.parse(saved) : [];
  });
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    description: ''
  });
  const [incomeAmount, setIncomeAmount] = useState('');
  const [notification, setNotification] = useState(null);

  const formatAmount = (amount) => {
    const numAmount = amount && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [expensesRes, summaryRes] = await Promise.all([
        axios.get(API_URL + '/api/expenses', { headers: { 'x-auth-token': token } }),
        axios.get(API_URL + '/api/expenses/summary', { headers: { 'x-auth-token': token } })
      ]);
      setExpenses(expensesRes.data || []);
      setSummary(summaryRes.data || { total: 0, recentTotal: 0, count: 0, byCategory: {} });
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const total = summary.total || 0;
    if (income > 0 && total > income * 0.5) {
      showNotification('You have spent over 50% of your monthly income!', 'warning');
    }
  }, [summary.total, income]);

  const handleSetIncome = () => {
    const incomeValue = parseFloat(incomeAmount);
    if (isNaN(incomeValue) || incomeValue <= 0) {
      alert('Please enter a valid income amount');
      return;
    }
    setIncome(incomeValue);
    localStorage.setItem('monthlyIncome', incomeValue);
    setShowIncomeModal(false);
    setIncomeAmount('');
    showNotification('Monthly income set to ' + formatAmount(incomeValue), 'success');
  };

  const checkDuplicateExpense = (newExpense) => {
    return expenses.some(expense => 
      expense.title?.toLowerCase() === newExpense.title?.toLowerCase() &&
      Math.abs((expense.amount || 0) - (parseFloat(newExpense.amount) || 0)) < 0.01 &&
      expense.category === newExpense.category &&
      expense.date === newExpense.date
    );
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amountValue = parseFloat(formData.amount);
    
    if (!formData.title?.trim()) {
      alert('Please enter a title');
      return;
    }
    if (isNaN(amountValue) || amountValue <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (checkDuplicateExpense(formData)) {
      if (!window.confirm('This expense looks similar to an existing one. Add it anyway?')) {
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(API_URL + '/api/expenses', {
        title: formData.title.trim(),
        amount: amountValue,
        category: formData.category,
        date: formData.date,
        description: formData.description?.trim() || ''
      }, { headers: { 'x-auth-token': token } });
      
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      setShowModal(false);
      fetchData();
      showNotification('Expense added successfully!', 'success');
    } catch (err) {
      alert('Error adding expense: ' + (err.response?.data?.message || err.message));
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
        showNotification('Expense deleted', 'success');
      } catch (err) {
        alert('Error deleting expense');
      }
    }
  };

  const handleCreateGoal = () => {
    const targetAmount = parseFloat(goalForm.targetAmount);
    if (!goalForm.name?.trim()) {
      alert('Please enter a goal name');
      return;
    }
    if (isNaN(targetAmount) || targetAmount <= 0) {
      alert('Please enter a valid target amount');
      return;
    }
    
    const newGoal = {
      id: Date.now(),
      name: goalForm.name.trim(),
      targetAmount: targetAmount,
      currentAmount: 0,
      description: goalForm.description?.trim() || '',
      createdAt: new Date().toISOString()
    };
    
    const updatedGoals = [...savingsGoals, newGoal];
    setSavingsGoals(updatedGoals);
    localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
    setGoalForm({ name: '', targetAmount: '', description: '' });
    setShowGoalModal(false);
    showNotification('Savings goal created!', 'success');
  };

  const handleExport = () => {
    const data = expenses.map(exp => ({
      Title: exp.title || '',
      Amount: (exp.amount || 0).toFixed(2),
      Category: exp.category || '',
      Date: exp.date ? new Date(exp.date).toLocaleDateString() : '',
      Description: exp.description || ''
    }));
    
    const csv = [['Title', 'Amount (PHP)', 'Category', 'Date', 'Description'], ...data.map(d => Object.values(d))];
    const csvContent = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = expenses_.csv;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exported as CSV', 'success');
    setShowExportMenu(false);
  };

  const totalExpenses = summary.total || 0;
  const remainingBudget = (income || 0) - totalExpenses;
  const budgetPercentage = income > 0 ? (totalExpenses / income) * 100 : 0;
  const totalSaved = savingsGoals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
  const mainSavingsGoal = savingsGoals[0];
  const savingsPercentage = mainSavingsGoal?.targetAmount > 0 ? ((mainSavingsGoal.currentAmount || 0) / mainSavingsGoal.targetAmount) * 100 : 0;

  const filteredExpensesList = (expenses || []).filter(exp => {
    if (selectedCategory !== 'All' && exp.category !== selectedCategory) return false;
    if (searchTerm && !(exp.title || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(exp.date) < weekAgo) return false;
    }
    if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      if (new Date(exp.date) < monthAgo) return false;
    }
    return true;
  });

  const groupedExpenses = filteredExpensesList.reduce((acc, exp) => {
    const key = exp.category || 'Other';
    if (!acc[key]) acc[key] = { count: 0, total: 0, items: [], category: key };
    acc[key].count++;
    acc[key].total += exp.amount || 0;
    acc[key].items.push(exp);
    return acc;
  }, {});

  const categories = ['All', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];
  const categoryDisplay = {
    Food: 'Food',
    Transport: 'Transport',
    Shopping: 'Shopping',
    Entertainment: 'Entertainment',
    Bills: 'Bills',
    Healthcare: 'Healthcare',
    Education: 'Education',
    Other: 'Other'
  };

  const styles = {
    light: {
      background: '#F5F7FA',
      cardBg: '#FFFFFF',
      text: '#1A1A2E',
      textSecondary: '#666666',
      border: '#E5E7EB',
      cardShadow: '0 4px 12px rgba(0,0,0,0.05)',
      hoverShadow: '0 8px 24px rgba(0,0,0,0.1)'
    },
    dark: {
      background: '#121212',
      cardBg: '#1E1E2E',
      text: '#FFFFFF',
      textSecondary: '#A0A0B0',
      border: '#2A2A3E',
      cardShadow: '0 4px 12px rgba(0,0,0,0.2)',
      hoverShadow: '0 8px 24px rgba(0,0,0,0.3)'
    }
  };

  const theme = darkMode ? styles.dark : styles.light;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: theme.background,
        color: theme.text
      }}>
        <div>Loading your finances...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: theme.background, 
      minHeight: '100vh',
      fontFamily: "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: theme.cardBg,
        borderBottom: '1px solid ' + theme.border,
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
            <h1 style={{ fontSize: '1.25rem', color: theme.text, margin: 0 }}>QuickStack</h1>
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
                backgroundColor: theme.border
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
              <span style={{ color: theme.text, fontWeight: '500' }}>Welcome, Francis</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Notification */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            backgroundColor: notification.type === 'warning' ? '#DC2626' : '#10B981',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '0.875rem'
          }}>
            {notification.message}
          </div>
        )}

        {/* Dashboard Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Monthly Income Card */}
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: theme.cardShadow,
            transition: 'transform 0.2s, boxShadow 0.2s',
            borderLeft: '4px solid #10B981'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Income</span>
              <span style={{ fontSize: '1.5rem' }}>$</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10B981', marginBottom: '0.25rem' }}>
              {income > 0 ? formatAmount(income) : 'Not set'}
            </div>
            {income === 0 && (
              <button
                onClick={() => setShowIncomeModal(true)}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: '500'
                }}
              >
                Set Income
              </button>
            )}
          </div>

          {/* Total Expenses Card */}
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: theme.cardShadow,
            transition: 'transform 0.2s, boxShadow 0.2s',
            borderLeft: '4px solid #DC2626'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Expenses</span>
              <span style={{ fontSize: '1.5rem' }}>??</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#DC2626' }}>
              {formatAmount(totalExpenses)}
            </div>
          </div>

          {/* Remaining Budget Card */}
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: theme.cardShadow,
            transition: 'transform 0.2s, boxShadow 0.2s',
            borderLeft: '4px solid #14B8A6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#14B8A6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remaining Budget</span>
              <span style={{ fontSize: '1.5rem' }}>??</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#14B8A6' }}>
              {income > 0 ? formatAmount(remainingBudget) : 'Set income'}
            </div>
            {income > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ height: '4px', backgroundColor: theme.border, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: Math.min(budgetPercentage, 100) + '%',
                    height: '100%',
                    backgroundColor: budgetPercentage > 80 ? '#DC2626' : '#14B8A6',
                    borderRadius: '4px'
                  }}></div>
                </div>
                <div style={{ fontSize: '0.7rem', color: theme.textSecondary, marginTop: '0.25rem', textAlign: 'right' }}>
                  {budgetPercentage.toFixed(1)}% spent
                </div>
              </div>
            )}
          </div>

          {/* Savings Card */}
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: theme.cardShadow,
            transition: 'transform 0.2s, boxShadow 0.2s',
            borderLeft: '4px solid #3B82F6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Savings</span>
              <span style={{ fontSize: '1.5rem' }}>??</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3B82F6' }}>
              {formatAmount(totalSaved)}
            </div>
            <button
              onClick={() => setShowGoalModal(true)}
              style={{
                marginTop: '0.5rem',
                padding: '0.25rem 0.75rem',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: '500'
              }}
            >
              Set Goal
            </button>
          </div>
        </div>

        {/* Savings Goal Progress */}
        {mainSavingsGoal && (
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '2rem',
            boxShadow: theme.cardShadow
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ color: theme.text, margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                Target: {mainSavingsGoal.name}
              </h3>
              <span style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: '600' }}>
                {savingsPercentage.toFixed(1)}% Complete
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: theme.border, borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{
                width: Math.min(savingsPercentage, 100) + '%',
                height: '100%',
                backgroundColor: savingsPercentage >= 100 ? '#4CAF50' : '#3B82F6',
                borderRadius: '8px',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>
                Saved: {formatAmount(mainSavingsGoal.currentAmount || 0)}
              </span>
              <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>
                Target: {formatAmount(mainSavingsGoal.targetAmount)}
              </span>
            </div>
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: theme.background, borderRadius: '8px' }}>
              <span style={{ color: '#3B82F6', fontSize: '0.7rem' }}>
                {savingsPercentage >= 100 ? 'Congratulations! Goal achieved!' : 'Only ' + formatAmount(mainSavingsGoal.targetAmount - mainSavingsGoal.currentAmount) + ' more to go!'}
              </span>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Expense Categories Chart */}
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: theme.cardShadow
          }}>
            <h3 style={{ color: theme.text, marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Expense Categories</h3>
            {Object.keys(summary.byCategory || {}).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: theme.textSecondary }}>
                No expenses yet. Add your first expense!
              </div>
            ) : (
              Object.entries(summary.byCategory || {}).map(([cat, amount]) => {
                const percentage = totalExpenses > 0 ? ((amount || 0) / totalExpenses) * 100 : 0;
                return (
                  <div key={cat} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: theme.text, fontSize: '0.85rem' }}>{categoryDisplay[cat] || cat}</span>
                      <span style={{ color: theme.textSecondary, fontSize: '0.8rem' }}>{formatAmount(amount)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: theme.border, borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: percentage + '%', height: '100%', backgroundColor: '#3B82F6', borderRadius: '6px' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Income vs Expenses Chart */}
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: theme.cardShadow
          }}>
            <h3 style={{ color: theme.text, marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Income vs Expenses</h3>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: theme.text, fontSize: '0.85rem' }}>Income</span>
                <span style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: '500' }}>{formatAmount(income)}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: theme.border, borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#10B981', borderRadius: '6px' }}></div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: theme.text, fontSize: '0.85rem' }}>Expenses</span>
                <span style={{ color: '#DC2626', fontSize: '0.85rem', fontWeight: '500' }}>{formatAmount(totalExpenses)}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: theme.border, borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: income > 0 ? Math.min((totalExpenses / income) * 100, 100) + '%' : '0%',
                  height: '100%',
                  backgroundColor: '#DC2626',
                  borderRadius: '6px'
                }}></div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid ' + theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme.text, fontSize: '0.85rem' }}>Savings Rate</span>
                <span style={{ color: '#14B8A6', fontWeight: 'bold', fontSize: '1rem' }}>
                  {income > 0 ? ((income - totalExpenses) / income * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{
          backgroundColor: theme.cardBg,
          borderRadius: '16px',
          padding: '1rem',
          marginBottom: '1.5rem',
          boxShadow: theme.cardShadow
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid ' + theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontSize: '0.85rem',
                  width: '180px'
                }}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid ' + theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontSize: '0.85rem'
                }}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid ' + theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontSize: '0.85rem'
                }}
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}
              >
                Export CSV
              </button>
              {showExportMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.25rem',
                  backgroundColor: theme.cardBg,
                  borderRadius: '8px',
                  boxShadow: theme.cardShadow,
                  zIndex: 10,
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={handleExport}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: theme.text,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.85rem'
                    }}
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expense List - Grouped */}
        <div style={{
          backgroundColor: theme.cardBg,
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: theme.cardShadow
        }}>
          <h3 style={{ color: theme.text, marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Recent Expenses</h3>
          {Object.keys(groupedExpenses).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: theme.textSecondary
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>??</div>
              <p>No expenses found</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Click the + button to add your first expense</p>
            </div>
          ) : (
            Object.entries(groupedExpenses).map(([category, data]) => (
              <div key={category} style={{ marginBottom: '1rem' }}>
                {/* Category Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: theme.background,
                  borderRadius: '12px',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: theme.text }}>{category}</div>
                      <div style={{ fontSize: '0.7rem', color: theme.textSecondary }}>{data.count} transactions</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#DC2626', fontSize: '1rem' }}>{formatAmount(data.total)}</div>
                </div>

                {/* Expense Items */}
                {data.items.map(expense => (
                  <div
                    key={expense._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.5rem 0.5rem 2rem',
                      borderBottom: '1px solid ' + theme.border
                    }}
                  >
                    <div>
                      <div style={{ color: theme.text, fontSize: '0.85rem' }}>{expense.title}</div>
                      <div style={{ fontSize: '0.65rem', color: theme.textSecondary }}>{new Date(expense.date).toLocaleDateString()}</div>
                      {expense.description && (
                        <div style={{ fontSize: '0.6rem', color: theme.textSecondary }}>{expense.description}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: '#DC2626', fontSize: '0.85rem', fontWeight: '500' }}>-{formatAmount(expense.amount)}</span>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: theme.textSecondary,
                          fontSize: '1rem',
                          padding: '0.25rem',
                          borderRadius: '4px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#1E3A8A',
          color: 'white',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 100,
          transition: 'transform 0.2s, boxShadow 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        +
      </button>

      {/* Add Expense Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: '20px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '450px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ color: theme.text, marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Add New Expense</h2>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid ' + theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontSize: '0.9rem'
                }}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount (PHP)"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid ' + theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontSize: '0.9rem'
                }}
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid ' + theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontSize: '0.9rem'
                }}
              >
                <option>Food</option>
                <option>Transport</option>
                <option>Shopping</option>
                <option>Entertainment</option>
                <option>Bills</option>
                <option>Healthcare</option>
                <option>Education</option>
                <option>Other</option>
              </select>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid ' + theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontSize: '0.9rem'
                }}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid ' + theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontSize: '0.9rem'
                }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#1E3A8A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#6B7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Income Modal */}
      {showIncomeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: '20px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '350px'
          }}>
            <h2 style={{ color: theme.text, marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Set Monthly Income</h2>
            <input
              type="number"
              step="0.01"
              placeholder="Monthly Income"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid ' + theme.border,
                backgroundColor: theme.background,
                color: theme.text,
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleSetIncome}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowIncomeModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: '20px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '350px'
          }}>
            <h2 style={{ color: theme.text, marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Create Savings Goal</h2>
            <input
              type="text"
              placeholder="Goal Name"
              value={goalForm.name}
              onChange={(e) => setGoalForm({...goalForm, name: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid ' + theme.border,
                backgroundColor: theme.background,
                color: theme.text,
                marginBottom: '0.75rem',
                fontSize: '0.9rem'
              }}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Target Amount"
              value={goalForm.targetAmount}
              onChange={(e) => setGoalForm({...goalForm, targetAmount: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid ' + theme.border,
                backgroundColor: theme.background,
                color: theme.text,
                marginBottom: '0.75rem',
                fontSize: '0.9rem'
              }}
            />
            <input
              type="text"
              placeholder="Description"
              value={goalForm.description}
              onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid ' + theme.border,
                backgroundColor: theme.background,
                color: theme.text,
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleCreateGoal}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Create Goal
              </button>
              <button
                onClick={() => setShowGoalModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        backgroundColor: theme.cardBg,
        borderTop: '1px solid ' + theme.border,
        padding: '1rem 2rem',
        marginTop: '2rem',
        textAlign: 'center'
      }}>
        <p style={{ color: theme.textSecondary, fontSize: '0.7rem' }}>
          QuickStack Expense Tracker | Track your finances smartly
        </p>
      </footer>
    </div>
  );
};

export default Home;
