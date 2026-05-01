import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';
import './ProjectDetail.css';

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState('tasks');
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title:'', description:'', assigned_to:'', status:'todo', priority:'medium', due_date:'' });

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberError, setMemberError] = useState('');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = project?.my_role === 'admin';

  const load = useCallback(async () => {
    try {
      const [proj, taskList, memberList] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
        api.get(`/projects/${id}/members`)
      ]);
      setProject(proj.data);
      setTasks(taskList.data);
      setMembers(memberList.data);
    } catch {
      navigate('/projects');
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const openTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title, description: task.description || '',
        assigned_to: task.assigned_to || '', status: task.status,
        priority: task.priority, due_date: task.due_date ? task.due_date.split('T')[0] : ''
      });
    } else {
      setEditingTask(null);
      setTaskForm({ title:'', description:'', assigned_to:'', status:'todo', priority:'medium', due_date:'' });
    }
    setShowTaskModal(true);
  };

  const submitTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...taskForm, assigned_to: taskForm.assigned_to || null, due_date: taskForm.due_date || null };
      if (editingTask) {
        await api.put(`/projects/${id}/tasks/${editingTask.id}`, payload);
      } else {
        await api.post(`/projects/${id}/tasks`, payload);
      }
      setShowTaskModal(false);
      load();
    } catch { } finally { setSubmitting(false); }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/projects/${id}/tasks/${taskId}`);
    load();
  };

  const quickStatus = async (task, status) => {
    await api.put(`/projects/${id}/tasks/${task.id}`, { status });
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status } : t));
  };

  const addMember = async (e) => {
    e.preventDefault();
    setMemberError(''); setSubmitting(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setShowMemberModal(false); setMemberEmail(''); setMemberRole('member');
      load();
    } catch (err) {
      setMemberError(err.response?.data?.error || 'Failed to add member');
    } finally { setSubmitting(false); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    load();
  };

  const deleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const grouped = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner" style={{ width:32, height:32 }} /></div>;

  return (
    <div className="project-detail page-enter">
      <div className="pd-header">
        <div className="pd-header-left">
          <button className="btn-back" onClick={() => navigate('/projects')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <div className="pd-title-row">
              <h1>{project?.name}</h1>
              <span className={`badge badge-${project?.my_role}`}>{project?.my_role}</span>
            </div>
            {project?.description && <p className="pd-desc">{project.description}</p>}
          </div>
        </div>
        <div className="pd-actions">
          {isAdmin && (
            <button className="btn-danger" onClick={deleteProject}>Delete Project</button>
          )}
          <button className="btn-primary" onClick={() => openTaskModal()}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Add Task
          </button>
        </div>
      </div>

      <div className="pd-tabs">
        <button className={`pd-tab ${tab==='tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
          Tasks <span className="tab-count">{tasks.length}</span>
        </button>
        <button className={`pd-tab ${tab==='members' ? 'active' : ''}`} onClick={() => setTab('members')}>
          Members <span className="tab-count">{members.length}</span>
        </button>
      </div>

      {tab === 'tasks' && (
        <div className="tasks-tab">
          <div className="task-filters">
            <select className="input filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
            <select className="input filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {(filterStatus || filterPriority) && (
              <button className="btn-ghost" style={{ padding:'8px 14px', fontSize:13 }} onClick={() => { setFilterStatus(''); setFilterPriority(''); }}>Clear</button>
            )}
          </div>

          <div className="kanban">
            {STATUSES.map(status => (
              <div key={status} className="kanban-col">
                <div className="kanban-col-header">
                  <span className={`badge badge-${status}`}>{status.replace('_',' ')}</span>
                  <span className="kanban-count">{grouped[status].length}</span>
                </div>
                <div className="kanban-tasks">
                  {grouped[status].length === 0 && (
                    <div className="kanban-empty">No tasks here</div>
                  )}
                  {grouped[status].map(task => (
                    <div key={task.id} className="task-card">
                      <div className="task-card-top">
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        <div className="task-card-actions">
                          <button className="icon-btn" onClick={() => openTaskModal(task)} title="Edit">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {isAdmin && (
                            <button className="icon-btn danger" onClick={() => deleteTask(task.id)} title="Delete">
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="task-card-title">{task.title}</h4>
                      {task.description && <p className="task-card-desc">{task.description}</p>}

                      <div className="task-card-meta">
                        {task.assigned_name && (
                          <span className="task-assignee">
                            <span className="mini-avatar">{task.assigned_name[0]}</span>
                            {task.assigned_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="task-due-sm">{format(parseISO(task.due_date), 'MMM d')}</span>
                        )}
                      </div>

                      <div className="task-status-btns">
                        {STATUSES.filter(s => s !== status).map(s => (
                          <button key={s} className="status-pill" onClick={() => quickStatus(task, s)}>
                            → {s.replace('_',' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="members-tab">
          {isAdmin && (
            <div style={{ marginBottom: 20 }}>
              <button className="btn-primary" onClick={() => setShowMemberModal(true)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                Add Member
              </button>
            </div>
          )}
          <div className="members-list">
            {members.map(m => (
              <div key={m.id} className="member-row">
                <div className="member-avatar">{m.name[0].toUpperCase()}</div>
                <div className="member-info">
                  <span className="member-name">{m.name}</span>
                  <span className="member-email">{m.email}</span>
                </div>
                <span className={`badge badge-${m.role}`}>{m.role}</span>
                {isAdmin && m.id !== user?.id && (
                  <button className="btn-danger" style={{ padding:'6px 12px', fontSize:12 }} onClick={() => removeMember(m.id)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={submitTask}>
              <div className="form-grid">
                <div className="field full">
                  <label>Title *</label>
                  <input className="input" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="Task title" required />
                </div>
                <div className="field full">
                  <label>Description</label>
                  <textarea className="input" rows={2} value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="Optional details..." style={{ resize:'vertical' }} />
                </div>
                <div className="field">
                  <label>Assign To</label>
                  <select className="input" value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Due Date</label>
                  <input className="input" type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select className="input" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Priority</label>
                  <select className="input" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop: 20 }}>
                <button type="button" className="btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Member</h2>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            <form onSubmit={addMember}>
              {memberError && <div className="auth-error" style={{ marginBottom:14 }}>{memberError}</div>}
              <div className="field" style={{ marginBottom:14 }}>
                <label>Email Address</label>
                <input className="input" type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="member@example.com" required />
              </div>
              <div className="field" style={{ marginBottom:20 }}>
                <label>Role</label>
                <select className="input" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
