import React from 'react';
import { formatAmount } from '../utils/helpers';

const DashboardCards = ({ income, totalExpenses, remainingBudget, budgetPercentage, totalSaved, onSetIncome, onSetGoal }) => {
  const styles = {
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      padding: '1.25rem',
      transition: 'transform 0.2s, boxShadow 0.2s',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {/* Monthly Income Card */}
      <div style={{ ...styles.card, borderLeft: '4px solid #10B981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600', textTransform: 'uppercase' }}>Monthly Income</span>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10B981', marginBottom: '0.25rem' }}>
          {income > 0 ? formatAmount(income) : 'Not set'}
        </div>
        {income === 0 && (
          <button onClick={onSetIncome} style={{
            marginTop: '0.5rem',
            padding: '0.25rem 0.75rem',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.7rem'
          }}>Set Income</button>
        )}
      </div>

      {/* Total Expenses Card */}
      <div style={{ ...styles.card, borderLeft: '4px solid #DC2626' }}>
        <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600', marginBottom: '0.5rem' }}>Total Expenses</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#DC2626' }}>{formatAmount(totalExpenses)}</div>
      </div>

      {/* Remaining Budget Card */}
      <div style={{ ...styles.card, borderLeft: '4px solid #14B8A6' }}>
        <div style={{ fontSize: '0.75rem', color: '#14B8A6', fontWeight: '600', marginBottom: '0.5rem' }}>Remaining Budget</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#14B8A6' }}>
          {income > 0 ? formatAmount(remainingBudget) : 'Set income'}
        </div>
        {income > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ height: '4px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: Math.min(budgetPercentage, 100) + '%',
                height: '100%',
                backgroundColor: budgetPercentage > 80 ? '#DC2626' : '#14B8A6'
              }}></div>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem', textAlign: 'right' }}>
              {budgetPercentage.toFixed(1)}% spent
            </div>
          </div>
        )}
      </div>

      {/* Savings Card */}
      <div style={{ ...styles.card, borderLeft: '4px solid #3B82F6' }}>
        <div style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: '600', marginBottom: '0.5rem' }}>Savings</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3B82F6' }}>{formatAmount(totalSaved)}</div>
        <button onClick={onSetGoal} style={{
          marginTop: '0.5rem',
          padding: '0.25rem 0.75rem',
          backgroundColor: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.7rem'
        }}>Set Goal</button>
      </div>
    </div>
  );
};

export default DashboardCards;
