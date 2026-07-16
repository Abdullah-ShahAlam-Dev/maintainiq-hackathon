import axios from 'axios';

// Cookie-based auth: the httpOnly "token" cookie set by the backend on
// login is sent automatically by the browser as long as withCredentials
// is true. There is no token to attach manually anymore.
const api = axios.create({
  baseURL: 'https://maintainiq-hackathon.onrender.com/api',
  // baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

export default api;
