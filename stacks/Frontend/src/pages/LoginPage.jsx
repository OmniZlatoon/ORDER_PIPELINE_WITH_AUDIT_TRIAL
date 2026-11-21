import { AlertCircle, ArrowRight, BookOpen, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SIMULATED_ADMIN_SECRET_PIN } from '../api/authService';
import { useAuth } from '../context/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage({ onAdminAccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTarget = location.state?.from || '/';

  const validate = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    // Allow secret code entry in the password field even when email is omitted.
    if (password === SIMULATED_ADMIN_SECRET_PIN) {
      setFieldErrors({});
      return true;
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate() || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await login({ email, password });

      if (result.role === 'ADMIN') {
        if (typeof onAdminAccess === 'function') {
          onAdminAccess();
        } else {
          const standaloneAdminUrl = import.meta.env.VITE_ADMIN_APP_URL;
          if (standaloneAdminUrl) {
            window.location.assign(standaloneAdminUrl);
            return;
          }
          navigate('/admin', { replace: true });
        }
        return;
      }

      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setSubmitError(err?.message || 'Unable to sign in. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cf-auth-shell">
      <div className="cf-auth-grid">
        <aside className="cf-auth-aside" aria-label="Customer account benefits">
          <div className="cf-wave-hero-shape-1" aria-hidden="true" />
          <div className="cf-wave-hero-shape-2" aria-hidden="true" />

          <div className="cf-auth-aside-inner">
            <div className="cf-auth-aside-icon">
              <BookOpen size={24} aria-hidden="true" />
            </div>
            <h1 className="cf-hero-title" style={{ marginBottom: 12 }}>
              Welcome back to OrderFlow Books
            </h1>
            <p className="cf-hero-subtitle" style={{ marginBottom: 24 }}>
              Sign in to speed up checkout, keep your contact details ready, and follow your order progress from purchase to delivery.
            </p>

            <ul className="cf-auth-feature-list">
              <li>Faster checkout with saved name and email</li>
              <li>Instant order confirmation and reference tracking</li>
              <li>Clear shipping and email notification updates</li>
            </ul>
          </div>
        </aside>

        <section className="cf-card cf-auth-card" aria-label="Customer sign in form">
          <div className="cf-meta-line">
            <span>Customer Account</span>
            <span aria-hidden="true">·</span>
            <span>Sign In</span>
          </div>
          <h2 className="cf-page-title" style={{ fontSize: '1.7rem', marginBottom: 6 }}>
            Sign in to your account
          </h2>
          <p className="cf-section-desc" style={{ marginBottom: 22 }}>
            Enter your email address and password to continue shopping.
          </p>

          {submitError ? (
            <div className="cf-alert cf-alert-error" role="alert" style={{ marginBottom: 20 }}>
              <div className="cf-alert-content">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div>
                  <p className="cf-alert-title" style={{ marginBottom: 2 }}>Sign in unsuccessful</p>
                  <p className="cf-alert-text">{submitError}</p>
                </div>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className="cf-form-field">
              <label htmlFor="login-email" className="cf-label">
                Email Address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                className={`cf-input ${fieldErrors.email ? 'cf-input-error' : ''}`}
                placeholder="e.g. alex@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                disabled={submitting}
              />
              {fieldErrors.email ? <p className="cf-field-error">{fieldErrors.email}</p> : null}
            </div>

            <div className="cf-form-field">
              <label htmlFor="login-password" className="cf-label">
                Password
              </label>
              <div className="cf-password-wrap">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`cf-input cf-input-password ${fieldErrors.password ? 'cf-input-error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="cf-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password ? <p className="cf-field-error">{fieldErrors.password}</p> : null}
            </div>

            <button
              type="submit"
              className="cf-btn cf-btn-primary cf-btn-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="cf-spin" aria-hidden="true" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} aria-hidden="true" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="cf-auth-switch">
            <span>New to OrderFlow Books?</span>
            <Link to="/signup" className="cf-auth-switch-link">
              <span>Create an account</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
