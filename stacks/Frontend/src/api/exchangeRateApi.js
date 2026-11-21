import axiosClient from './axiosClient';

export async function fetchUsdToXafRate() {
  const response = await axiosClient.get('/api/exchange-rate/usd-xaf');
  return response.data;
}
