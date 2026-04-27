import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://quickstackexpense.onrender.com';

const Home = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, recentTotal: 0, count: 0, byCategory: {} });
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
      console.error(err);
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

  const getCategoryIcon = (cat) => {
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
    return icons[cat] || '??';
  };

  const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading your finances...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      {/* Sidebar */}
      <div style={{ width: '280px', backgroundColor: '#1a1a2e', color: 'white', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
          <span>??</span>
          <span>QuickStack</span>
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>Wallet</h3>
          <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>??</span>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#aaa' }}>Cash Wallet</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4CAF50' }}>{formatAmount(summary.total)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#1a1a2e', marginBottom: '2rem' }}>Dashboard</h1>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}></span>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Total Balance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatAmount(summary.total)}</div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}></span>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Total Expenses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatAmount(summary.total)}</div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>??</span>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Last 30 Days</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatAmount(summary.recentTotal)}</div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>??</span>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Transactions</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.count}</div>
            </div>
          </div>
        </div>

        {/* Add Expense Button */}
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)} 
            style={{ width: '100%', padding: '1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginBottom: '2rem' }}
          >
            + Add New Transaction
          </button>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>New Transaction</h3>
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
                {categories.map(cat => (
                  <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                ))}
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
          <h3 style={{ marginBottom: '1rem' }}>Recent Transactions</h3>
          {expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>??</div>
              <p>No transactions yet</p>
              <p style={{ fontSize: '0.85rem' }}>Click "Add New Transaction" to get started</p>
            </div>
          ) : (
            <div>
              {expenses.slice(0, 10).map(expense => (
                <div key={expense._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid #eee' }}>
                  <span style={{ fontSize: '2rem' }}>{getCategoryIcon(expense.category)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{expense.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(expense.date).toLocaleDateString()}</div>
                    {expense.description && <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{expense.description}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#f44336', fontWeight: '600' }}>-{formatAmount(expense.amount)}</span>
                    <button onClick={() => handleDelete(expense._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>???</button>
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

export default Home;
