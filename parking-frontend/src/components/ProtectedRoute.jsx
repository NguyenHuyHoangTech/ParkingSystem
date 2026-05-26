import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role'); // Role stored as ROLE_USER, ROLE_ADMIN, etc.

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Normalize role (e.g., convert ROLE_ADMIN -> ADMIN for flexible comparison)
  const normalizedRole = userRole ? userRole.replace('ROLE_', '') : '';

  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    // Insufficient permissions -> Navigate to default page corresponding to role
    if (normalizedRole === 'ADMIN') return <Navigate to="/admin" replace />;
    if (normalizedRole === 'MANAGER') return <Navigate to="/manager" replace />;
    if (normalizedRole === 'STAFF') return <Navigate to="/staff" replace />;
    return <Navigate to="/user" replace />;
  }

  return children;
};

export default ProtectedRoute;
