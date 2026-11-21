/**
 * Simulated Authentication Service (Local Testing Only)
 *
 * NOTE: No cloud server or external authentication provider is connected.
 * Look for the "DATABASE INTEGRATION GAP" sections below to wire your
 * real database queries or server endpoints when ready.
 */

const USERS_STORAGE_KEY = 'orderflow_simulated_users_v1';
const SESSION_STORAGE_KEY = 'orderflow_simulated_customer_session_v1';
const ADMIN_SESSION_KEY = 'orderflow_admin_unlocked';

// Simulated secret PIN entered in the customer login password field to unlock Admin access.
export const SIMULATED_ADMIN_SECRET_PIN = '8426';

const SEEDED_TEST_USERS = [
  {
    userId: 1,
    fullName: 'Alex Example',
    email: 'alex@example.com',
    password: 'password123',
    role: 'CUSTOMER',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
];

function readSimulatedUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEEDED_TEST_USERS));
      return [...SEEDED_TEST_USERS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEEDED_TEST_USERS];
  } catch {
    return [...SEEDED_TEST_USERS];
  }
}

function writeSimulatedUsers(users) {
  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage quota errors in restricted browsers.
  }
}

export function getActiveCustomerSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCustomerSession() {
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function unlockSimulatedAdminSession() {
  try {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } catch {
    // Ignore storage errors.
  }
}

/**
 * Simulated Customer Signup
 *
 * ============================================================================
 * DATABASE INTEGRATION GAP — CUSTOMER REGISTRATION
 * Replace the simulated local store logic below with your real database call:
 *
 *   const response = await axiosClient.post('/api/auth/signup', {
 *     fullName,
 *     email,
 *     password,
 *   });
 *   return response.data;
 *
 * Your database layer should:
 *   1. Check that the email does not already exist in the users table.
 *   2. Hash the password before inserting the user row.
 *   3. Return the created customer profile (userId, fullName, email, role).
 * ============================================================================
 */
export async function signupCustomer({ fullName, email, password }) {
  const normalizedName = String(fullName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  // --- Simulated local check & insert (remove once database is connected) ---
  const users = readSimulatedUsers();
  const exists = users.some(
    (user) => String(user.email || '').toLowerCase() === normalizedEmail
  );

  if (exists) {
    throw new Error('An account with this email address already exists.');
  }

  const nextUser = {
    userId: users.reduce((max, u) => Math.max(max, Number(u.userId) || 0), 0) + 1,
    fullName: normalizedName,
    email: normalizedEmail,
    password: rawPassword,
    role: 'CUSTOMER',
    createdAt: new Date().toISOString(),
  };

  writeSimulatedUsers([...users, nextUser]);

  const publicProfile = {
    userId: nextUser.userId,
    fullName: nextUser.fullName,
    email: nextUser.email,
    role: nextUser.role,
  };

  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(publicProfile));
  } catch {
    // Ignore storage errors.
  }

  return publicProfile;
}

/**
 * Simulated Customer & Admin Login (via Customer Login Form)
 *
 * ============================================================================
 * DATABASE INTEGRATION GAP — USER & ADMIN AUTHENTICATION
 * Replace the simulated checks below with your real database query:
 *
 *   const response = await axiosClient.post('/api/auth/login', {
 *     email,
 *     password,
 *   });
 *   // Backend queries the users / admin_credentials table:
 *   //   - If the submitted password matches the stored admin secret PIN,
 *   //     return { role: 'ADMIN', ... }.
 *   //   - Otherwise verify customer email + hashed password and return
 *   //     { role: 'CUSTOMER', userId, fullName, email }.
 * ============================================================================
 */
export async function loginWithCredentials({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  // --- Simulated secret admin PIN check (replace with database check later) ---
  if (rawPassword === SIMULATED_ADMIN_SECRET_PIN) {
    unlockSimulatedAdminSession();
    return {
      role: 'ADMIN',
      user: null,
    };
  }

  // --- Simulated customer database lookup (replace with database query later) ---
  const users = readSimulatedUsers();
  const matchedUser = users.find(
    (user) =>
      String(user.email || '').toLowerCase() === normalizedEmail
      && user.password === rawPassword
  );

  if (!matchedUser) {
    throw new Error('Invalid email address or password. Please check your details and try again.');
  }

  const publicProfile = {
    userId: matchedUser.userId,
    fullName: matchedUser.fullName,
    email: matchedUser.email,
    role: 'CUSTOMER',
  };

  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(publicProfile));
  } catch {
    // Ignore storage errors.
  }

  return {
    role: 'CUSTOMER',
    user: publicProfile,
  };
}
