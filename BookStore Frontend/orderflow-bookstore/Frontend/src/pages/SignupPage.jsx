import { AlertCircle, ArrowRight, BookOpen, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SIMULATED_ADMIN_SECRET_PIN } from '../api/authService';
import { useAuth } from '../context/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errors = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errors.fullName = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.fullName = 'Please enter at least 2 characters for your name.';
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6 || password === SIMULATED_ADMIN_SECRET_PIN) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
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
      await signup({ fullName, email, password });
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(err?.message || 'Unable to create your account right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cf-auth-shell">
      <div className="cf-auth-grid">
        <aside className="cf-auth-aside" aria-label="Create customer account overview">
          <div className="cf-wave-hero-shape-1" aria-hidden="true" />
          <div className="cf-wave-hero-shape-2" aria-hidden="true" />

          <div className="cf-auth-aside-inner">
            <div className="cf-auth-aside-icon">
              <BookOpen size={24} aria-hidden="true" />
            </div>
            <h1 className="cf-hero-title" style={{ marginBottom: 12 }}>
              Create your bookstore account
            </h1>
            <p className="cf-hero-subtitle" style={{ marginBottom: 24 }}>
              Set up a customer profile in seconds to place book orders and track every step from checkout to delivery.
            </p>

            <ul className="cf-auth-feature-list">
              <li>Browse live book inventory and stock levels</li>
              <li>Pre-fill your details automatically at checkout</li>
              <li>View order progress and email updates anytime</li>
            </ul>
          </div>
        </aside>

        <section className="cf-card cf-auth-card" aria-label="Customer sign up form">
          <div className="cf-meta-line">
            <span>Customer Account</span>
            <span aria-hidden="true">·</span>
            <span>Create Account</span>
          </div>
          <h2 className="cf-page-title" style={{ fontSize: '1.7rem', marginBottom: 6 }}>
            Sign up for OrderFlow Books
          </h2>
          <p className="cf-section-desc" style={{ marginBottom: 22 }}>
            Fill in your details below to register your customer account.
          </p>

          {submitError ? (
            <div className="cf-alert cf-alert-error" role="alert" style={{ marginBottom: 20 }}>
              <div className="cf-alert-content">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div>
                  <p className="cf-alert-title" style={{ marginBottom: 2 }}>Registration unsuccessful</p>
                  <p className="cf-alert-text">{submitError}</p>
                </div>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className="cf-form-field">
              <label htmlFor="signup-name" className="cf-label">
                Full Name
              </label>
              <input
                id="signup-name"
                name="fullName"
                type="text"
                autoComplete="name"
                className={`cf-input ${fieldErrors.fullName ? 'cf-input-error' : ''}`}
                placeholder="e.g. Jordan Taylor"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) {
                    setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                  }
                }}
                disabled={submitting}
              />
              {fieldErrors.fullName ? <p className="cf-field-error">{fieldErrors.fullName}</p> : null}
            </div>

            <div className="cf-form-field">
              <label htmlFor="signup-email" className="cf-label">
                Email Address
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                className={`cf-input ${fieldErrors.email ? 'cf-input-error' : ''}`}
                placeholder="e.g. jordan@example.com"
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
              <label htmlFor="signup-password" className="cf-label">
                Password
              </label>
              <div className="cf-password-wrap">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`cf-input cf-input-password ${fieldErrors.password ? 'cf-input-error' : ''}`}
                  placeholder="At least 6 characters"
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

            <div className="cf-form-field">
              <label htmlFor="signup-confirm-password" className="cf-label">
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`cf-input ${fieldErrors.confirmPassword ? 'cf-input-error' : ''}`}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                disabled={submitting}
              />
              {fieldErrors.confirmPassword ? (
                <p className="cf-field-error">{fieldErrors.confirmPassword}</p>
              ) : null}
            </div>

            <button
              type="submit"
              className="cf-btn cf-btn-primary cf-btn-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="cf-spin" aria-hidden="true" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} aria-hidden="true" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="cf-auth-switch">
            <span>Already have an account?</span>
            <Link to="/login" className="cf-auth-switch-link">
              <span>Sign in</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
