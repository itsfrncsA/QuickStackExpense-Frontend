import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://quickstackexpense.onrender.com';

const Home = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [summary, setSummary] = useState({ total: 0, recentTotal: 0, count: 0, byCategory: {} });
  const [income, setIncome] = useState(() => {
    const saved = localStorage.getItem('monthlyIncome');
    return saved ? parseFloat(saved) : 0;
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

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check expense alert (50% of income)
  useEffect(() => {
    if (income > 0 && summary.total > income * 0.5) {
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

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || formData.amount <= 0) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(API_URL + '/api/expenses', {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        description: formData.description
      }, {
        headers: { 'x-auth-token': token }
      });
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
        showNotification('Expense deleted', 'success');
      } catch (err) {
        alert('Error deleting expense');
      }
    }
  };

  const handleCreateGoal = () => {
    if (!goalForm.name || !goalForm.targetAmount || goalForm.targetAmount <= 0) {
      alert('Please enter a valid goal name and target amount');
      return;
    }
    
    const newGoal = {
      id: Date.now(),
      name: goalForm.name,
      targetAmount: parseFloat(goalForm.targetAmount),
      currentAmount: 0,
      description: goalForm.description,
      createdAt: new Date().toISOString()
    };
    
    const updatedGoals = [...savingsGoals, newGoal];
    setSavingsGoals(updatedGoals);
    localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
    setGoalForm({ name: '', targetAmount: '', description: '' });
    setShowGoalModal(false);
    showNotification('Savings goal created!', 'success');
  };

  const handleExport = (format) => {
    const data = expenses.map(exp => ({
      Title: exp.title,
      Amount: exp.amount,
      Category: exp.category,
      Date: new Date(exp.date).toLocaleDateString(),
      Description: exp.description || ''
    }));
    
    if (format === 'CSV') {
      const csv = [['Title', 'Amount', 'Category', 'Date', 'Description'], ...data.map(d => Object.values(d))];
      const csvContent = csv.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses.csv';
      a.click();
      URL.revokeObjectURL(url);
      showNotification('Exported as CSV', 'success');
    }
    setShowExportMenu(false);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  // Group expenses by category and count
  const groupedExpenses = expenses.reduce((acc, exp) => {
    const key = exp.category;
    if (!acc[key]) {
      acc[key] = { count: 0, total: 0, items: [] };
    }
    acc[key].count++;
    acc[key].total += exp.amount;
    acc[key].items.push(exp);
    return acc;
  }, {});

  // Filter expenses
  const filteredExpenses = expenses.filter(exp => {
    if (selectedCategory !== 'All' && exp.category !== selectedCategory) return false;
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

  const totalExpenses = summary.total;
  const remainingBudget = income - totalExpenses;
  const budgetPercentage = income > 0 ? (totalExpenses / income) * 100 : 0;

  const categoryIcons = {
    Food: '??',
    Transport: '??',
    Shopping: '???',
    Entertainment: '??',
    Bills: '??',
    Healthcare: '??',
    Education: '??',
    Other: '??'
  };

  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const mainSavingsGoal = savingsGoals[0];
  const savingsPercentage = mainSavingsGoal ? (mainSavingsGoal.currentAmount / mainSavingsGoal.targetAmount) * 100 : 0;

  const styles = {
    light: {
      background: '#F9FAFB',
      cardBg: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB'
    },
    dark: {
      background: '#111827',
      cardBg: '#1F2937',
      text: '#F9FAFB',
      textSecondary: '#9CA3AF',
      border: '#374151'
    }
  };

  const theme = darkMode ? styles.dark : styles.light;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading your finances...</div>;
  }

  return (
    <div style={{ backgroundColor: theme.background, minHeight: '100vh', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      {/* Header */}
      <header style={{ backgroundColor: theme.cardBg, borderBottom: '1px solid ' + theme.border, padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/layout.png" alt="QuickStack" style={{ height: '40px' }} />
            <h1 style={{ fontSize: '1.5rem', color: theme.text }}>QuickStack</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
              {darkMode ? '??' : '??'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>FA</div>
              <span style={{ color: theme.text }}>Welcome, Francis</span>
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
            animation: 'slideIn 0.3s ease'
          }}>
            {notification.message}
          </div>
        )}

        {/* Dashboard Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer', ':hover': { transform: 'translateY(-5px)' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>??</span>
              <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: '500' }}>{income > 0 ? 'Active' : 'Not set'}</span>
            </div>
            <h3 style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Monthly Income</h3>
            <p style={{ color: '#10B981', fontSize: '1.5rem', fontWeight: 'bold' }}>{income > 0 ? formatAmount(income) : 'Not set'}</p>
            {income === 0 && (
              <button onClick={() => setShowIncomeModal(true)} style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>Set Income</button>
            )}
          </div>

          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>??</span>
            </div>
            <h3 style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Total Expenses</h3>
            <p style={{ color: '#DC2626', fontSize: '1.5rem', fontWeight: 'bold' }}>{formatAmount(totalExpenses)}</p>
          </div>

          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>??</span>
            </div>
            <h3 style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Remaining Budget</h3>
            <p style={{ color: '#14B8A6', fontSize: '1.5rem', fontWeight: 'bold' }}>{income > 0 ? formatAmount(remainingBudget) : 'Set income'}</p>
            {income > 0 && <div style={{ marginTop: '0.5rem', height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: Math.min(budgetPercentage, 100) + '%', height: '100%', backgroundColor: budgetPercentage > 80 ? '#DC2626' : '#14B8A6' }}></div>
            </div>}
          </div>

          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>??</span>
            </div>
            <h3 style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Savings</h3>
            <p style={{ color: '#3B82F6', fontSize: '1.5rem', fontWeight: 'bold' }}>{formatAmount(totalSaved)}</p>
            <button onClick={() => setShowGoalModal(true)} style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>Set Goal</button>
          </div>
        </div>

        {/* Savings Goal Progress */}
        {mainSavingsGoal && (
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ color: theme.text, marginBottom: '0.5rem' }}>?? {mainSavingsGoal.name}</h3>
            <p style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '0.75rem' }}>You're {savingsPercentage.toFixed(1)}% to your {formatAmount(mainSavingsGoal.targetAmount)} goal!</p>
            <div style={{ height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: Math.min(savingsPercentage, 100) + '%', height: '100%', backgroundColor: '#3B82F6', borderRadius: '4px' }}></div>
            </div>
            <p style={{ color: theme.textSecondary, fontSize: '0.75rem', marginTop: '0.5rem' }}>Saved: {formatAmount(mainSavingsGoal.currentAmount)}</p>
          </div>
        )}

        {/* Charts Section - Simple visual representation */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: theme.text, marginBottom: '1rem' }}>Expense Categories</h3>
            {Object.entries(summary.byCategory).map(([cat, amount]) => {
              const percentage = (amount / totalExpenses) * 100;
              return (
                <div key={cat} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: theme.text, fontSize: '0.85rem' }}>{categoryIcons[cat]} {cat}</span>
                    <span style={{ color: theme.textSecondary, fontSize: '0.85rem' }}>{formatAmount(amount)} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: percentage + '%', height: '100%', backgroundColor: '#3B82F6', borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: theme.text, marginBottom: '1rem' }}>Income vs Expenses</h3>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: theme.text, fontSize: '0.85rem' }}>Income</span>
                <span style={{ color: theme.textSecondary, fontSize: '0.85rem' }}>{formatAmount(income)}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#10B981', borderRadius: '3px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: theme.text, fontSize: '0.85rem' }}>Expenses</span>
                <span style={{ color: theme.textSecondary, fontSize: '0.85rem' }}>{formatAmount(totalExpenses)}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: (totalExpenses / income) * 100 + '%', height: '100%', backgroundColor: '#DC2626', borderRadius: '3px' }}></div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid ' + theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.text }}>Saving Rate</span>
                <span style={{ color: '#14B8A6', fontWeight: 'bold' }}>{income > 0 ? ((income - totalExpenses) / income * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text }}>
              <option>All</option>
              <option>Food</option><option>Transport</option><option>Shopping</option>
              <option>Entertainment</option><option>Bills</option><option>Healthcare</option>
              <option>Education</option><option>Other</option>
            </select>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text }}>
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowExportMenu(!showExportMenu)} style={{ padding: '0.5rem 1rem', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>?? Export</button>
            {showExportMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', backgroundColor: theme.cardBg, borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10 }}>
                <button onClick={() => handleExport('CSV')} style={{ display: 'block', width: '100%', padding: '0.5rem 1rem', textAlign: 'left', border: 'none', backgroundColor: 'transparent', color: theme.text, cursor: 'pointer' }}>CSV Export</button>
              </div>
            )}
          </div>
        </div>

        {/* Expense List - Grouped */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: theme.text, marginBottom: '1rem' }}>Recent Expenses</h3>
          {filteredExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: theme.textSecondary }}>No expenses found</div>
          ) : (
            <div>
              {Object.entries(filteredExpenses.reduce((acc, exp) => {
                const key = exp.category;
                if (!acc[key]) acc[key] = { count: 0, total: 0, items: [] };
                acc[key].count++;
                acc[key].total += exp.amount;
                acc[key].items.push(exp);
                return acc;
              }, {})).map(([category, data]) => (
                <div key={category} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: theme.background, borderRadius: '8px', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{categoryIcons[category]}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: theme.text }}>{category}</div>
                        <div style={{ fontSize: '0.7rem', color: theme.textSecondary }}>{data.count} transactions</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#DC2626' }}>{formatAmount(data.total)}</div>
                  </div>
                  {data.items.map(expense => (
                    <div key={expense._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.5rem 0.5rem 2rem', borderBottom: '1px solid ' + theme.border }}>
                      <div>
                        <div style={{ color: theme.text, fontSize: '0.85rem' }}>{expense.title}</div>
                        <div style={{ fontSize: '0.65rem', color: theme.textSecondary }}>{new Date(expense.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#DC2626', fontSize: '0.85rem' }}>-{formatAmount(expense.amount)}</span>
                        <button onClick={() => handleDelete(expense._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>???</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <button onClick={() => setShowModal(true)} style={{
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
        boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s',
        zIndex: 100
      }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>+</button>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '500px' }}>
            <h2 style={{ color: theme.text, marginBottom: '1rem' }}>Add Expense</h2>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text }} />
              <input type="number" step="0.01" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text }} />
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text }}>
                <option>Food</option><option>Transport</option><option>Shopping</option>
                <option>Entertainment</option><option>Bills</option><option>Healthcare</option>
                <option>Education</option><option>Other</option>
              </select>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text }} />
              <input type="text" placeholder="Notes" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text }} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Income Modal */}
      {showIncomeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ color: theme.text, marginBottom: '1rem' }}>Set Monthly Income</h2>
            <input type="number" step="0.01" placeholder="Monthly Income" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text, marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleSetIncome} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setShowIncomeModal(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ color: theme.text, marginBottom: '1rem' }}>Create Savings Goal</h2>
            <input type="text" placeholder="Goal Name (e.g., New Phone)" value={goalForm.name} onChange={(e) => setGoalForm({...goalForm, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text, marginBottom: '1rem' }} />
            <input type="number" step="0.01" placeholder="Target Amount" value={goalForm.targetAmount} onChange={(e) => setGoalForm({...goalForm, targetAmount: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text, marginBottom: '1rem' }} />
            <input type="text" placeholder="Description" value={goalForm.description} onChange={(e) => setGoalForm({...goalForm, description: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid ' + theme.border, backgroundColor: theme.cardBg, color: theme.text, marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleCreateGoal} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Create Goal</button>
              <button onClick={() => setShowGoalModal(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: theme.cardBg, borderTop: '1px solid ' + theme.border, padding: '1.5rem 2rem', marginTop: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <a href="#" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '0.85rem' }}>Settings</a>
          <button onClick={() => handleExport('CSV')} style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer' }}>Export</button>
          <a href="#" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '0.85rem' }}>About</a>
        </div>
        <p style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>? 2024 QuickStack Expense Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
