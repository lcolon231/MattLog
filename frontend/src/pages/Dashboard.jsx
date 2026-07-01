import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client.js";
import { AuthContext } from "../App.jsx";
import StatCard from "../components/StatCard.jsx";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [injuryAlerts, setInjuryAlerts] = useState([]);
  const [trainingLoad, setTrainingLoad] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.dashboard(), api.injuryAlerts(), api.trainingLoad()])
      .then(([nextStats, nextAlerts, nextLoad]) => {
        setStats(nextStats);
        setInjuryAlerts(nextAlerts);
        setTrainingLoad(nextLoad);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!stats) {
    return <div className="loading-panel">Loading dashboard...</div>;
  }

  const recent = stats.most_recent_session;
  const formatChange = (value) => {
    if (value === null || value === undefined) {
      return "No baseline last week";
    }
    return `${value > 0 ? "+" : ""}${value}% vs last week`;
  };

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

      {trainingLoad && (
        <section className="panel">
          <div className="panel-heading">
            <h2>Training load</h2>
          </div>
          <div className="load-grid">
            <div className="load-card">
              <span>Training minutes</span>
              <strong>{trainingLoad.training_minutes_this_week}</strong>
              <small>{formatChange(trainingLoad.training_minutes_change_percent)}</small>
            </div>
            <div className="load-card">
              <span>Rolling minutes</span>
              <strong>{trainingLoad.rolling_minutes_this_week}</strong>
              <small>{formatChange(trainingLoad.rolling_minutes_change_percent)}</small>
            </div>
            <div className="load-card">
              <span>Sessions</span>
              <strong>{trainingLoad.sessions_this_week}</strong>
              <small>{trainingLoad.sessions_last_week} last week</small>
            </div>
            <div className="load-card">
              <span>Rolling rounds</span>
              <strong>{trainingLoad.rolling_rounds_this_week}</strong>
              <small>{trainingLoad.rolling_rounds_last_week} last week</small>
            </div>
          </div>
          {trainingLoad.warning_message && (
            <p className="notice-message">{trainingLoad.warning_message} Consider adding an easier round or a recovery day.</p>
          )}
        </section>
      )}

      <section className="panel injury-alert-panel">
        <div className="panel-heading">
          <h2>Injury alerts</h2>
          <Link to="/injuries">Manage</Link>
        </div>
        {injuryAlerts.length > 0 ? (
          <div className="injury-alert-list">
            {injuryAlerts.map((injury) => (
              <article className="injury-alert" key={injury.id}>
                <div>
                  <strong>Active {injury.body_part.toLowerCase()} injury, pain {injury.pain_level}/10</strong>
                  <p>
                    {injury.training_modification
                      ? `Modify training: ${injury.training_modification}`
                      : "Modify training: keep this visible before hard rounds."}
                  </p>
                </div>
                {injury.session_id && <span>Session #{injury.session_id}</span>}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">No active injuries logged. Keep the warmups honest and carry on.</div>
        )}
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
