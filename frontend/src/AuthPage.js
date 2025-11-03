import React, { useState } from 'react';

const AuthPage = ({ onLogin, onRegister, onBack }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (authMode === 'register' && !authUsername.trim()) {
      setAuthError('사용자명을 입력해주세요.');
      return;
    }

    const success = authMode === 'login' 
      ? await onLogin(authEmail, authPassword, setAuthError)
      : await onRegister(authEmail, authPassword, authUsername, setAuthError);

    if (success) {
      if (authMode === 'register') {
        // 회원가입 성공 시 로그인 탭으로 전환
        setAuthMode('login');
        setAuthUsername('');
      } else {
        // 로그인 성공 시 폼 초기화
        setAuthEmail('');
        setAuthPassword('');
        setAuthUsername('');
      }
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        {/* 탭 전환 */}
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('login');
              setAuthError('');
              setAuthUsername('');
            }}
          >
            로그인
          </button>
          <button 
            className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('register');
              setAuthError('');
            }}
          >
            회원가입
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleAuth} className="auth-form">
          {authMode === 'register' && (
            <input
              type="text"
              placeholder="사용자명"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              className="auth-input"
              required
            />
          )}
          
          <input
            type="email"
            placeholder="이메일"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            className="auth-input"
            required
          />
          
          <input
            type="password"
            placeholder="비밀번호"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            className="auth-input"
            required
          />

          {/* 에러 메시지 */}
          {authError && (
            <div className="error-message">
              {authError}
            </div>
          )}

          {/* 제출 버튼 */}
          <button type="submit" className="submit-button">
            {authMode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
