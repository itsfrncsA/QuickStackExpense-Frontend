import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../services/api';
import Header from '../components/Header';
import DashboardCards from '../components/DashboardCards';
import { formatAmount, getLocal, setLocal, categories, categoryDisplay, getBudgetColor } from '../utils/helpers';

const Home = () => {
  // State with optimized structure
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [modal, setModal] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [summary, setSummary] = useState({ total: 0, recentTotal: 0, count: 0, byCategory: {} });
  const [income, setIncome] = useState(() => getLocal('monthlyIncome', 0));
  const [savingsGoals, setSavingsGoals] = useState(() => getLocal('savingsGoals', []));
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [goalForm, setGoalForm] = useState({ name: '', targetAmount: '', description: '' });
  const [incomeAmount, setIncomeAmount] = useState('');
  const [notification, setNotification] = useState(null);

  // Notification timer
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [expensesRes, summaryRes] = await Promise.all([
        API.get('/api/expenses'),
        API.get('/api/expenses/summary')
      ]);
      setExpenses(expensesRes.data || []);
      setSummary(summaryRes.data || { total: 0, recentTotal: 0, count: 0, byCategory: {} });
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check 50% alert
  useEffect(() => {
    const total = summary.total || 0;
    if (income > 0 && total > income * 0.5) {
      setNotification({ message: 'You have spent over 50% of your monthly income!', type: 'warning' });
    }
  }, [summary.total, income]);

  // Memoized filtered expenses
  const filteredExpensesList = useMemo(() => {
    return expenses.filter(exp => {
      if (selectedCategory !== 'All' && exp.category !== selectedCategory) return false;
      if (searchTerm && !(exp.title || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(exp.date) >= weekAgo;
      }
      if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(exp.date) >= monthAgo;
      }
      return true;
    });
  }, [expenses, selectedCategory, searchTerm, dateRange]);

  // Memoized grouped expenses
  const groupedExpenses = useMemo(() => {
    return filteredExpensesList.reduce((acc, exp) => {
      const key = exp.category || 'Other';
      if (!acc[key]) acc[key] = { count: 0, total: 0, items: [] };
      acc[key].count++;
      acc[key].total += exp.amount || 0;
      acc[key].items.push(exp);
      return acc;
    }, {});
  }, [filteredExpensesList]);

  // Memoized calculations
  const totalExpenses = summary.total || 0;
  const remainingBudget = (income || 0) - totalExpenses;
  const budgetPercentage = income > 0 ? (totalExpenses / income) * 100 : 0;
  const totalSaved = savingsGoals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
  const mainSavingsGoal = savingsGoals[0];
  const savingsPercentage = mainSavingsGoal?.targetAmount > 0 ? ((mainSavingsGoal.currentAmount || 0) / mainSavingsGoal.targetAmount) * 100 : 0;

  // Handlers
  const handleSetIncome = () => {
    const incomeValue = parseFloat(incomeAmount);
    if (isNaN(incomeValue) || incomeValue <= 0) {
      alert('Please enter a valid income amount');
      return;
    }
    setIncome(incomeValue);
    setLocal('monthlyIncome', incomeValue);
    setModal(null);
    setIncomeAmount('');
    setNotification({ message: 'Monthly income set to ' + formatAmount(incomeValue), type: 'success' });
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
      if (!window.confirm('This expense looks similar. Add it anyway?')) {
        return;
      }
    }
    
    try {
      await API.post('/api/expenses', {
        title: formData.title.trim(),
        amount: amountValue,
        category: formData.category,
        date: formData.date,
        description: formData.description?.trim() || ''
      });
      
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      setModal(null);
      fetchData();
      setNotification({ message: 'Expense added successfully!', type: 'success' });
    } catch (err) {
      alert('Error adding expense: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense?')) {
      try {
        await API.delete('/api/expenses/' + id);
        fetchData();
        setNotification({ message: 'Expense deleted', type: 'success' });
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
    setLocal('savingsGoals', updatedGoals);
    setGoalForm({ name: '', targetAmount: '', description: '' });
    setModal(null);
    setNotification({ message: 'Savings goal created!', type: 'success' });
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
    setShowExportMenu(false);
    setNotification({ message: 'Exported as CSV', type: 'success' });
  };

  const styles = {
    background: darkMode ? '#121212' : '#F5F7FA',
    text: darkMode ? '#FFFFFF' : '#1A1A2E',
    textSecondary: darkMode ? '#A0A0B0' : '#666666',
    border: darkMode ? '#2A2A3E' : '#E5E7EB',
    cardBg: darkMode ? '#1E1E2E' : '#FFFFFF',
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: styles.background, color: styles.text }}>Loading your finances...</div>;
  }

  return (
    <div style={{ backgroundColor: styles.background, minHeight: '100vh', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

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
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {notification.message}
          </div>
        )}

        <DashboardCards
          income={income}
          totalExpenses={totalExpenses}
          remainingBudget={remainingBudget}
          budgetPercentage={budgetPercentage}
          totalSaved={totalSaved}
          onSetIncome={() => setModal('income')}
          onSetGoal={() => setModal('goal')}
        />

        {/* Savings Goal Progress */}
        {mainSavingsGoal && (
          <div style={{ backgroundColor: styles.cardBg, borderRadius: '16px', padding: '1.25rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ color: styles.text, margin: 0, fontSize: '1rem' }}>Target: {mainSavingsGoal.name}</h3>
              <span style={{ color: '#3B82F6', fontSize: '0.75rem' }}>{savingsPercentage.toFixed(1)}% Complete</span>
            </div>
            <div style={{ height: '8px', backgroundColor: styles.border, borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ width: Math.min(savingsPercentage, 100) + '%', height: '100%', backgroundColor: savingsPercentage >= 100 ? '#4CAF50' : '#3B82F6' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: styles.textSecondary, fontSize: '0.75rem' }}>Saved: {formatAmount(mainSavingsGoal.currentAmount || 0)}</span>
              <span style={{ color: styles.textSecondary, fontSize: '0.75rem' }}>Target: {formatAmount(mainSavingsGoal.targetAmount)}</span>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Category Chart */}
          <div style={{ backgroundColor: styles.cardBg, borderRadius: '16px', padding: '1.25rem' }}>
            <h3 style={{ color: styles.text, marginBottom: '1rem', fontSize: '1rem' }}>Expense Categories</h3>
            {Object.keys(summary.byCategory || {}).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: styles.textSecondary }}>No expenses yet</div>
            ) : (
              Object.entries(summary.byCategory || {}).map(([cat, amount]) => {
                const percentage = totalExpenses > 0 ? ((amount || 0) / totalExpenses) * 100 : 0;
                return (
                  <div key={cat} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: styles.text, fontSize: '0.85rem' }}>{categoryDisplay[cat] || cat}</span>
                      <span style={{ color: styles.textSecondary, fontSize: '0.8rem' }}>{formatAmount(amount)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: styles.border, borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: percentage + '%', height: '100%', backgroundColor: '#3B82F6' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Income vs Expenses */}
          <div style={{ backgroundColor: styles.cardBg, borderRadius: '16px', padding: '1.25rem' }}>
            <h3 style={{ color: styles.text, marginBottom: '1rem', fontSize: '1rem' }}>Income vs Expenses</h3>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: styles.text }}>Income</span>
                <span style={{ color: '#10B981' }}>{formatAmount(income)}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: styles.border, borderRadius: '6px' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#10B981' }}></div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: styles.text }}>Expenses</span>
                <span style={{ color: '#DC2626' }}>{formatAmount(totalExpenses)}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: styles.border, borderRadius: '6px' }}>
                <div style={{ width: income > 0 ? Math.min((totalExpenses / income) * 100, 100) + '%' : '0%', height: '100%', backgroundColor: '#DC2626' }}></div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid ' + styles.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Savings Rate</span>
                <span style={{ color: '#14B8A6', fontWeight: 'bold' }}>{income > 0 ? ((income - totalExpenses) / income * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: styles.cardBg, borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text, fontSize: '0.85rem', width: '180px' }} />
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text, fontSize: '0.85rem' }}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text, fontSize: '0.85rem' }}>
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowExportMenu(!showExportMenu)} style={{ padding: '0.5rem 1rem', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Export CSV</button>
            {showExportMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.25rem', backgroundColor: styles.cardBg, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
                <button onClick={handleExport} style={{ display: 'block', width: '100%', padding: '0.5rem 1rem', border: 'none', backgroundColor: 'transparent', color: styles.text, cursor: 'pointer', textAlign: 'left' }}>Download CSV</button>
              </div>
            )}
          </div>
        </div>

        {/* Expense List */}
        <div style={{ backgroundColor: styles.cardBg, borderRadius: '16px', padding: '1.25rem' }}>
          <h3 style={{ color: styles.text, marginBottom: '1rem', fontSize: '1rem' }}>Recent Expenses</h3>
          {Object.keys(groupedExpenses).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: styles.textSecondary }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>??</div>
              <p>No expenses found</p>
              <p style={{ fontSize: '0.8rem' }}>Click the + button to add your first expense</p>
            </div>
          ) : (
            Object.entries(groupedExpenses).map(([category, data]) => (
              <div key={category} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: styles.background, borderRadius: '12px', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: styles.text }}>{category}</div>
                    <div style={{ fontSize: '0.7rem', color: styles.textSecondary }}>{data.count} transactions</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#DC2626' }}>{formatAmount(data.total)}</div>
                </div>
                {data.items.map(expense => (
                  <div key={expense._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.5rem 0.5rem 2rem', borderBottom: '1px solid ' + styles.border }}>
                    <div>
                      <div style={{ color: styles.text, fontSize: '0.85rem' }}>{expense.title}</div>
                      <div style={{ fontSize: '0.65rem', color: styles.textSecondary }}>{new Date(expense.date).toLocaleDateString()}</div>
                      {expense.description && <div style={{ fontSize: '0.6rem', color: styles.textSecondary }}>{expense.description}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: '#DC2626', fontSize: '0.85rem' }}>-{formatAmount(expense.amount)}</span>
                      <button onClick={() => handleDelete(expense._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: styles.textSecondary }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <button onClick={() => setModal('expense')} style={{
        position: 'fixed', bottom: '2rem', right: '2rem', width: '56px', height: '56px',
        borderRadius: '50%', backgroundColor: '#1E3A8A', color: 'white', border: 'none',
        fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>+</button>

      {/* Modals */}
      {modal === 'expense' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: styles.cardBg, borderRadius: '20px', padding: '1.5rem', width: '90%', maxWidth: '450px' }}>
            <h2 style={{ color: styles.text, marginBottom: '1rem' }}>Add New Expense</h2>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text }} />
              <input type="number" step="0.01" placeholder="Amount (PHP)" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text }} />
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text }}>
                <option>Food</option><option>Transport</option><option>Shopping</option><option>Entertainment</option><option>Bills</option><option>Healthcare</option><option>Education</option><option>Other</option>
              </select>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text }} />
              <input type="text" placeholder="Description (optional)" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text }} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Save</button>
                <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'income' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: styles.cardBg, borderRadius: '20px', padding: '1.5rem', width: '90%', maxWidth: '350px' }}>
            <h2 style={{ color: styles.text, marginBottom: '1rem' }}>Set Monthly Income</h2>
            <input type="number" step="0.01" placeholder="Monthly Income" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text, marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleSetIncome} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'goal' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: styles.cardBg, borderRadius: '20px', padding: '1.5rem', width: '90%', maxWidth: '350px' }}>
            <h2 style={{ color: styles.text, marginBottom: '1rem' }}>Create Savings Goal</h2>
            <input type="text" placeholder="Goal Name" value={goalForm.name} onChange={(e) => setGoalForm({...goalForm, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text, marginBottom: '0.75rem' }} />
            <input type="number" step="0.01" placeholder="Target Amount" value={goalForm.targetAmount} onChange={(e) => setGoalForm({...goalForm, targetAmount: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text, marginBottom: '0.75rem' }} />
            <input type="text" placeholder="Description" value={goalForm.description} onChange={(e) => setGoalForm({...goalForm, description: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid ' + styles.border, backgroundColor: styles.background, color: styles.text, marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleCreateGoal} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Create Goal</button>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ backgroundColor: styles.cardBg, borderTop: '1px solid ' + styles.border, padding: '1rem 2rem', marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: styles.textSecondary, fontSize: '0.7rem' }}>QuickStack Expense Tracker | Track your finances smartly</p>
      </footer>
    </div>
  );
};

export default Home;
