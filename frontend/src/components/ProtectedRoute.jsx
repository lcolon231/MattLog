import { useContext } from "react";
import { Navigate } from "react-router-dom";

import { AuthContext } from "../App.jsx";

export default function ProtectedRoute({ children }) {
  const { user, checkingAuth } = useContext(AuthContext);

  if (checkingAuth) {
    return <div className="loading-panel">Checking your session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
