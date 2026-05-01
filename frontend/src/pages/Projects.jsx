import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Projects.css';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      load();
    } catch { } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner" style={{ width:32, height:32 }} /></div>;

  return (
    <div className="projects-page page-enter">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="projects-empty">
          <span>🚀</span>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <Link to={`/projects/${p.id}`} key={p.id} className="project-card">
              <div className="project-card-top">
                <div className="project-icon">{p.name[0].toUpperCase()}</div>
                <span className={`badge badge-${p.my_role}`}>{p.my_role}</span>
              </div>
              <h3>{p.name}</h3>
              {p.description && <p className="project-desc">{p.description}</p>}
              <div className="project-meta">
                <span>👥 {p.member_count}</span>
                <span>✅ {p.task_count} tasks</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Project Name *</label>
                <input className="input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="My awesome project" required />
              </div>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>Description</label>
                <textarea className="input" rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What's this project about?" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
