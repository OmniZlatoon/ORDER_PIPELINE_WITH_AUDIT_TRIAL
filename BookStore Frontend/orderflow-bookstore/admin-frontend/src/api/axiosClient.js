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

export function extractApiError(error, fallbackMessage = 'Unable to complete the request.') {
  if (!error) {
    return { message: fallbackMessage, status: null, endpointUnavailable: false };
  }

  if (error.code === 'ECONNABORTED') {
    return {
      message: 'The request took too long to respond. Please try again.',
      status: null,
      endpointUnavailable: false,
    };
  }

  if (!error.response) {
    return {
      message: 'Unable to connect to the bookstore service right now. Please verify the service is available and try again.',
      status: null,
      endpointUnavailable: false,
    };
  }

  const { status, data } = error.response;
  const endpointUnavailable = status === 404 || status === 405;

  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) {
      return { message: data.message.trim(), status, endpointUnavailable };
    }
    if (typeof data.detail === 'string' && data.detail.trim()) {
      return { message: data.detail.trim(), status, endpointUnavailable };
    }
  }

  if (status === 404) {
    return { message: 'The requested order or record was not found.', status, endpointUnavailable: true };
  }
  if (status === 405) {
    return { message: 'This action is not currently available.', status, endpointUnavailable: true };
  }
  if (status >= 500) {
    return { message: 'An unexpected error occurred while processing your request.', status, endpointUnavailable: false };
  }

  return { message: fallbackMessage, status, endpointUnavailable };
}

export default axiosClient;
