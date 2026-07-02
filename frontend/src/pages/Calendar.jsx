import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client.js";

export default function Calendar() {
  const [sessions, setSessions] = useState([]);
  const [injuries, setInjuries] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.list("sessions"), api.list("injuries"), api.list("competitions")])
      .then(([nextSessions, nextInjuries, nextCompetitions]) => {
        setSessions(nextSessions);
        setInjuries(nextInjuries);
        setCompetitions(nextCompetitions);
      })
      .catch((err) => setError(err.message));
  }, []);

  const events = useMemo(() => {
    const sessionEvents = sessions.map((session) => ({
      id: `session-${session.id}`,
      date: session.date,
      type: "session",
      title: session.class_type,
      detail: `${session.duration_minutes} min / ${session.intensity}`,
    }));
    const injuryEvents = injuries.map((injury) => ({
      id: `injury-${injury.id}`,
      date: injury.created_at.slice(0, 10),
      type: "injury",
      title: `${injury.body_part} injury`,
      detail: `Pain ${injury.pain_level}/10`,
    }));
    const competitionEvents = competitions.map((competition) => ({
      id: `competition-${competition.id}`,
      date: competition.competition_date,
      type: "competition",
      title: competition.name,
      detail: competition.result || competition.focus_plan || "Competition day",
    }));

    return [...sessionEvents, ...injuryEvents, ...competitionEvents].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [competitions, injuries, sessions]);

  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>Training calendar</span>
        <h1>Calendar</h1>
        <p>Scan sessions, injury dates, and competition days in one place.</p>
      </div>

      {error && <p className="error-message">{error}</p>}

      <section className="calendar-grid">
        {events.map((event) => (
          <article className={`calendar-card ${event.type}`} key={event.id}>
            <span>{event.date}</span>
            <h2>{event.title}</h2>
            <p>{event.detail}</p>
          </article>
        ))}
        {!error && events.length === 0 && (
          <div className="empty-state">No calendar events yet.</div>
        )}
      </section>
    </section>
  );
}
