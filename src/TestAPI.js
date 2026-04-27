import React, { useState } from 'react';
import API_URL from './config';

function TestAPI() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    setResult('Testing connection...');
    
    try {
      const response = await fetch(${API_URL}/api/auth/register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'TestUser',
          email: 	est@test.com,
          password: '123456'
        })
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(Error: );
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>API Test Page</h1>
      <button onClick={testBackend} disabled={loading}>
        {loading ? 'Testing...' : 'Test Backend Connection'}
      </button>
      <pre style={{ marginTop: '20px', background: '#f0f0f0', padding: '10px' }}>
        {result}
      </pre>
    </div>
  );
}

export default TestAPI;
