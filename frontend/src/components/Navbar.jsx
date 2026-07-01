import { useContext } from "react";
import { NavLink } from "react-router-dom";

import { AuthContext } from "../App.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/sessions", label: "Sessions" },
  { to: "/techniques", label: "Techniques" },
  { to: "/rolling", label: "Rolling" },
  { to: "/injuries", label: "Injuries" },
  { to: "/progress", label: "Progress" },
  { to: "/profile", label: "Profile" },
];

export default function Navbar() {
  const { logout, user } = useContext(AuthContext);

  return (
    <header className="topbar">
      <div className="brand-block">
        <span className="brand-mark">ML</span>
        <div>
          <strong>MatLog</strong>
          <span>{user?.academy_name || "Training ledger"}</span>
        </div>
      </div>

      <nav className="nav-scroll" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button className="ghost-button compact" onClick={logout}>
        Log out
      </button>
    </header>
  );
}
