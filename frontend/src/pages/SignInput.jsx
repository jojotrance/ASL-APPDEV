import React, { useState } from 'react';

function SignInput() {
  const [inputText, setInputText] = useState('');
  const [matchFound, setMatchFound] = useState(null); // null | true | false
  const [showResult, setShowResult] = useState(false);

  // Simulate sign matching logic
  const handleCheckSigns = () => {
    if (!inputText.trim()) return;
    // Simulate: if phrase contains "hello" or "thank", match found
    if (/hello|thank/i.test(inputText)) {
      setMatchFound(true);
    } else {
      setMatchFound(false);
    }
    setShowResult(true);
  };

  const handleReset = () => {
    setInputText('');
    setMatchFound(null);
    setShowResult(false);
  };

  return (
    <div className="home-container" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">⌨️</span>
            Type to Sign
          </h1>
          <p className="app-subtitle">Convert text phrases to ASL signs or fingerspelling</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 40 }}>
        <div className="signinput-container" style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 18,
          boxShadow: '0 4px 32px 0 rgba(0,0,0,0.07)',
          padding: 36,
          minWidth: 380,
          maxWidth: 480,
          width: '100%',
        }}>
          <div className="signinput-flow">
            <div className="flow-step">
              <span className="flow-label">1. Type a phrase</span>
              <input
                className="signinput-textbox"
                type="text"
                placeholder="Enter text to translate to ASL..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 18,
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                  marginTop: 10,
                  marginBottom: 24,
                  outline: 'none',
                  background: '#f7f7fa'
                }}
                disabled={showResult}
              />
            </div>
            <div className="flow-step">
              <span className="flow-label">2. Check for ASL sign</span>
              <button
                className="check-btn"
                onClick={handleCheckSigns}
                disabled={!inputText.trim() || showResult}
                style={{
                  background: 'linear-gradient(90deg, #4f8cff 0%, #38e7b0 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 28px',
                  fontSize: 18,
                  fontWeight: 600,
                  cursor: (!inputText.trim() || showResult) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px 0 rgba(79,140,255,0.08)',
                  marginTop: 8,
                  marginBottom: 24,
                  transition: 'background 0.2s'
                }}
              >
                Check Signs
              </button>
            </div>
            {showResult && (
              <div className="flow-step">
                <span className="flow-label">3. Result</span>
                <div style={{
                  marginTop: 16,
                  marginBottom: 16,
                  padding: 24,
                  borderRadius: 12,
                  background: matchFound ? 'linear-gradient(90deg, #38e7b0 0%, #4f8cff 100%)' : 'linear-gradient(90deg, #ffb347 0%, #ff5e62 100%)',
                  color: '#fff',
                  fontSize: 20,
                  fontWeight: 500,
                  textAlign: 'center',
                  minHeight: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {matchFound === true ? (
                    <>
                      <span style={{ fontSize: 32, marginBottom: 8 }}>✅ ASL Animation Found</span>
                      <span style={{ fontSize: 16, opacity: 0.9 }}>Showing ASL sign animation for your phrase.</span>
                      {/* Placeholder for animation */}
                      <div style={{
                        marginTop: 18,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 12px 0 rgba(56,231,176,0.13)'
                      }}>
                        <span style={{ fontSize: 48 }}>👐</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 32, marginBottom: 8 }}>🔤 Fingerspelling</span>
                      <span style={{ fontSize: 16, opacity: 0.9 }}>No direct ASL sign found. Showing fingerspelling.</span>
                      {/* Placeholder for fingerspelling */}
                      <div style={{
                        marginTop: 18,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 12px 0 rgba(255,94,98,0.13)'
                      }}>
                        <span style={{ fontSize: 48 }}>🤟</span>
                      </div>
                    </>
                  )}
                </div>
                <button
                  className="reset-btn"
                  onClick={handleReset}
                  style={{
                    background: '#f7f7fa',
                    color: '#4f8cff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 22px',
                    fontSize: 16,
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginTop: 8
                  }}
                >
                  Try Another Phrase
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SignInput;