
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import InterviewTracker from "./InterviewTracker";
const API_URL = "http://localhost:8080/api/applications";
const INTERVIEW_API_URL = "http://localhost:8080/api/interviews";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [applications, setApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
const [interviewsLoading, setInterviewsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [form, setForm] = useState({
    companyName: "",
    jobTitle: "",
    jobLocation: "",
    jobType: "Full-time",
    applicationStatus: "APPLIED",
    appliedDate: new Date().toISOString().split("T")[0],
    jobDescription: "",
    jobUrl: "",
  });

  async function loadApplications() {
    try {
      setError("");
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load applications.");
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }
  async function loadUpcomingInterviews() {
  try {
    const response = await fetch(INTERVIEW_API_URL);

    if (!response.ok) {
      throw new Error("Unable to load interviews.");
    }

    const data = await response.json();
    const now = new Date();

    const upcoming = data
      .filter((interview) => {
        if (
          !interview.interviewDate ||
          interview.interviewStatus?.toUpperCase() !== "SCHEDULED"
        ) {
          return false;
        }

        const interviewDate = new Date(interview.interviewDate);

        return (
          !Number.isNaN(interviewDate.getTime()) &&
          interviewDate >= now
        );
      })
      .sort(
        (a, b) =>
          new Date(a.interviewDate) - new Date(b.interviewDate)
      )
      .slice(0, 5);

    setUpcomingInterviews(upcoming);
  } catch (err) {
    console.error("Could not load upcoming interviews:", err);
  } finally {
    setInterviewsLoading(false);
  }
}

  useEffect(() => {
  loadApplications();
  loadUpcomingInterviews();
}, []);
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        (app.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
        (app.jobTitle || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        app.applicationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const stats = {
    total: applications.length,
    interviews: applications.filter(
      (app) => app.applicationStatus === "INTERVIEW"
    ).length,
    offers: applications.filter(
      (app) => app.applicationStatus === "OFFER"
    ).length,
    rejected: applications.filter(
      (app) => app.applicationStatus === "REJECTED"
    ).length,
  };
  
const statusBreakdown = [
  { label: "Applied", value: applications.filter(a => a.applicationStatus === "APPLIED").length, color: "#60a5fa" },
  { label: "Interview", value: stats.interviews, color: "#a78bfa" },
  { label: "Offers", value: stats.offers, color: "#34d399" },
  { label: "Rejected", value: stats.rejected, color: "#fb7185" },
];

const monthlyApplications = (() => {
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);

    const year = date.getFullYear();
    const month = date.getMonth();

    const count = applications.filter(app => {
      if (!app.appliedDate) return false;

      const applied = new Date(app.appliedDate + "T00:00:00");

      return (
        applied.getFullYear() === year &&
        applied.getMonth() === month
      );
    }).length;

    months.push({
      label: date.toLocaleString("en-US", { month: "short" }),
      count,
    });
  }

  return months;
})();

const maxMonthlyApplications = Math.max(
  ...monthlyApplications.map(month => month.count),
  1
);


  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

 async function handleSubmit(event) {
  event.preventDefault();

  try {
    setActionMessage("");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      throw new Error("Could not save this application.");
    }

    setForm({
      companyName: "",
      jobTitle: "",
      jobLocation: "",
      jobType: "Full-time",
      applicationStatus: "APPLIED",
      appliedDate: new Date().toISOString().split("T")[0],
      jobDescription: "",
      jobUrl: "",
    });

    setShowForm(false);
    await loadApplications();

    setActionMessage("Application saved successfully!");
  } catch (err) {
    setActionMessage(err.message || "Could not save application.");
  }
}
 async function updateStatus(id, newStatus) {
  try {
    setActionMessage("");

    const response = await fetch(`${API_URL}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationStatus: newStatus }),
    });

    if (!response.ok) {
      throw new Error("Could not update application status.");
    }

    await loadApplications();

    setActionMessage("Application status updated successfully!");
  } catch (err) {
    setActionMessage(err.message || "Could not update application status.");
  }
}

  async function deleteApplication(id) {
  if (!window.confirm("Are you sure you want to delete this application?")) {
    return;
  }

  try {
    setActionMessage("");

    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Could not delete application.");
    }

    await loadApplications();
    setActionMessage("Application deleted successfully.");
  } catch (err) {
    setActionMessage(err.message || "Something went wrong.");
  }
}

if (activePage === "interviews") {
  return <InterviewTracker />;
}

return (
  <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">H</div>
          <span>HireTrack</span>
        </div>

<p className="sidebar-label">WORKSPACE</p>

<button
  type="button"
  className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
  onClick={() => setActivePage("dashboard")}
>
  <span>▦</span> Dashboard
</button>

<button
  type="button"
  className={`nav-link ${activePage === "dashboard" ? "" : ""}`}
  onClick={() => {
    setActivePage("dashboard");
    setTimeout(() => {
      document.getElementById("applications")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 0);
  }}
>
  <span>▤</span> Applications
</button>

<button
  type="button"
  className={`nav-link ${activePage === "interviews" ? "active" : ""}`}
  onClick={() => setActivePage("interviews")}
>
  <span>◷</span> Interview Prep
</button>

        <div className="sidebar-bottom">
          <div className="profile-avatar">K</div>
          <div>
            <strong>Komal Burange</strong>
            <small>Job Seeker</small>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
          {actionMessage && (
    <div className="action-message">
      {actionMessage}
      <button
        className="message-close"
        onClick={() => setActionMessage("")}
      >
        ×
      </button>
    </div>
  )}
        <header className="topbar">
          <div>
            <p className="eyebrow">CAREER WORKSPACE</p>
            <h1>Dashboard</h1>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowForm(!showForm)}
          >
            + Add Application
          </button>
        </header>

        <section className="welcome-section">
          <div>
            <p className="welcome-tag">YOUR CAREER JOURNEY</p>
            <h2>Welcome back, Komal! 👋</h2>
            <p>
              Keep track of your applications and move closer to your next
              opportunity.
            </p>
          </div>
          <div className="welcome-art">🚀</div>
              </section>

        {/* Upcoming Interviews */}
        <section className="upcoming-interviews-panel">
          <div className="upcoming-interviews-heading">
            <div>
              <p className="welcome-tag">STAY PREPARED</p>
              <h2>Upcoming Interviews 📅</h2>
              <p>Your next interview opportunities, all in one place.</p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => setActivePage("interviews")}
            >
              Manage Interviews →
            </button>
          </div>

          {interviewsLoading ? (
            <p className="upcoming-interviews-empty">
              Loading your upcoming interviews...
            </p>
          ) : upcomingInterviews.length === 0 ? (
            <div className="upcoming-interviews-empty">
              <span>🗓️</span>
              <h3>No upcoming interviews</h3>
              <p>Schedule an interview in Interview Prep to see it here.</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => setActivePage("interviews")}
              >
                Schedule an Interview
              </button>
            </div>
          ) : (
            <div className="upcoming-interviews-list">
              {upcomingInterviews.map((interview) => {
                const interviewDate = new Date(interview.interviewDate);
                const dateText = interviewDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const timeText = interviewDate.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <article
                    className="upcoming-interview-item"
                    key={interview.id}
                  >
                    <div className="upcoming-interview-icon">📅</div>

                    <div className="upcoming-interview-details">
                      <h3>{interview.companyName}</h3>
                      <p>{interview.jobTitle}</p>
                      <span>
                        {interview.interviewType || "Interview"}
                      </span>
                    </div>

                    <div className="upcoming-interview-date">
                      <strong>{dateText}</strong>
                      <span>{timeText}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon purple">▤</span>
            <p>Total Applications</p>
            <h2>{stats.total}</h2>
            <small>All tracked applications</small>
          </div>

          <div className="stat-card">
            <span className="stat-icon blue">◷</span>
            <p>Interviews</p>
            <h2>{stats.interviews}</h2>
            <small>Interview opportunities</small>
          </div>

          <div className="stat-card">
            <span className="stat-icon green">✓</span>
            <p>Offers</p>
            <h2>{stats.offers}</h2>
            <small>Offers received</small>
          </div>

          <div className="stat-card">
            <span className="stat-icon red">×</span>
            <p>Rejected</p>
            <h2>{stats.rejected}</h2>
            <small>Closed applications</small>
          </div>
        </section>
        
<section className="analytics-grid">
  <div className="analytics-card">
    <div className="analytics-heading">
      <div>
        <p className="eyebrow">APPLICATION INSIGHTS</p>
        <h2>Application Status</h2>
      </div>
      <span className="analytics-symbol">◉</span>
    </div>

    <div className="status-chart">
      {statusBreakdown.map((item) => {
        const percentage = stats.total
          ? Math.round((item.value / stats.total) * 100)
          : 0;

        return (
          <div className="status-chart-row" key={item.label}>
            <div className="chart-label">
              <span>
                <i style={{ background: item.color }} />
                {item.label}
              </span>
              <strong>{item.value} ({percentage}%)</strong>
            </div>

            <div className="chart-track">
              <div
                className="chart-fill"
                style={{
                  width: `${percentage}%`,
                  background: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>

  <div className="analytics-card">
    <div className="analytics-heading">
      <div>
        <p className="eyebrow">JOB SEARCH ACTIVITY</p>
        <h2>Monthly Applications</h2>
      </div>
      <span className="analytics-symbol">▥</span>
    </div>

    <div className="monthly-chart">
      {monthlyApplications.map((month) => (
        <div className="month-column" key={month.label}>
          <strong>{month.count}</strong>
          <div className="month-bar-area">
            <div
              className="month-bar"
              style={{
                height: `${Math.max(
                  (month.count / maxMonthlyApplications) * 100,
                  month.count > 0 ? 8 : 0
                )}%`,
              }}
            />
          </div>
          <span>{month.label}</span>
        </div>
      ))}
    </div>

    <p className="chart-note">
      Your applications over the last six months
    </p>
  </div>
</section>


        {showForm && (
          <section className="form-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">NEW OPPORTUNITY</p>
                <h2>Add Job Application</h2>
              </div>
              <button
                className="close-button"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="application-form">
              <label>
                Company Name *
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleInputChange}
                  placeholder="e.g. Google"
                  required
                />
              </label>

              <label>
                Job Title *
                <input
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={handleInputChange}
                  placeholder="e.g. Software Developer"
                  required
                />
              </label>

              <label>
                Job Location
                <input
                  name="jobLocation"
                  value={form.jobLocation}
                  onChange={handleInputChange}
                  placeholder="e.g. Pune"
                />
              </label>

              <label>
                Job Type
                <select
                  name="jobType"
                  value={form.jobType}
                  onChange={handleInputChange}
                >
                  <option>Full-time</option>
                  <option>Internship</option>
                  <option>Part-time</option>
                  <option>Remote</option>
                  <option>Contract</option>
                </select>
              </label>

              <label>
                Application Status
                <select
                  name="applicationStatus"
                  value={form.applicationStatus}
                  onChange={handleInputChange}
                >
                  <option value="APPLIED">Applied</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="OFFER">Offer</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>

              <label>
                Applied Date
                <input
                  type="date"
                  name="appliedDate"
                  value={form.appliedDate}
                  onChange={handleInputChange}
                />
              </label>

              <label className="full-width">
                Job URL
                <input
                  type="url"
                  name="jobUrl"
                  value={form.jobUrl}
                  onChange={handleInputChange}
                  placeholder="https://company.com/careers"
                />
              </label>

              <label className="full-width">
                Job Description
                <textarea
                  name="jobDescription"
                  value={form.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Add job details..."
                  rows="3"
                />
              </label>

              <div className="form-actions full-width">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Application
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="applications-section" id="applications">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR JOB SEARCH</p>
              <h2>Recent Applications</h2>
            </div>
            <span className="application-count">
              {filteredApplications.length} records
            </span>
          </div>

          <div className="filter-bar">
            <input
              type="search"
              placeholder="Search company or job title..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="status-filter">
  <label htmlFor="applicationStatusFilter">Filter by status</label>
  <select
    id="applicationStatusFilter"
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="ALL">All Statuses</option>
    <option value="APPLIED">Applied</option>
    <option value="INTERVIEW">Interview</option>
    <option value="OFFER">Offer</option>
    <option value="REJECTED">Rejected</option>
  </select>
</div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="empty-state">Loading applications...</div>
          ) : error ? (
            <div className="empty-state error-message">
              {error}
              <button className="secondary-button" onClick={loadApplications}>
                Try Again
              </button>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <h3>No applications found</h3>
              <p>Add your first job application to start tracking your career.</p>
              <button
                className="primary-button"
                onClick={() => setShowForm(true)}
              >
                + Add Your First Application
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>COMPANY & ROLE</th>
                    <th>LOCATION</th>
                    <th>APPLIED DATE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <strong>{app.companyName}</strong>
                        <small className="job-title">{app.jobTitle}</small>
                      </td>
                      <td>{app.jobLocation || "Not specified"}</td>
                      <td>{app.appliedDate || "—"}</td>
                      <td>
                        <select
                          className={`status-select ${(
                            app.applicationStatus || "APPLIED"
                          ).toLowerCase()}`}
                          value={app.applicationStatus || "APPLIED"}
                          onChange={(event) =>
                            updateStatus(app.id, event.target.value)
                          }
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="OFFER">Offer</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                      <td>
  <div className="action-buttons">
    <button
      className="view-button"
      onClick={() => setSelectedApplication(app)}
    >
      View
    </button>

    <button
      className="delete-button"
      onClick={() => deleteApplication(app.id)}
      title="Delete application"
    >
      Delete
    </button>
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        
{selectedApplication && (
  <div
    className="modal-overlay"
    onClick={() => setSelectedApplication(null)}
  >
    <div
      className="details-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="modal-heading">
        <div>
          <p className="eyebrow">APPLICATION DETAILS</p>
          <h2>{selectedApplication.companyName}</h2>
        </div>

        <button
          className="close-button"
          onClick={() => setSelectedApplication(null)}
        >
          ✕
        </button>
      </div>

      <div className="details-content">
        <div>
          <span>Job Title</span>
          <strong>{selectedApplication.jobTitle || "Not specified"}</strong>
        </div>

        <div>
          <span>Location</span>
          <strong>{selectedApplication.jobLocation || "Not specified"}</strong>
        </div>

        <div>
          <span>Job Type</span>
          <strong>{selectedApplication.jobType || "Not specified"}</strong>
        </div>

        <div>
          <span>Applied Date</span>
          <strong>{selectedApplication.appliedDate || "Not specified"}</strong>
        </div>

        <div>
          <span>Application Status</span>
          <strong>{selectedApplication.applicationStatus || "APPLIED"}</strong>
        </div>

        <div className="details-description">
          <span>Job Description</span>
          <p>
            {selectedApplication.jobDescription || "No description added."}
          </p>
        </div>
      </div>

      {selectedApplication.jobUrl && (
        <a
          className="job-link"
          href={selectedApplication.jobUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open Job Posting ↗
        </a>
      )}
    </div>
  </div>
)}


        <footer className="footer">
          <span>HireTrack © 2026</span>
          <span>Built to organize your career journey.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
