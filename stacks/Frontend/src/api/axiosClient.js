import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const axiosClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export function extractApiError(error, fallbackMessage = 'Unable to complete the request. Please try again.') {
  if (!error) {
    return { message: fallbackMessage, status: null, orderId: null };
  }

  if (error.code === 'ECONNABORTED') {
    return {
      message: 'The request took too long to respond. Please try again.',
      status: null,
      orderId: null,
    };
  }

  if (!error.response) {
    if (error instanceof Error && error.message && error.message !== 'Network Error') {
      return {
        message: error.message,
        status: null,
        orderId: null,
      };
    }
    return {
      message: 'Unable to connect to the bookstore service right now. Please try again shortly.',
      status: null,
      orderId: null,
    };
  }

  const { status, data } = error.response;
  const orderId = data && (data.orderId || data.id) ? data.orderId || data.id : null;

  if (typeof data === 'string' && data.trim().length > 0 && data.trim().length < 240 && !data.includes('Exception')) {
    return { message: data.trim(), status, orderId };
  }

  if (data && typeof data === 'object') {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const joined = data.errors
        .map((item) => (typeof item === 'string' ? item : item.defaultMessage || item.message))
        .filter(Boolean)
        .join(' ');
      if (joined) {
        return { message: joined, status, orderId };
      }
    }

    if (data.fieldErrors && typeof data.fieldErrors === 'object') {
      const fieldMessages = Object.values(data.fieldErrors).filter(Boolean).join(' ');
      if (fieldMessages) {
        return { message: fieldMessages, status, orderId };
      }
    }

    if (typeof data.message === 'string' && data.message.trim()) {
      return { message: data.message.trim(), status, orderId };
    }

    if (typeof data.detail === 'string' && data.detail.trim()) {
      return { message: data.detail.trim(), status, orderId };
    }
  }

  if (status === 400 || status === 422) {
    return { message: 'Please check your input details and try again.', status, orderId };
  }
  if (status === 404) {
    return { message: 'The requested record could not be found.', status, orderId };
  }
  if (status === 409) {
    return { message: 'This order could not be completed because stock or order availability changed.', status, orderId };
  }
  if (status >= 500) {
    return { message: 'Something went wrong on our end while processing your request. Please try again.', status, orderId };
  }

  return { message: fallbackMessage, status, orderId };
}

export default axiosClient;
