// Anti-DevTools Protection Script
(function() {
  // Detect DevTools by checking window size difference
  function detectDevTools() {
    const before = new Date();
    debugger;
    const after = new Date();
    const timeDiff = after - before;
    
    if (timeDiff > 100) {
      document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #1a1a2e; color: white; font-family: Arial, sans-serif; text-align: center; padding: 20px;"><div><h1>Access Denied</h1><p>Developer tools are not allowed on this website.</p><p>Please close DevTools to continue.</p><button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button></div></div>';
      return true;
    }
    return false;
  }

  window.addEventListener('load', function() {
    detectDevTools();
  });

  setInterval(function() {
    detectDevTools();
  }, 1000);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U') ||
        (e.ctrlKey && e.key === 'S')) {
      e.preventDefault();
      document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #1a1a2e; color: white; font-family: Arial, sans-serif; text-align: center; padding: 20px;"><div><h1>Access Denied</h1><p>Developer tools are not allowed on this website.</p><p>Please close DevTools to continue.</p><button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button></div></div>';
      return false;
    }
  });

  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });
})();
