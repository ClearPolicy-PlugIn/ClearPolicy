function sendTermsOfUseToServer(termsContent) {
    fetch('http://localhost:3000/process-terms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ termsContent: termsContent }),
    })
    .then(response => response.json())
    .then(data => {
      console.log("Summary received from server:", data.summary);
    })
    .catch(error => {
      console.error('Error sending terms content to server:', error);
    });
  }