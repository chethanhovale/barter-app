import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar        from './components/Navbar';
import LandingPage   from './pages/LandingPage';
import Home          from './pages/Home';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Listings      from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import MyTrades      from './pages/MyTrades';
import TradeDetail   from './pages/TradeDetail';
import Profile       from './pages/Profile';
import Dashboard     from './pages/Dashboard';
import Wishlist      from './pages/Wishlist';
import Valuate       from './pages/Valuate';
import WhatCanIGet   from './pages/WhatCanIGet';
import About         from './pages/About';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// Show landing page to logged-out users, dashboard to logged-in users
const HomeRoute = () => {
  const { user } = useAuth();
  return user ? (
    <>
      <Navbar />
      <Home />
    </>
  ) : (
    <LandingPage />   // No navbar — landing page has its own
  );
};

// Pages that always show the Navbar
const WithNav = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing / Home — smart routing */}
          <Route path="/" element={<HomeRoute />} />

          {/* Auth pages — no navbar */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public pages — with navbar */}
          <Route path="/listings"     element={<WithNav><Listings /></WithNav>} />
          <Route path="/listings/:id" element={<WithNav><ListingDetail /></WithNav>} />
          <Route path="/valuate"        element={<WithNav><Valuate /></WithNav>} />
          <Route path="/what-can-i-get" element={<WithNav><WhatCanIGet /></WithNav>} />
          <Route path="/about"          element={<About />} />
          <Route path="/profile/:id"    element={<WithNav><Profile /></WithNav>} />

          {/* Private pages — with navbar */}
          <Route path="/listings/new" element={<PrivateRoute><WithNav><CreateListing /></WithNav></PrivateRoute>} />
          <Route path="/trades"       element={<PrivateRoute><WithNav><MyTrades /></WithNav></PrivateRoute>} />
          <Route path="/trades/:id"   element={<PrivateRoute><WithNav><TradeDetail /></WithNav></PrivateRoute>} />
          <Route path="/dashboard"    element={<PrivateRoute><WithNav><Dashboard /></WithNav></PrivateRoute>} />
          <Route path="/wishlist"     element={<PrivateRoute><WithNav><Wishlist /></WithNav></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
