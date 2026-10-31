
import { useEffect, useState } from "react";
import "./InterviewTracker.css";

const API_URL = "http://localhost:8080/api/interviews";
function getInterviewReminder(interviewDate, interviewStatus) {
  if (!interviewDate || interviewStatus?.toUpperCase() !== "SCHEDULED") {
    return null;
  }

  const interview = new Date(interviewDate);

  if (Number.isNaN(interview.getTime())) {
    return null;
  }

  const now = new Date();

  // Compare calendar dates.
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const interviewDay = new Date(
    interview.getFullYear(),
    interview.getMonth(),
    interview.getDate()
  );

  const daysUntil = Math.round(
    (interviewDay - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntil < 0) {
    return null;
  }

  if (daysUntil === 0) {
    return { text: "🔔 Interview Today!", type: "today" };
  }

  if (daysUntil === 1) {
    return { text: "⏰ Interview Tomorrow", type: "tomorrow" };
  }

  if (daysUntil <= 7) {
    return {
      text: `📅 Interview in ${daysUntil} days`,
      type: "upcoming",
    };
  }

  return null;
}

function InterviewTracker() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    jobTitle: "",
    interviewDate: "",
    interviewType: "Technical",
    interviewStatus: "SCHEDULED",
    preparationNotes: "",
    preparationCompleted: false,
  });

  async function loadInterviews() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load interviews.");
      }

      const data = await response.json();
      setInterviews(data);
    } catch {
      setError("Unable to connect to the interview service. Check that your backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInterviews();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...form,
      interviewDate: form.interviewDate
        ? form.interviewDate
        : null,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Unable to save interview.");
      }

      setMessage("Interview scheduled successfully!");

      setForm({
        companyName: "",
        jobTitle: "",
        interviewDate: "",
        interviewType: "Technical",
        interviewStatus: "SCHEDULED",
        preparationNotes: "",
        preparationCompleted: false,
      });

      await loadInterviews();
    } catch (err) {
      setError(err.message || "Unable to save interview.");
    }
  }

  async function updateInterview(interview, changes) {
    setError("");
    setMessage("");

    const payload = {
      ...interview,
      ...changes,
    };

    try {
      const response = await fetch(`${API_URL}/${interview.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to update interview.");
      }

      setMessage("Interview updated successfully!");
      await loadInterviews();
    } catch (err) {
      setError(err.message || "Unable to update interview.");
    }
  }

  async function deleteInterview(id) {
    if (!window.confirm("Are you sure you want to delete this interview?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete interview.");
      }

      setMessage("Interview deleted successfully!");
      await loadInterviews();
    } catch (err) {
      setError(err.message || "Unable to delete interview.");
    }
  }

  const now = new Date();

  const upcomingInterviews = interviews.filter((interview) => {
    if (!interview.interviewDate) return false;

    return (
      new Date(interview.interviewDate) >= now &&
      interview.interviewStatus === "SCHEDULED"
    );
  });

  const completedPreparation = interviews.filter(
    (interview) => interview.preparationCompleted,
  ).length;

  return (
    <div className="interview-page">
      <header className="interview-header">
        <div>
          <p className="interview-eyebrow">CAREER DEVELOPMENT</p>
          <h1>Interview Preparation</h1>
          <p className="interview-subtitle">
            Plan interviews, organize your preparation, and stay ready.
          </p>
        </div>

        <div className="interview-header-badge">🎯 Stay Interview Ready</div>
      </header>

      {error && <div className="interview-alert error-alert">{error}</div>}
      {message && <div className="interview-alert success-alert">{message}</div>}

      <section className="interview-stats">
        <article className="interview-stat-card">
          <span>Total Interviews</span>
          <strong>{interviews.length}</strong>
          <small>All your interview records</small>
        </article>

        <article className="interview-stat-card">
          <span>Upcoming Interviews</span>
          <strong>{upcomingInterviews.length}</strong>
          <small>Scheduled for the future</small>
        </article>

        <article className="interview-stat-card">
          <span>Preparation Completed</span>
          <strong>{completedPreparation}</strong>
          <small>Interviews marked ready</small>
        </article>
      </section>

      <div className="interview-layout">
        <section className="interview-panel">
          <div className="interview-section-heading">
            <div>
              <p className="interview-eyebrow">NEW ENTRY</p>
              <h2>Schedule an Interview</h2>
            </div>
          </div>

          <form className="interview-form" onSubmit={handleSubmit}>
            <label>
              Company Name *
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g. Infosys"
                required
              />
            </label>

            <label>
              Job Title *
              <input
                name="jobTitle"
                value={form.jobTitle}
                onChange={handleChange}
                placeholder="e.g. Full Stack Developer"
                required
              />
            </label>

            <label>
              Interview Date & Time
              <input
                type="datetime-local"
                name="interviewDate"
                value={form.interviewDate}
                onChange={handleChange}
              />
            </label>

            <label>
              Interview Type
              <select
                name="interviewType"
                value={form.interviewType}
                onChange={handleChange}
              >
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
                <option value="Coding">Coding Round</option>
                <option value="Managerial">Managerial</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </label>

            <label>
              Preparation Notes
              <textarea
                name="preparationNotes"
                value={form.preparationNotes}
                onChange={handleChange}
                placeholder="Topics to study, coding questions, company research..."
                rows="5"
              />
            </label>

            <label className="preparation-checkbox">
              <input
                type="checkbox"
                name="preparationCompleted"
                checked={form.preparationCompleted}
                onChange={handleChange}
              />
              I have completed my preparation
            </label>

            <button className="schedule-button" type="submit">
              + Schedule Interview
            </button>
          </form>
        </section>

        <section className="interview-panel">
          <div className="interview-section-heading">
            <div>
              <p className="interview-eyebrow">YOUR SCHEDULE</p>
              <h2>Interview Records</h2>
            </div>

            <button
              className="refresh-button"
              onClick={loadInterviews}
              type="button"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <p className="interview-empty">Loading interviews...</p>
          ) : interviews.length === 0 ? (
            <div className="interview-empty">
              <span>📅</span>
              <h3>No interviews yet</h3>
              <p>Schedule your first interview using the form.</p>
            </div>
          ) : (
            <div className="interview-records">
              {interviews.map((interview) => (
                <article className="interview-record" key={interview.id}>
                  <div className="record-top">
                    <div>
                      <h3>{interview.companyName}</h3>
                      <p>{interview.jobTitle}</p>
                    </div>
                  {(() => {
  const reminder = getInterviewReminder(
    interview.interviewDate,
    interview.interviewStatus
  );

  return reminder ? (
    <span className={`interview-reminder ${reminder.type}`}>
      {reminder.text}
    </span>
  ) : null;
})()}
                    <span
                      className={`interview-status ${interview.interviewStatus?.toLowerCase()}`}
                    >
                      {interview.interviewStatus}
                    </span>
                  </div>

                  <div className="record-meta">
                    <span>
                      📅{" "}
                      {interview.interviewDate
                        ? new Date(interview.interviewDate).toLocaleString()
                        : "Date not set"}
                    </span>
                    <span>💼 {interview.interviewType || "Not specified"}</span>
                  </div>

                  {interview.preparationNotes && (
                    <div className="record-notes">
                      <strong>Preparation Notes</strong>
                      <p>{interview.preparationNotes}</p>
                    </div>
                  )}

                  <label className="record-preparation">
                    <input
                      type="checkbox"
                      checked={Boolean(interview.preparationCompleted)}
                      onChange={(event) =>
                        updateInterview(interview, {
                          preparationCompleted: event.target.checked,
                        })
                      }
                    />
                    Preparation completed
                  </label>

                  <div className="record-actions">
                    <label className="status-selector">
                      <span>Status</span>
                      <select
                        value={interview.interviewStatus || "SCHEDULED"}
                        onChange={(event) =>
                          updateInterview(interview, {
                            interviewStatus: event.target.value,
                          })
                        }
                      >
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </label>

                    <button
                      className="delete-interview-button"
                      onClick={() => deleteInterview(interview.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="interview-footer">
        HireTrack · Prepare with purpose. Interview with confidence.
      </footer>
    </div>
  );
}


export default InterviewTracker;
