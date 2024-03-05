import React, { useContext } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import { Navigate } from 'react-router-dom';
import Navbar from './components/navbar.tsx';
import Conversion from './components/conversion.tsx';
import reportWebVitals from './reportWebVitals';
import { AuthContext, AuthContextProvider } from './components/AuthContext.tsx'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useContext(AuthContext);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
root.render(
  <React.StrictMode>
    <AuthContextProvider>
      <Router>
        <Navbar />
          <Routes>
            <Route path="/" exact element={<App />} />
            <Route path="/conversion" exact  element={<ProtectedRoute><Conversion /></ProtectedRoute>} />
          </Routes>
      </Router>
    </AuthContextProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
