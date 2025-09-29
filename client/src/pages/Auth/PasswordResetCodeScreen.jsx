import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PasswordResetCodeScreen.css';
import { authService } from '../../services/authService';

const PasswordResetCodeScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, resetToken } = location.state || {};
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (text, index) => {
    if (text.length > 1) {
      text = text.charAt(0);
    }
    
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isCodeComplete = code.every(digit => digit.length === 1);
  const fullCode = code.join('');

  const handleVerifyCode = async () => {
    if (!isCodeComplete) {
      alert('Incomplete Code\nPlease enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.verifyResetCode(email, fullCode);
      
      if (result.success) {
        navigate('/new-password', {
          state: {
            email: email,
            resetCode: fullCode,
            verificationToken: result.verificationToken
          }
        });
      } else {
        alert('Invalid Code\n' + (result.message || 'The code you entered is incorrect or expired'));
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verify code error:', error);
      alert('Error\nConnection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      const result = await authService.sendPasswordResetCode(email);
      
      if (result.success) {
        alert('Code Sent\nA new reset code has been sent to your email');
        setResendCooldown(60); 
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        alert('Error\n' + (result.message || 'Failed to resend code'));
      }
    } catch (error) {
      console.error('Resend code error:', error);
      alert('Error\nConnection failed. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="password-reset-code-screen">
      <div className="container">
        <div className="header">
          <div className="logo-container">
            <div className="logo-background">
              <span className="logo-text">📧</span>
            </div>
          </div>

          <h1 className="title">Enter Reset Code</h1>
          
          <p className="subtitle">
            We've sent a 6-digit code to
          </p>
          <p className="email-text">{email}</p>
          <p className="subtitle">
            Enter the code below to continue
          </p>
        </div>

        <div className="form">
          <div className="code-container">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(ref) => inputRefs.current[index] = ref}
                className={`code-input ${digit ? 'code-input-filled' : ''}`}
                value={digit}
                onChange={(e) => handleCodeChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                maxLength={1}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                autoComplete="one-time-code"
                autoFocus={index === 0}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>

          <div className="form-action">
            <button
              onClick={handleVerifyCode}
              disabled={!isCodeComplete || isLoading}
              className={`btn ${(!isCodeComplete || isLoading) ? 'btn-disabled' : ''}`}
            >
              {isLoading ? (
                <div className="spinner"></div>
              ) : (
                'Verify Code'
              )}
            </button>
          </div>

          <div className="resend-container">
            <p className="resend-text">Didn't receive the code?</p>
            <button
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || isResending}
              className="resend-button"
            >
              {isResending ? (
                <div className="spinner-small"></div>
              ) : (
                <span className={`resend-button-text ${(resendCooldown > 0) ? 'resend-button-text-disabled' : ''}`}>
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s` 
                    : 'Resend Code'
                  }
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => navigate('/forgot-password')}
            className="back-button"
          >
            <span className="back-button-text">← Back to Email</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetCodeScreen;