import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/errors/NotFoundPage';
import ForbiddenPage from './pages/errors/ForbiddenPage';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';
import ServerErrorPage from './pages/errors/ServerErrorPage';
import BadGatewayPage from './pages/errors/BadGatewayPage';
import BadRequestPage from './pages/errors/BadRequestPage';
import ServiceUnavailablePage from './pages/errors/ServiceUnavailablePage';
import GatewayTimeoutPage from './pages/errors/GatewayTimeoutPage';
import TooManyRequestsPage from './pages/errors/TooManyRequestsPage';

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Check system preference or stored preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme === 'dark' || (!storedTheme && isDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-200">
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 shadow-md transition-colors"
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? (
          <Sun className="h-5 w-5 text-amber-500" />
        ) : (
          <Moon className="h-5 w-5 text-primary-600" />
        )}
      </button>
      
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="404" element={<NotFoundPage />} />
          <Route path="403" element={<ForbiddenPage />} />
          <Route path="401" element={<UnauthorizedPage />} />
          <Route path="400" element={<BadRequestPage />} />
          <Route path="500" element={<ServerErrorPage />} />
          <Route path="502" element={<BadGatewayPage />} />
          <Route path="503" element={<ServiceUnavailablePage />} />
          <Route path="504" element={<GatewayTimeoutPage />} />
          <Route path="429" element={<TooManyRequestsPage />} />
          
          {/* Fallback for any other path */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;