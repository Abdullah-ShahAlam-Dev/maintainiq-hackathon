import axios from 'axios';

const api = axios.create({
  baseURL: 'https://frontend-loyhj3lyh-abdullah-shahalam-devs-projects.vercel.app/login'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
