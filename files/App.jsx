import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar      from './components/Navbar';
import Home        from './pages/Home';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Listings    from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import MyTrades    from './pages/MyTrades';
import Profile     from './pages/Profile';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/listings"    element={<Listings />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/listings/new" element={<PrivateRoute><CreateListing /></PrivateRoute>} />
          <Route path="/trades"      element={<PrivateRoute><MyTrades /></PrivateRoute>} />
          <Route path="/profile/:id" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
