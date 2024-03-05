import React, { useEffect, useRef, useState, useContext} from 'react';
import { AuthContext } from './AuthContext.tsx';
import './login.css';

interface RegistrationProps {
  onClose: () => void;
}

const Registration: React.FC<RegistrationProps> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState(''); 
  const [isError, setIsError] = useState(false); 
  const [isRegistered, setIsRegistered] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const { register } = useContext(AuthContext);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { username, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    const auth = await register(username, email, password);
    if (auth) {
      setIsRegistered(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setIsError(true);
      setErrorMessage('Registration failed');
      setTimeout(() => {
        setIsError(false);
      }, 2000);
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
      <div className="login-overlay">
        <div ref={modalRef} className="login-modal">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-5 w-5 mr-2"
              >
                <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /> 
              </svg>
              Registration
              <div className="w-72 p-4 space-y-4 flex flex-col items-center">
                <div className="space-y-2 w-full">
                  <div className="flex items-center w-full">
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center w-full"> 
                    <input 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center w-full">
                    <input 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="password" 
                      placeholder="Password" 
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center w-full">
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="confirmPassword"
                      placeholder="Confirm Password"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                  {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                  <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
                    Register 
                  </button>
                </div>
              </div>
            </div>
            {isRegistered && (
              <div className="success-message">
                ✅   
              </div>
            )}
            {isError && (
              <div className="error-message">
                ❌ 
              </div>
            )}
          </form>
        </div>
      </div>
  );
};

export default Registration;
