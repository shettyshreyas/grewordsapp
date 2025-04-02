// config.js
const backends = {
  local: 'http://localhost:5000',
  production: 'https://grewords-backend.onrender.com'
};

const defaultBackend = process.env.NODE_ENV === 'production' ? 'production' : 'local';

const config = {
  apiUrl: backends[defaultBackend],
  backends,
  defaultBackend
};

export default config;