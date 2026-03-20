import React, { useState, useEffect, useRef } from 'react';
import Login from './Login';
import MindMap from './MindMap';

const API = 'http://localhost:8080/api/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newSubtaskPriority, setNewSubtaskPriority] = useState('normal');
  const [mindMapTask, setMindMapTask] = useState(null);
  const [taskNotes, setTaskNotes] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [editingSubtaskDate, setEditingSubtaskDate] = useState('');
  const [editingSubtaskPriority, setEditingSubtaskPriority] = useState('normal');
  const notifiedRef = useRef(new Set());

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    return token ? { token, email, name } : null;
  });

  const authHeaders = {
    'Authorization': `Bearer ${user?.token}`,
    'Content-Type': 'application/json'
  };

  const PRIORITY_COLORS = {
    critical: { bg: '#ff4757', light: '#fff0f1', label: '🔴 Critical' },
    high:     { bg: '#ff7f50', light: '#fff4f0', label: '🟠 High' },
    normal:   { bg: '#667eea', light: '#f0f0ff', label: '🔵 Normal' },
    low:      { bg: '#2ed573', light: '#f0fff4', label: '🟢 Low' },
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const sendNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '📋' });
    }
  };

  const checkDeadlines = (taskList) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date();
    taskList.forEach(task => {
      task.subtasks?.forEach(sub => {
        if (!sub.dueDate || sub.completed) return;
        const due = new Date(sub.dueDate);
        const diffHours = (due - now) / (1000 * 60 * 60);
        const key2d = `${sub.id}-2d`;
        const key1d = `${sub.id}-1d`;
        const keyOd = `${sub.id}-overdue`;
        if (diffHours > 47 && diffHours <= 49 && !notifiedRef.current.has(key2d)) {
          sendNotification('⏰ Due in 2 days',
            `"${sub.title}" in "${task.title}" is due in 2 days`);
          notifiedRef.current.add(key2d);
        } else if (diffHours > 23 && diffHours <= 25 && !notifiedRef.current.has(key1d)) {
          sendNotification('⚠️ Due tomorrow!',
            `"${sub.title}" in "${task.title}" is due tomorrow`);
          notifiedRef.current.add(key1d);
        } else if (diffHours < 0 && !notifiedRef.current.has(keyOd)) {
          sendNotification('🔴 Overdue!',
            `"${sub.title}" in "${task.title}" is overdue!`);
          notifiedRef.current.add(keyOd);
        }
      });
    });
  };

  const loadTasks = () => {
    if (!user) return;
    fetch(API, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.clear(); setUser(null); return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          const list = Array.isArray(data) ? data : [];
          setTasks(list);
          checkDeadlines(list);
        }
      })
      .catch(err => console.error('Load tasks error:', err));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    fetch(API, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ title: newTask, completed: false })
    }).then(() => { setNewTask(''); loadTasks(); });
  };

  const toggleTask = (id) => {
    fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${user.token}` }
    }).then(() => {
      fetch(API, { headers: { 'Authorization': `Bearer ${user.token}` } })
        .then(r => r.json())
        .then(data => {
          const list = Array.isArray(data) ? data : [];
          setTasks(list);
          const task = list.find(t => t.id === id);
          if (task && task.completed) {
            setTimeout(() => {
              fetch(`${API}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
              }).then(() => loadTasks());
            }, 2000);
          }
        });
    });
  };

  const deleteTask = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => Number(t.id) !== Number(id)));
      } else {
        console.error('Delete task failed:', res.status);
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  const updateTask = (id, title) => {
    if (!title.trim()) { setEditingTask(null); return; }
    fetch(`${API}/${id}`, {
      method: 'PATCH', headers: authHeaders,
      body: JSON.stringify({ title })
    }).then(() => { setEditingTask(null); loadTasks(); });
  };

  const addSubtask = (taskId) => {
    if (!newSubtask.trim()) return;
    fetch(`${API}/${taskId}/subtasks`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({
        title: newSubtask, completed: false,
        priority: newSubtaskPriority,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null
      })
    }).then(() => {
      setNewSubtask(''); setNewDueDate('');
      setNewSubtaskPriority('normal'); loadTasks();
    });
  };

  const toggleSubtask = (taskId, subtaskId) => {
    fetch(`${API}/${taskId}/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${user.token}` }
    }).then(() => loadTasks());
  };

  const saveSubtaskEdit = (taskId, subtaskId) => {
    if (!editingSubtaskText.trim()) { setEditingSubtask(null); return; }
    fetch(`${API}/${taskId}/subtasks/${subtaskId}`, {
      method: 'PATCH', headers: authHeaders,
      body: JSON.stringify({
        title: editingSubtaskText,
        priority: editingSubtaskPriority,
        dueDate: editingSubtaskDate ? editingSubtaskDate : ''
      })
    }).then(res => {
      if (res.ok) { setEditingSubtask(null); loadTasks(); }
      else console.error('Update subtask failed:', res.status);
    });
  };

  const deleteSubtask = async (taskId, subtaskId) => {
    try {
      const res = await fetch(`${API}/${taskId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      console.log('Delete subtask status:', res.status);
      if (res.ok) {
        setTasks(prev => prev.map(t => {
          if (Number(t.id) !== Number(taskId)) return t;
          return {
            ...t,
            subtasks: t.subtasks.filter(s => Number(s.id) !== Number(subtaskId))
          };
        }));
      } else {
        console.error('Delete subtask failed:', res.status);
      }
    } catch (err) {
      console.error('Delete subtask error:', err);
    }
  };

  const saveNotes = (taskId, notes) => {
    fetch(`${API}/${taskId}/notes`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify({ notes })
    }).then(() => loadTasks());
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const isOverdue = date < new Date();
    const formatted = date.toLocaleDateString('en-US',
      { day: 'numeric', month: 'short' });
    return { formatted, isOverdue };
  };

  useEffect(() => {
    requestNotificationPermission();
    loadTasks();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(() => {
      if (tasks.length > 0) checkDeadlines(tasks);
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <Login onLogin={(data) => setUser(data)} />;

  const theme = {
    app: {
      minHeight: '100vh',
      background: darkMode
        ? 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)'
        : 'linear-gradient(135deg, #667eea, #764ba2)',
      padding: '20px 16px',
      fontFamily: "'Segoe UI', sans-serif",
      transition: 'all 0.3s ease',
    },
    card: {
      maxWidth: '600px', margin: '0 auto',
      background: darkMode ? '#1e1e2e' : '#fff',
      borderRadius: '20px', padding: '24px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    header: {
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: '20px',
    },
    title: {
      fontSize: '24px', fontWeight: '700',
      color: darkMode ? '#e0e0ff' : '#2d2d2d', margin: 0,
    },
    headerRight: {
      display: 'flex', gap: '8px',
      alignItems: 'center', flexWrap: 'wrap',
    },
    userName: { fontSize: '13px', color: darkMode ? '#888' : '#aaa' },
    toggleBtn: {
      background: darkMode ? '#3d3d6b' : '#f0f0f0', border: 'none',
      borderRadius: '50px', padding: '6px 14px', cursor: 'pointer',
      fontSize: '14px', color: darkMode ? '#e0e0ff' : '#2d2d2d',
    },
    mindmapBtn: {
      background: darkMode ? '#2a3a2e' : '#e8f5e9', border: 'none',
      borderRadius: '50px', padding: '6px 14px', cursor: 'pointer',
      fontSize: '14px', color: darkMode ? '#4caf50' : '#2e7d32',
    },
    logoutBtn: {
      background: '#fff0f0', border: 'none', borderRadius: '50px',
      padding: '6px 14px', cursor: 'pointer',
      fontSize: '13px', color: '#ff4757', fontWeight: '600',
    },
    inputRow: {
      display: 'flex', gap: '8px',
      marginBottom: '20px', flexWrap: 'wrap',
    },
    input: {
      flex: 1, minWidth: '140px', padding: '10px 14px',
      borderRadius: '10px',
      border: darkMode ? '2px solid #3d3d6b' : '2px solid #e8e8e8',
      background: darkMode ? '#2a2a3e' : '#f8f8ff',
      color: darkMode ? '#e0e0ff' : '#2d2d2d',
      fontSize: '14px', outline: 'none',
    },
    addBtn: {
      padding: '10px 18px', borderRadius: '10px', border: 'none',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
    },
    taskItem: {
      marginBottom: '10px', borderRadius: '12px',
      background: darkMode ? '#2a2a3e' : '#f8f8ff',
      border: darkMode ? '1px solid #3d3d6b' : '1px solid #ebebeb',
      overflow: 'hidden', transition: 'opacity 0.5s ease',
    },
    taskRow: {
      display: 'flex', alignItems: 'center',
      gap: '8px', padding: '12px 14px', flexWrap: 'wrap',
    },
    taskText: (completed) => ({
      flex: 1, minWidth: '80px', fontSize: '15px', fontWeight: '500',
      color: completed
        ? (darkMode ? '#666688' : '#aaa')
        : (darkMode ? '#e0e0ff' : '#2d2d2d'),
      textDecoration: completed ? 'line-through' : 'none',
      cursor: 'pointer',
    }),
    expandBtn: {
      background: darkMode ? '#3d3d6b' : '#ede9ff', border: 'none',
      cursor: 'pointer', fontSize: '12px',
      color: darkMode ? '#667eea' : '#764ba2',
      padding: '4px 10px', borderRadius: '6px',
    },
    taskMindmapBtn: {
      background: darkMode ? '#2a3a2e' : '#e8f5e9', border: 'none',
      cursor: 'pointer', fontSize: '14px', padding: '4px 8px',
      borderRadius: '6px', color: darkMode ? '#4caf50' : '#2e7d32',
    },
    editBtn: {
      background: 'none', border: 'none',
      color: '#667eea', cursor: 'pointer', fontSize: '14px',
    },
    deleteBtn: {
      background: 'none', border: 'none',
      color: '#ff4757', cursor: 'pointer', fontSize: '16px',
    },
    subtaskSection: {
      padding: '0 14px 14px',
      borderTop: darkMode ? '1px solid #3d3d6b' : '1px solid #ebebeb',
    },
    subtaskInputRow: {
      display: 'flex', gap: '6px',
      marginTop: '10px', marginBottom: '8px', flexWrap: 'wrap',
    },
    subtaskInput: {
      flex: 1, minWidth: '100px', padding: '7px 10px',
      borderRadius: '8px',
      border: darkMode ? '1px solid #3d3d6b' : '1px solid #ddd',
      background: darkMode ? '#1e1e2e' : '#fff',
      color: darkMode ? '#e0e0ff' : '#2d2d2d',
      fontSize: '13px', outline: 'none',
    },
    subtaskItem: {
      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0',
      borderBottom: darkMode ? '1px solid #3d3d6b33' : '1px solid #f0f0f0',
    },
    subtaskText: (completed) => ({
      flex: 1, fontSize: '13px',
      color: completed
        ? (darkMode ? '#666688' : '#bbb')
        : (darkMode ? '#c0c0dd' : '#444'),
      textDecoration: completed ? 'line-through' : 'none',
    }),
    dueDateBadge: (isOverdue) => ({
      fontSize: '11px', padding: '2px 7px', borderRadius: '10px',
      background: isOverdue ? '#ff475720' : (darkMode ? '#3d3d6b' : '#ede9ff'),
      color: isOverdue ? '#ff4757' : (darkMode ? '#667eea' : '#764ba2'),
      fontWeight: '500', whiteSpace: 'nowrap',
    }),
    stats: {
      marginTop: '16px', textAlign: 'center',
      fontSize: '12px', color: darkMode ? '#666688' : '#bbb',
    },
    empty: {
      textAlign: 'center', color: darkMode ? '#666688' : '#bbb',
      padding: '30px 0', fontSize: '15px',
    },
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div style={theme.app}>
      <div style={theme.card}>

        {/* Header */}
        <div style={theme.header}>
          <h1 style={theme.title}>📝 Task Manager</h1>
          <div style={theme.headerRight}>
            <span style={theme.userName}>{user?.name}</span>
            <button style={theme.mindmapBtn}
              onClick={() => setMindMapTask({ id: null, title: null, subtasks: [] })}
              title="Standalone Mind Map">🧠</button>
            <button style={theme.toggleBtn}
              onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button style={theme.logoutBtn} onClick={() => {
              localStorage.clear(); setUser(null);
            }}>Logout</button>
          </div>
        </div>

        {/* Add Task */}
        <div style={theme.inputRow}>
          <input style={theme.input} value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Add a new task..." />
          <button style={theme.addBtn} onClick={addTask}>+ Add</button>
        </div>

        {/* Task List */}
        {tasks.length === 0
          ? <p style={theme.empty}>No tasks yet. Add one above!</p>
          : tasks.map(task => (
            <div key={task.id} style={{
              ...theme.taskItem,
              opacity: task.completed ? 0.5 : 1
            }}>

              {/* Task Row */}
              <div style={theme.taskRow}>
                <input type="checkbox" checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  style={{ accentColor: '#667eea', width: '16px', height: '16px' }} />

                {editingTask === task.id ? (
                  <input
                    style={{
                      ...theme.input, flex: 1,
                      padding: '4px 10px', fontSize: '14px'
                    }}
                    value={editingTaskText}
                    onChange={e => setEditingTaskText(e.target.value)}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') updateTask(task.id, editingTaskText);
                      if (e.key === 'Escape') setEditingTask(null);
                    }}
                    onBlur={() => updateTask(task.id, editingTaskText)}
                  />
                ) : (
                  <span style={theme.taskText(task.completed)}
                    onDoubleClick={() => {
                      setEditingTask(task.id);
                      setEditingTaskText(task.title);
                    }}
                    title="Double-click to edit">
                    {task.title}
                  </span>
                )}

                <button style={theme.taskMindmapBtn}
                  onClick={() => setMindMapTask(task)}
                  title="Mind Map">🧠</button>
                <button style={theme.expandBtn}
                  onClick={() => setExpandedTask(
                    expandedTask === task.id ? null : task.id
                  )}>
                  {expandedTask === task.id ? '▲ hide' : '▼ subtasks'}
                </button>
                <button style={theme.editBtn}
                  title="Edit task"
                  onClick={() => {
                    setEditingTask(task.id);
                    setEditingTaskText(task.title);
                  }}>✏️</button>
                <button style={theme.deleteBtn}
                  title="Delete task"
                  onClick={() => deleteTask(task.id)}>✕</button>
              </div>

              {/* Subtasks */}
              {expandedTask === task.id && (
                <div style={theme.subtaskSection}>

                  {task.subtasks && task.subtasks.map(sub => {
                    const dateInfo = formatDate(sub.dueDate);
                    const pc = PRIORITY_COLORS[sub.priority || 'normal'];
                    const isEditingThis = editingSubtask === sub.id;

                    return (
                      <div key={sub.id}>
                        <div style={theme.subtaskItem}>
                          <input type="checkbox" checked={sub.completed}
                            onChange={() => toggleSubtask(task.id, sub.id)}
                            style={{
                              accentColor: '#764ba2',
                              width: '14px', height: '14px'
                            }} />
                          <div style={{
                            width: '8px', height: '8px',
                            borderRadius: '50%', background: pc.bg,
                            flexShrink: 0,
                          }} title={pc.label} />
                          <span style={theme.subtaskText(sub.completed)}>
                            {sub.title}
                          </span>
                          {dateInfo && (
                            <span style={theme.dueDateBadge(dateInfo.isOverdue)}>
                              {dateInfo.isOverdue ? '⚠ ' : '📅 '}{dateInfo.formatted}
                            </span>
                          )}
                          <button style={{ ...theme.editBtn, fontSize: '12px' }}
                            title={isEditingThis ? 'Close' : 'Edit subtask'}
                            onClick={() => {
                              if (isEditingThis) {
                                setEditingSubtask(null);
                              } else {
                                setEditingSubtask(sub.id);
                                setEditingSubtaskText(sub.title);
                                setEditingSubtaskDate(sub.dueDate
                                  ? new Date(sub.dueDate)
                                    .toISOString().split('T')[0]
                                  : '');
                                setEditingSubtaskPriority(sub.priority || 'normal');
                              }
                            }}>
                            {isEditingThis ? '✕' : '✏️'}
                          </button>
                          <button
                            style={{ ...theme.deleteBtn, fontSize: '13px' }}
                            title="Delete subtask"
                            onClick={() => deleteSubtask(task.id, sub.id)}>
                            🗑
                          </button>
                        </div>

                        {/* Inline edit panel */}
                        {isEditingThis && (
                          <div style={{
                            background: darkMode ? '#2a2a3e' : '#f0eeff',
                            border: darkMode
                              ? '1px solid #3d3d6b'
                              : '1px solid #d0c8ff',
                            borderRadius: '10px', padding: '10px',
                            marginBottom: '6px',
                          }}>
                            <input
                              style={{
                                ...theme.subtaskInput,
                                width: '100%', marginBottom: '6px',
                                boxSizing: 'border-box'
                              }}
                              value={editingSubtaskText}
                              onChange={e => setEditingSubtaskText(e.target.value)}
                              placeholder="Subtask title..."
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter')
                                  saveSubtaskEdit(task.id, sub.id);
                                if (e.key === 'Escape')
                                  setEditingSubtask(null);
                              }}
                            />
                            <input
                              style={{
                                ...theme.subtaskInput,
                                width: '100%', marginBottom: '6px',
                                boxSizing: 'border-box'
                              }}
                              type="date"
                              value={editingSubtaskDate}
                              onChange={e => setEditingSubtaskDate(e.target.value)}
                            />
                            <div style={{
                              display: 'flex', gap: '4px',
                              marginBottom: '8px', flexWrap: 'wrap'
                            }}>
                              {Object.entries(PRIORITY_COLORS).map(([key, val]) => (
                                <button key={key}
                                  onClick={() => setEditingSubtaskPriority(key)}
                                  style={{
                                    background: editingSubtaskPriority === key
                                      ? val.bg : 'transparent',
                                    border: `1.5px solid ${val.bg}`,
                                    borderRadius: '8px', padding: '3px 10px',
                                    color: editingSubtaskPriority === key
                                      ? '#fff' : val.bg,
                                    fontSize: '11px', cursor: 'pointer',
                                    fontWeight: '600',
                                  }}>{val.label}</button>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button style={{
                                ...theme.addBtn, flex: 1,
                                padding: '6px', fontSize: '12px'
                              }}
                                onClick={() => saveSubtaskEdit(task.id, sub.id)}>
                                ✓ Save
                              </button>
                              <button style={{
                                padding: '6px 12px', borderRadius: '8px',
                                border: 'none',
                                background: darkMode ? '#3d3d6b' : '#f0f0f0',
                                color: darkMode ? '#e0e0ff' : '#666',
                                cursor: 'pointer', fontSize: '12px'
                              }}
                                onClick={() => setEditingSubtask(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add subtask inputs */}
                  <div style={theme.subtaskInputRow}>
                    <input style={theme.subtaskInput} value={newSubtask}
                      onChange={e => setNewSubtask(e.target.value)}
                      placeholder="Add subtask..."
                      onKeyDown={e => e.key === 'Enter' && addSubtask(task.id)} />
                    <input style={{ ...theme.subtaskInput, minWidth: '80px' }}
                      type="date" value={newDueDate}
                      onChange={e => setNewDueDate(e.target.value)} />
                  </div>

                  {/* Priority selector */}
                  <div style={{
                    display: 'flex', gap: '6px',
                    marginBottom: '10px', flexWrap: 'wrap'
                  }}>
                    {Object.entries(PRIORITY_COLORS).map(([key, val]) => (
                      <button key={key}
                        onClick={() => setNewSubtaskPriority(key)}
                        style={{
                          background: newSubtaskPriority === key
                            ? val.bg : 'transparent',
                          border: `1.5px solid ${val.bg}`,
                          borderRadius: '8px', padding: '3px 10px',
                          color: newSubtaskPriority === key ? '#fff' : val.bg,
                          fontSize: '11px', cursor: 'pointer', fontWeight: '600',
                        }}>{val.label}</button>
                    ))}
                  </div>

                  <button style={{
                    ...theme.addBtn,
                    padding: '7px 12px', fontSize: '13px', width: '100%'
                  }}
                    onClick={() => addSubtask(task.id)}>
                    + Add Subtask
                  </button>

                  {/* Notes */}
                  <div style={{
                    marginTop: '12px',
                    borderTop: darkMode ? '1px solid #3d3d6b' : '1px solid #eee',
                    paddingTop: '10px'
                  }}>
                    <div style={{
                      fontSize: '12px', fontWeight: '700', marginBottom: '6px',
                      color: darkMode ? '#667eea' : '#764ba2'
                    }}>
                      📝 Notes & Key Points
                    </div>
                    <textarea
                      value={taskNotes[task.id] !== undefined
                        ? taskNotes[task.id]
                        : (task.notes || '')}
                      onChange={e => setTaskNotes(prev => ({
                        ...prev, [task.id]: e.target.value
                      }))}
                      onBlur={() => {
                        if (taskNotes[task.id] !== undefined) {
                          saveNotes(task.id, taskNotes[task.id]);
                        }
                      }}
                      placeholder="Add important notes, key points, lesson plan details..."
                      style={{
                        width: '100%', padding: '8px 10px',
                        borderRadius: '8px',
                        border: darkMode ? '1px solid #3d3d6b' : '1px solid #ddd',
                        background: darkMode ? '#1e1e2e' : '#fff',
                        color: darkMode ? '#e0e0ff' : '#2d2d2d',
                        fontSize: '13px', outline: 'none',
                        resize: 'vertical', minHeight: '70px',
                        fontFamily: 'inherit', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                </div>
              )}
            </div>
          ))
        }

        {tasks.length > 0 &&
          <p style={theme.stats}>
            {completedCount} of {tasks.length} tasks completed
          </p>
        }
      </div>

      {/* MindMap Modal */}
      {mindMapTask && (
        <MindMap
          taskId={mindMapTask.id}
          taskTitle={mindMapTask.title}
          task={mindMapTask}
          onClose={() => setMindMapTask(null)}
          darkMode={darkMode}
          token={user.token}
        />
      )}
    </div>
  );
}

export default App;