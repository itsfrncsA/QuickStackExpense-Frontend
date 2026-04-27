import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://quickstackexpense.onrender.com';

const Home = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, recentTotal: 0, count: 0, byCategory: {} });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [income, setIncome] = useState(() => {
    const saved = localStorage.getItem('monthlyIncome');
    return saved ? parseFloat(saved) : 0;
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'expense'
  });
  const [incomeAmount, setIncomeAmount] = useState(income);

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

  const handleSetIncome = () => {
    if (incomeAmount <= 0) {
      alert('Please enter a valid income amount');
      return;
    }
    setIncome(incomeAmount);
    localStorage.setItem('monthlyIncome', incomeAmount);
    setShowIncomeForm(false);
    alert('Monthly income set to ' + formatAmount(incomeAmount));
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
        type: 'expense'
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

  // Budget calculations
  const totalExpenses = summary.total;
  const remainingBudget = income - totalExpenses;
  const budgetPercentage = income > 0 ? (totalExpenses / income) * 100 : 0;
  const isOverBudget = remainingBudget < 0;

  const getBudgetColor = () => {
    if (isOverBudget) return '#f44336';
    if (budgetPercentage >= 80) return '#ff9800';
    return '#4CAF50';
  };

  const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading your finances...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      {/* Sidebar */}
      <div style={{ width: '280px', backgroundColor: '#1a1a2e', color: 'white', padding: '2rem 1.5rem' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          QuickStack
        </div>
        
        <div>
          <h3 style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>Budget Overview</h3>
          
          {/* Income Display */}
          <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>MONTHLY INCOME</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4CAF50' }}>{income > 0 ? formatAmount(income) : 'Not set'}</div>
            {income === 0 && (
              <button 
                onClick={() => setShowIncomeForm(true)} 
                style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.7rem', backgroundColor: '#4CAF50', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
              >
                Set Income
              </button>
            )}
          </div>
          
          {/* Budget Progress */}
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
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#1a1a2e', marginBottom: '2rem' }}>Dashboard</h1>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Income Card */}
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
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Transactions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.count}</div>
          </div>
        </div>

        {/* Set Income Form */}
        {showIncomeForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Set Monthly Income</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1.5rem' }}>?</span>
              <input 
                type="number" 
                step="0.01" 
                placeholder="Enter your monthly income" 
                value={incomeAmount} 
                onChange={(e) => setIncomeAmount(parseFloat(e.target.value) || 0)} 
                style={{ flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} 
              />
              <button onClick={handleSetIncome} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setShowIncomeForm(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Add Expense Button */}
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)} 
            style={{ width: '100%', padding: '1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginBottom: '2rem' }}
          >
            + Add New Expense
          </button>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>New Expense</h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required 
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} 
              />
              <input 
                type="number" 
                step="0.01" 
                placeholder="Amount (?)" 
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                required 
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} 
              />
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})} 
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})} 
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} 
              />
              <input 
                type="text" 
                placeholder="Description" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} 
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions List */}
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
                        <input 
                          value={editData.title} 
                          onChange={(e) => setEditData({...editData, title: e.target.value})} 
                          style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px', width: '120px' }} 
                          placeholder="Title"
                        />
                        <input 
                          type="number" 
                          value={editData.amount} 
                          onChange={(e) => setEditData({...editData, amount: e.target.value})} 
                          style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px', width: '100px' }} 
                          placeholder="Amount"
                        />
                        <select 
                          value={editData.category} 
                          onChange={(e) => setEditData({...editData, category: e.target.value})} 
                          style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <input 
                          type="date" 
                          value={editData.date} 
                          onChange={(e) => setEditData({...editData, date: e.target.value})} 
                          style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
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
