// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect the root URL to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Your login page */}
        <Route path="/login" element={<AdminLogin />} />

        {/* Your protected admin panel */}
        <Route path="/admin" element={<AdminPanel userName="Alaa Yehya" />} />

        {/* Fallback for any unknown URL */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
