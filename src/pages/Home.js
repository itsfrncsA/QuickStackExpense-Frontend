import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Fetch expenses and summary
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch expenses
      const expensesRes = await axios.get('http://localhost:5000/api/expenses', {
        headers: { 'x-auth-token': token }
      });
      setExpenses(expensesRes.data);
      
      // Fetch summary
      const summaryRes = await axios.get('http://localhost:5000/api/expenses/summary', {
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

  // Add expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/expenses', formData, {
        headers: { 'x-auth-token': token }
      });
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      fetchData();
      alert('Expense added successfully!');
    } catch (err) {
      alert('Error adding expense: ' + err.message);
    }
  };

  // Delete expense
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete('http://localhost:5000/api/expenses/' + id, {
          headers: { 'x-auth-token': token }
        });
        fetchData();
        alert('Expense deleted successfully!');
      } catch (err) {
        alert('Error deleting expense: ' + err.message);
      }
    }
  };

  // Start editing
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

  // Save edit
  const handleUpdate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/expenses/' + id, editData, {
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

  const getCategoryColor = (category) => {
    const colors = {
      Food: '#ff7675',
      Transport: '#74b9ff',
      Shopping: '#a29bfe',
      Entertainment: '#fdcb6e',
      Bills: '#55efc4',
      Healthcare: '#fd79a8',
      Education: '#0984e3',
      Other: '#b2bec3'
    };
    return colors[category] || '#b2bec3';
  };

  if (loading) return <div style={styles.loading}>Loading expenses...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <h1>💰 QuickStack Expense Tracker</h1>
      <p style={styles.subtitle}>Track your expenses in Philippine Peso (₱)</p>
      
      {/* Summary Cards */}
      <div style={styles.summaryContainer}>
        <div style={styles.summaryCard}>
          <h3>Total Expenses</h3>
          <p style={styles.totalAmount}>{formatAmount(summary.total)}</p>
          <small>Total {summary.count} expenses</small>
        </div>
        <div style={styles.summaryCard}>
          <h3>Last 30 Days</h3>
          <p style={styles.recentAmount}>{formatAmount(summary.recentTotal)}</p>
          <small>Recent spending</small>
        </div>
        <div style={styles.summaryCard}>
          <h3>Categories</h3>
          {Object.entries(summary.byCategory).slice(0, 3).map(([cat, amt]) => (
            <div key={cat}><strong>{cat}:</strong> {formatAmount(amt)}</div>
          ))}
        </div>
      </div>
      
      {/* Add Expense Form */}
      <div style={styles.formContainer}>
        <h3>Add New Expense</h3>
        <form onSubmit={handleAddExpense} style={styles.form}>
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            style={styles.input}
          />
          <input
            type="number"
            name="amount"
            step="0.01"
            placeholder="Amount (₱)"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
            style={styles.input}
          />
          <select
            name="category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            style={styles.input}
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
            name="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            style={styles.input}
          />
          <input
            type="text"
            name="description"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={styles.input}
          />
          <button type="submit" style={styles.addButton}>Add Expense</button>
        </form>
      </div>
      
      {/* Expenses List */}
      <div style={styles.listContainer}>
        <h3>Your Expenses</h3>
        {expenses.length === 0 ? (
          <p>No expenses yet. Add your first expense above!</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense._id}>
                  {editingId === expense._id ? (
                    <>
                      <td><input value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} style={styles.editInput} /></td>
                      <td><input type="number" value={editData.amount} onChange={(e) => setEditData({...editData, amount: e.target.value})} style={styles.editInput} /></td>
                      <td>
                        <select value={editData.category} onChange={(e) => setEditData({...editData, category: e.target.value})} style={styles.editInput}>
                          <option>Food</option><option>Transport</option><option>Shopping</option>
                          <option>Entertainment</option><option>Bills</option><option>Healthcare</option>
                          <option>Education</option><option>Other</option>
                        </select>
                      </td>
                      <td><input type="date" value={editData.date} onChange={(e) => setEditData({...editData, date: e.target.value})} style={styles.editInput} /></td>
                      <td><input value={editData.description || ''} onChange={(e) => setEditData({...editData, description: e.target.value})} style={styles.editInput} /></td>
                      <td>
                        <button onClick={() => handleUpdate(expense._id)} style={styles.saveBtn}>Save</button>
                        <button onClick={() => setEditingId(null)} style={styles.cancelBtn}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{expense.title}</td>
                      <td style={styles.amountCell}>{formatAmount(expense.amount)}</td>
                      <td><span style={{...styles.category, backgroundColor: getCategoryColor(expense.category)}}>{expense.category}</span></td>
                      <td>{new Date(expense.date).toLocaleDateString()}</td>
                      <td>{expense.description || '-'}</td>
                      <td>
                        <button onClick={() => handleEdit(expense)} style={styles.editBtn}>Edit</button>
                        <button onClick={() => handleDelete(expense._id)} style={styles.deleteBtn}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  subtitle: { color: '#666', marginBottom: '2rem' },
  summaryContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  summaryCard: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' },
  totalAmount: { fontSize: '2rem', color: '#27ae60', margin: '0.5rem 0' },
  recentAmount: { fontSize: '2rem', color: '#3498db', margin: '0.5rem 0' },
  formContainer: { backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' },
  form: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  input: { padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', flex: '1', minWidth: '150px' },
  addButton: { padding: '0.5rem 1rem', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  listContainer: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  amountCell: { fontWeight: 'bold', color: '#27ae60' },
  category: { padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: 'white', display: 'inline-block' },
  editBtn: { padding: '0.25rem 0.5rem', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '0.5rem' },
  deleteBtn: { padding: '0.25rem 0.5rem', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  saveBtn: { padding: '0.25rem 0.5rem', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '0.5rem' },
  cancelBtn: { padding: '0.25rem 0.5rem', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  editInput: { padding: '0.25rem', width: '100%', minWidth: '80px', border: '1px solid #ddd', borderRadius: '3px' },
  loading: { textAlign: 'center', padding: '3rem' },
  error: { textAlign: 'center', padding: '3rem', color: 'red' }
};

export default Home;
