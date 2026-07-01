import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client.js";
import { AuthContext } from "../App.jsx";
import StatCard from "../components/StatCard.jsx";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!stats) {
    return <div className="loading-panel">Loading dashboard...</div>;
  }

  const recent = stats.most_recent_session;

  return (
    <section className="page-stack">
      <div className="dashboard-hero">
        <div>
          <span className="brand-kicker">Training room</span>
          <h1>{user?.first_name ? `${user.first_name}'s mat ledger` : "Mat ledger"}</h1>
          <p>
            {stats.sessions_this_week} sessions this week. Current rank: {stats.current_belt} belt,
            {" "}
            {stats.current_stripes} stripe{stats.current_stripes === 1 ? "" : "s"}.
          </p>
        </div>
        <Link className="primary-button" to="/sessions/new">
          Add session
        </Link>
      </div>

      <section className="stat-grid">
        <StatCard label="Sessions" value={stats.total_sessions} detail={`${stats.sessions_this_week} this week`} />
        <StatCard label="Training hours" value={stats.total_training_hours} detail={`${stats.total_training_minutes} minutes`} />
        <StatCard label="Rolling rounds" value={stats.total_rolling_rounds} detail={`${stats.total_rolling_minutes} minutes`} />
        <StatCard label="Current belt" value={stats.current_belt} detail={`${stats.current_stripes} stripes`} />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Recent session</h2>
          <Link to="/sessions">View all</Link>
        </div>
        {recent ? (
          <div className="recent-session">
            <div>
              <strong>{recent.class_type}</strong>
              <span>{recent.date} / {recent.duration_minutes} min / {recent.intensity}</span>
            </div>
            <p>{recent.techniques_learned || recent.notes || "No notes yet."}</p>
          </div>
        ) : (
          <div className="empty-state">No sessions logged yet. Add your first class after training.</div>
        )}
      </section>
    </section>
  );
}
