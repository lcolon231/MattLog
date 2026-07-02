import { createContext, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { api, clearAuth, getStoredUser, saveAuth } from "./api/client.js";
import Calendar from "./pages/Calendar.jsx";
import Competitions from "./pages/Competitions.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Goals from "./pages/Goals.jsx";
import Injuries from "./pages/Injuries.jsx";
import Login from "./pages/Login.jsx";
import NewSession from "./pages/NewSession.jsx";
import Profile from "./pages/Profile.jsx";
import Progress from "./pages/Progress.jsx";
import Register from "./pages/Register.jsx";
import Reports from "./pages/Reports.jsx";
import Rolling from "./pages/Rolling.jsx";
import Sessions from "./pages/Sessions.jsx";
import Techniques from "./pages/Techniques.jsx";
import Timeline from "./pages/Timeline.jsx";

export const AuthContext = createContext(null);

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [checkingAuth, setCheckingAuth] = useState(Boolean(localStorage.getItem("matlog_token")));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!localStorage.getItem("matlog_token")) {
      setCheckingAuth(false);
      return;
    }

    api
      .me()
      .then((freshUser) => {
        localStorage.setItem("matlog_user", JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  const auth = useMemo(
    () => ({
      user,
      checkingAuth,
      setUser,
      login: (accessToken, nextUser) => {
        saveAuth(accessToken, nextUser);
        setUser(nextUser);
        navigate("/dashboard");
      },
      logout: () => {
        clearAuth();
        setUser(null);
        navigate("/login");
      },
    }),
    [checkingAuth, navigate, user]
  );

  const showNavbar = user && !["/login", "/register"].includes(location.pathname);

  return (
    <AuthContext.Provider value={auth}>
      <div className="app-shell">
        {showNavbar && <Navbar />}
        <main className={showNavbar ? "main-content with-nav" : "main-content auth-main"}>
          <Routes>
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions"
              element={
                <ProtectedRoute>
                  <Sessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions/new"
              element={
                <ProtectedRoute>
                  <NewSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/techniques"
              element={
                <ProtectedRoute>
                  <Techniques />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rolling"
              element={
                <ProtectedRoute>
                  <Rolling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <Goals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitions"
              element={
                <ProtectedRoute>
                  <Competitions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/injuries"
              element={
                <ProtectedRoute>
                  <Injuries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timeline"
              element={
                <ProtectedRoute>
                  <Timeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
