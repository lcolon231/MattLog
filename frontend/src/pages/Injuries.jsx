import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import ResourceManager from "../components/ResourceManager.jsx";

const bodyParts = [
  "Head / face",
  "Neck",
  "Shoulder",
  "Elbow",
  "Wrist / hand",
  "Rib / chest",
  "Back",
  "Hip / groin",
  "Knee",
  "Ankle / foot",
  "Skin / mat burn",
  "Other",
];

const fields = [
  { name: "session_id", label: "Linked session ID", type: "number", placeholder: "Optional" },
  { name: "body_part", label: "Body part", type: "select", options: bodyParts, required: true },
  { name: "pain_level", label: "Pain level", type: "number", min: 0, max: 10, defaultValue: 1, required: true },
  { name: "cause", label: "Cause" },
  { name: "training_modification", label: "Training modification", type: "textarea" },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "resolved", label: "Resolved", type: "checkbox", defaultValue: false },
];

export default function Injuries() {
  const [searchParams] = useSearchParams();
  const fromSession = searchParams.get("fromSession");
  const initialValues = useMemo(
    () =>
      fromSession
        ? {
            session_id: Number(fromSession),
            cause: `Injured during session #${fromSession}`,
          }
        : {},
    [fromSession]
  );

  return (
    <ResourceManager
      title="Injuries"
      eyebrow="Body check"
      description="Keep small warnings visible before they become long layoffs."
      resource="injuries"
      fields={fields}
      formNote={fromSession ? "Session saved. Add the injury details now." : ""}
      initialValues={initialValues}
      emptyText="No injuries logged. Good. Keep listening to your body."
      renderItem={(item) => (
        <>
          <div className="card-main">
            <div>
              <span className="card-date">{item.resolved ? "resolved" : "active"}</span>
              <h2>{item.body_part}</h2>
              <p>{item.training_modification || item.notes || item.cause || "No notes added."}</p>
            </div>
            <div className="metric-pill">{item.pain_level}/10</div>
          </div>
          <div className="tag-row">
            {item.session_id && <span>Session #{item.session_id}</span>}
            {item.cause && <span>{item.cause}</span>}
            <span>{item.resolved ? "resolved" : "monitor"}</span>
          </div>
        </>
      )}
    />
  );
}
