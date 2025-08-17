import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './services/AuthContext'
import Home from './pages/Home'
import LoginScreen from './pages/auth/LoginScreen'
import RegisterScreen from './pages/Auth/RegisterScreen'
import ForgotPasswordScreen from './pages/Auth/ForgotPasswordScreen'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen/>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App;