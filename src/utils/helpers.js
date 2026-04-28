export const formatAmount = (amount) => {
  const numAmount = amount && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(numAmount);
};

export const getLocal = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const setLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage error:', err);
  }
};

export const categories = ['All', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

export const categoryDisplay = {
  Food: 'Food',
  Transport: 'Transport',
  Shopping: 'Shopping',
  Entertainment: 'Entertainment',
  Bills: 'Bills',
  Healthcare: 'Healthcare',
  Education: 'Education',
  Other: 'Other'
};

export const getBudgetColor = (percentage) => {
  if (percentage >= 100) return '#DC2626';
  if (percentage >= 80) return '#F59E0B';
  return '#10B981';
};
