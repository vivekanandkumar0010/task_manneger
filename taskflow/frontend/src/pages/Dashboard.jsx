import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast, parseISO } from 'date-fns';
import './Dashboard.css';

const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>
);
const PriorityBadge = ({ priority }) => (
  <span className={`badge badge-${priority}`}>{priority}</span>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="dash-loading">
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const totalTasks = data?.projectStats?.reduce((s, p) => s + parseInt(p.total), 0) || 0;
  const doneTasks = data?.projectStats?.reduce((s, p) => s + parseInt(p.done), 0) || 0;

  return (
    <div className="dashboard page-enter">
      <div className="dash-header">
        <div>
          <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="dash-sub">Here's what's happening with your projects today.</p>
        </div>
        <Link to="/projects" className="btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Project
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Projects</div>
          <div className="stat-val">{data?.projectStats?.length || 0}</div>
          <div className="stat-icon">📁</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-val">{totalTasks}</div>
          <div className="stat-icon">✅</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-val">{doneTasks}</div>
          <div className="stat-sub">{totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0}% done</div>
          <div className="stat-icon">🎯</div>
        </div>
        <div className="stat-card stat-alert">
          <div className="stat-label">Overdue</div>
          <div className="stat-val">{data?.overdueCount || 0}</div>
          <div className="stat-icon">⚠️</div>
        </div>
      </div>

      <div className="dash-grid">
        <section className="dash-section">
          <h2>My Tasks</h2>
          {data?.myTasks?.length === 0 ? (
            <div className="empty-state">
              <span>🎉</span>
              <p>All caught up! No pending tasks.</p>
            </div>
          ) : (
            <div className="task-list">
              {data?.myTasks?.map(task => (
                <Link to={`/projects/${task.project_id}`} key={task.id} className="task-row">
                  <div className="task-row-main">
                    <span className="task-title">{task.title}</span>
                    <span className="task-project">{task.project_name}</span>
                  </div>
                  <div className="task-row-meta">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.due_date && (
                      <span className={`task-due ${isPast(parseISO(task.due_date)) ? 'overdue' : ''}`}>
                        {format(parseISO(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="dash-section">
          <h2>Project Progress</h2>
          {data?.projectStats?.length === 0 ? (
            <div className="empty-state">
              <span>📁</span>
              <p>No projects yet. <Link to="/projects">Create one!</Link></p>
            </div>
          ) : (
            <div className="project-progress-list">
              {data?.projectStats?.map(p => {
                const total = parseInt(p.total);
                const done = parseInt(p.done);
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Link to={`/projects/${p.id}`} key={p.id} className="progress-row">
                    <div className="progress-row-top">
                      <span className="progress-name">{p.name}</span>
                      <span className="progress-pct">{pct}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="progress-counts">
                      <span>{p.todo} todo</span>
                      <span>{p.in_progress} in progress</span>
                      <span>{p.done} done</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
