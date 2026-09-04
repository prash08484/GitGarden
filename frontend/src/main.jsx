import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ProjectRoutes from './Routes.jsx'
import { AuthProvider } from './authContext.jsx';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Router>
      <ProjectRoutes/>
      <Toaster position="bottom-right" reverseOrder={false} />
    </Router>
  </AuthProvider>
)
