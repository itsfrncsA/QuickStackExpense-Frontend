import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://quickstackexpense.onrender.com';

const Home = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showAddToGoalForm, setShowAddToGoalForm] = useState(null);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [addAmount, setAddAmount] = useState('');
  const [summary, setSummary] = useState({ total: 0, recentTotal: 0, count: 0, byCategory: {} });
  const [income, setIncome] = useState(() => {
    const saved = localStorage.getItem('monthlyIncome');
    return saved ? parseFloat(saved) : 0;
  });
  const [savingsGoals, setSavingsGoals] = useState(() => {
    const saved = localStorage.getItem('savingsGoals');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [incomeAmount, setIncomeAmount] = useState('');
  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: 0,
    description: ''
  });

  // Handle responsive sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    setGoalForm({ name: '', targetAmount: '', currentAmount: 0, description: '' });
    setShowGoalForm(false);
    alert('Savings goal created successfully!');
  };

  const handleAddToGoal = (goalId) => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    const updatedGoals = savingsGoals.map(goal => {
      if (goal.id === goalId) {
        const newAmount = goal.currentAmount + parseFloat(addAmount);
        return { ...goal, currentAmount: newAmount };
      }
      return goal;
    });
    
    setSavingsGoals(updatedGoals);
    localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
    setShowAddToGoalForm(null);
    setAddAmount('');
    alert('Added to savings goal!');
  };

  const handleDeleteGoal = (goalId) => {
    if (window.confirm('Delete this savings goal?')) {
      const updatedGoals = savingsGoals.filter(goal => goal.id !== goalId);
      setSavingsGoals(updatedGoals);
      localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
    }
  };

  const handleSetIncome = () => {
    const incomeValue = parseFloat(incomeAmount);
    if (isNaN(incomeValue) || incomeValue <= 0) {
      alert('Please enter a valid income amount');
      return;
    }
    setIncome(incomeValue);
    localStorage.setItem('monthlyIncome', incomeValue);
    setShowIncomeForm(false);
    setIncomeAmount('');
    alert('Monthly income set to ' + formatAmount(incomeValue));
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(API_URL + '/api/expenses', {
        title: formData.title,
        amount: formData.amount,
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

  const handleEdit = (expense) => {
    setEditingId(expense._id);
    setEditData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      description: expense.description || ''
    });
  };

  const handleUpdate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(API_URL + '/api/expenses/' + id, editData, {
        headers: { 'x-auth-token': token }
      });
      setEditingId(null);
      fetchData();
      alert('Expense updated successfully!');
    } catch (err) {
      alert('Error updating expense: ' + err.message);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const totalExpenses = summary.total;
  const remainingBudget = income - totalExpenses;
  const budgetPercentage = income > 0 ? (totalExpenses / income) * 100 : 0;
  const isOverBudget = remainingBudget < 0;

  const getBudgetColor = () => {
    if (isOverBudget) return '#f44336';
    if (budgetPercentage >= 80) return '#ff9800';
    return '#4CAF50';
  };

  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalSavingsTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading your finances...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      {/* Toggle Button for Mobile */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          backgroundColor: '#1a1a2e',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '16px',
          display: window.innerWidth < 768 ? 'block' : 'none'
        }}
      >
        {sidebarOpen ? '?' : '?'}
      </button>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '280px' : '0',
        minWidth: sidebarOpen ? '280px' : '0',
        backgroundColor: '#1a1a2e',
        color: 'white',
        padding: sidebarOpen ? '2rem 1.5rem' : '0',
        overflowY: 'auto',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 999
      }}>
        {sidebarOpen && (
          <>
            {/* Logo with layout.png */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '2rem',
              padding: '0.5rem'
            }}>
              <img 
                src="/layout.png" 
                alt="QuickStack Logo" 
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  maxHeight: '80px',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>QuickStack</div>
            </div>
            
            {/* Budget Overview */}
            <div>
              <h3 style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>BUDGET OVERVIEW</h3>
              
              <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#aaa' }}>MONTHLY INCOME</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4CAF50' }}>{income > 0 ? formatAmount(income) : 'Not set'}</div>
                {income === 0 && (
                  <button onClick={() => setShowIncomeForm(true)} style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.7rem', backgroundColor: '#4CAF50', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>Set Income</button>
                )}
              </div>
              
              {income > 0 && (
                <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#aaa' }}>REMAINING BUDGET</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isOverBudget ? '#f44336' : '#4CAF50' }}>
                    {isOverBudget ? formatAmount(Math.abs(remainingBudget)) + ' over' : formatAmount(remainingBudget)}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ height: '6px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: Math.min(budgetPercentage, 100) + '%', height: '100%', backgroundColor: getBudgetColor(), borderRadius: '3px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '0.25rem' }}>{budgetPercentage.toFixed(1)}% spent</div>
                  </div>
                </div>
              )}
            </div>

            {/* Savings Goals Summary */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>SAVINGS GOALS</h3>
              <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#aaa' }}>TOTAL SAVED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ff9800' }}>{formatAmount(totalSaved)}</div>
                <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '0.25rem' }}>Target: {formatAmount(totalSavingsTarget)}</div>
                <button onClick={() => setShowGoalForm(true)} style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem', backgroundColor: '#ff9800', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>+ New Goal</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 998
          }}
        />
      )}

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '2rem', color: '#1a1a2e', marginBottom: '2rem' }}>Dashboard</h1>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Monthly Income</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50' }}>{income > 0 ? formatAmount(income) : 'Not set'}</div>
            {income === 0 && (
              <button onClick={() => setShowIncomeForm(true)} style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.7rem', backgroundColor: '#4CAF50', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>Set Income</button>
            )}
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Total Expenses</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f44336' }}>{formatAmount(totalExpenses)}</div>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Remaining Budget</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isOverBudget ? '#f44336' : '#4CAF50' }}>
              {income > 0 ? formatAmount(remainingBudget) : 'Set income first'}
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Total Savings</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff9800' }}>{formatAmount(totalSaved)}</div>
          </div>
        </div>

        {/* Set Income Form */}
        {showIncomeForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Set Monthly Income</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>PHP</span>
              <input 
                type="number" 
                step="0.01" 
                placeholder="Enter your monthly income" 
                value={incomeAmount} 
                onChange={(e) => setIncomeAmount(e.target.value)} 
                style={{ flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} 
              />
              <button onClick={handleSetIncome} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setShowIncomeForm(false); setIncomeAmount(''); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Create Goal Form */}
        {showGoalForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Create Savings Goal</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Goal Name (e.g., New Phone, Vacation)" value={goalForm.name} onChange={(e) => setGoalForm({...goalForm, name: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
              <input type="number" step="0.01" placeholder="Target Amount (PHP)" value={goalForm.targetAmount} onChange={(e) => setGoalForm({...goalForm, targetAmount: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
              <input type="text" placeholder="Description (optional)" value={goalForm.description} onChange={(e) => setGoalForm({...goalForm, description: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleCreateGoal} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Create Goal</button>
                <button onClick={() => setShowGoalForm(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Add to Goal Popup */}
        {showAddToGoalForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '400px', maxWidth: '90%' }}>
              <h3 style={{ marginBottom: '1rem' }}>Add to Savings</h3>
              <input type="number" step="0.01" placeholder="Amount to add (PHP)" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => handleAddToGoal(selectedGoalId)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add</button>
                <button onClick={() => setShowAddToGoalForm(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Savings Goals Section */}
        {savingsGoals.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Your Savings Goals</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {savingsGoals.map(goal => {
                const percentage = (goal.currentAmount / goal.targetAmount) * 100;
                const isCompleted = percentage >= 100;
                return (
                  <div key={goal.id} style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '1rem', border: isCompleted ? '2px solid #4CAF50' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ margin: 0 }}>{goal.name}</h4>
                        {goal.description && <div style={{ fontSize: '0.7rem', color: '#999' }}>{goal.description}</div>}
                      </div>
                      <button onClick={() => handleDeleteGoal(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f44336', fontSize: '1rem' }}>Delete</button>
                    </div>
                    <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)}
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                      <div style={{ width: Math.min(percentage, 100) + '%', height: '100%', backgroundColor: isCompleted ? '#4CAF50' : '#ff9800', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{percentage.toFixed(1)}% complete</div>
                      {!isCompleted && (
                        <button onClick={() => { setSelectedGoalId(goal.id); setShowAddToGoalForm(true); }} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>+ Add Funds</button>
                      )}
                      {isCompleted && <span style={{ color: '#4CAF50', fontSize: '0.75rem' }}>Goal Achieved</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Expense Button */}
        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} style={{ width: '100%', padding: '1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginBottom: '2rem' }}>
            + Add New Expense
          </button>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>New Expense</h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
              <input type="number" step="0.01" placeholder="Amount (PHP)" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
              <input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Expenses List */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Recent Expenses</h3>
          {expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
              <p>No expenses yet</p>
              <p style={{ fontSize: '0.85rem' }}>Click "Add New Expense" to get started</p>
            </div>
          ) : (
            <div>
              {expenses.slice(0, 10).map(expense => (
                <div key={expense._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid #eee' }}>
                  <div style={{ flex: 1 }}>
                    {editingId === expense._id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px', width: '120px' }} placeholder="Title" />
                        <input type="number" value={editData.amount} onChange={(e) => setEditData({...editData, amount: e.target.value})} style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px', width: '100px' }} placeholder="Amount" />
                        <select value={editData.category} onChange={(e) => setEditData({...editData, category: e.target.value})} style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <input type="date" value={editData.date} onChange={(e) => setEditData({...editData, date: e.target.value})} style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                        <button onClick={() => handleUpdate(expense._id)} style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ background: '#999', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontWeight: '500' }}>{expense.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#999' }}>{expense.category} - {new Date(expense.date).toLocaleDateString()}</div>
                        {expense.description && <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{expense.description}</div>}
                      </>
                    )}
                  </div>
                  {editingId !== expense._id && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#f44336', fontWeight: '600' }}>-{formatAmount(expense.amount)}</span>
                      <button onClick={() => handleEdit(expense)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <img src="/edit.png" alt="Edit" style={{ width: '20px', height: '20px' }} />
                      </button>
                      <button onClick={() => handleDelete(expense._id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <img src="/delete.png" alt="Delete" style={{ width: '20px', height: '20px' }} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
