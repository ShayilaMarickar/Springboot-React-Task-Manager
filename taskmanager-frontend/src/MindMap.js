import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  MiniMap, Controls, Background,
  addEdge, useNodesState, useEdgesState,
  Handle, Position, getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';

const API = 'http://localhost:8080/api/mindmaps';

const PRIORITY_COLORS = {
  critical: { bg: '#ff4757', light: '#fff0f1', border: '#ff4757', label: '🔴 Critical' },
  high:     { bg: '#ff7f50', light: '#fff4f0', border: '#ff7f50', label: '🟠 High' },
  normal:   { bg: '#667eea', light: '#f0f0ff', border: '#667eea', label: '🔵 Normal' },
  low:      { bg: '#2ed573', light: '#f0fff4', border: '#2ed573', label: '🟢 Low' },
  idea:     { bg: '#764ba2', light: '#f8f0ff', border: '#764ba2', label: '🟣 Idea' },
};

const CANVAS_LABELS = [
  { key: 'none',     color: '#667eea', name: 'Default' },
  { key: 'work',     color: '#ff7f50', name: 'Work' },
  { key: 'personal', color: '#2ed573', name: 'Personal' },
  { key: 'study',    color: '#764ba2', name: 'Study' },
  { key: 'project',  color: '#ff4757', name: 'Project' },
  { key: 'idea',     color: '#00d2d3', name: 'Idea' },
];

const EDGE_COLORS = ['#667eea','#ff4757','#2ed573','#ff7f50','#764ba2','#00d2d3','#ff9ff3'];

function CustomNode({ data }) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(data.label);
  const color = PRIORITY_COLORS[data.priority || 'normal'];
  const isCompleted = data.completed;

  const handleEditSave = () => {
    if (editText.trim()) data.onLabel(data.id, editText);
    setEditing(false);
  };

  return (
    <div style={{
      background: isCompleted ? '#f0fff4' : (data.isRoot ? color.bg : color.light),
      color: data.isRoot && !isCompleted ? '#fff' : '#2d2d2d',
      border: isCompleted ? '2px solid #2ed573' : `2px solid ${color.border}`,
      borderRadius: data.isRoot ? '50px' : '12px',
      padding: data.isRoot ? '12px 24px' : '8px 16px',
      fontWeight: data.isRoot ? '700' : '500',
      fontSize: data.isRoot ? '15px' : '13px',
      minWidth: '100px', maxWidth: '200px',
      textAlign: 'center',
      boxShadow: isCompleted ? '0 4px 15px #2ed57340' : `0 4px 15px ${color.bg}40`,
      cursor: 'pointer', position: 'relative',
      opacity: isCompleted ? 0.8 : 1,
    }}
      onDoubleClick={() => { if (!editing) { setEditing(true); setShowMenu(false); } }}>

      <Handle type="target" position={Position.Left}
        style={{ width: '10px', height: '10px', background: color.bg, border: '2px solid #fff', opacity: 0.7 }} />
      <Handle type="target" position={Position.Top} id="top"
        style={{ width: '10px', height: '10px', background: color.bg, border: '2px solid #fff', opacity: 0.7 }} />
      <Handle type="source" position={Position.Right}
        style={{ width: '10px', height: '10px', background: color.bg, border: '2px solid #fff', opacity: 0.7 }} />
      <Handle type="source" position={Position.Bottom} id="bottom"
        style={{ width: '10px', height: '10px', background: color.bg, border: '2px solid #fff', opacity: 0.7 }} />

      {editing ? (
        <textarea autoFocus value={editText}
          onChange={e => setEditText(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
            if (e.key === 'Escape') { setEditText(data.label); setEditing(false); }
          }}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: data.isRoot ? '#fff' : '#2d2d2d',
            fontSize: data.isRoot ? '15px' : '13px',
            fontWeight: data.isRoot ? '700' : '500',
            textAlign: 'center', width: '100%',
            resize: 'none', fontFamily: 'inherit', minHeight: '40px',
          }}
          rows={Math.max(2, editText.split('\n').length)} />
      ) : (
        <div style={{
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          textDecoration: isCompleted ? 'line-through' : 'none',
          color: isCompleted ? '#888' : 'inherit',
        }}>{data.label}</div>
      )}

      {!data.isRoot && !editing && (
        <div style={{ fontSize: '9px', marginTop: '3px',
          color: isCompleted ? '#2ed573' : color.bg,
          fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {isCompleted ? '✓ done' : (data.priority || 'normal')}
        </div>
      )}

      {!editing && (
        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginTop: '6px' }}>
          {data.subtaskId && (
            <button style={{
              background: isCompleted ? '#2ed57330' : 'rgba(255,255,255,0.25)',
              border: `1px solid ${isCompleted ? '#2ed573' : 'transparent'}`,
              borderRadius: '4px', color: isCompleted ? '#2ed573' : '#888',
              cursor: 'pointer', fontSize: '10px', padding: '2px 6px',
            }} onClick={e => { e.stopPropagation(); data.onToggle(data.id); }}>
              {isCompleted ? '✓ done' : '○ tick'}
            </button>
          )}
          <button style={{ background: 'rgba(255,255,255,0.25)', border: 'none',
            borderRadius: '4px', color: data.isRoot ? '#fff' : '#667eea',
            cursor: 'pointer', fontSize: '10px', padding: '2px 6px' }}
            onClick={e => { e.stopPropagation(); data.onAdd(data.id); }}>+ child</button>
          <button style={{ background: 'rgba(255,255,255,0.25)', border: 'none',
            borderRadius: '4px', color: data.isRoot ? '#fff' : '#888',
            cursor: 'pointer', fontSize: '10px', padding: '2px 6px' }}
            onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}>⚙</button>
        </div>
      )}

      {showMenu && !editing && (
        <div style={{
          position: 'absolute', top: '100%', left: '50%',
          transform: 'translateX(-50%)',
          background: '#fff', border: '1px solid #ddd',
          borderRadius: '10px', padding: '10px', zIndex: 1000,
          marginTop: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: '180px',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px', fontWeight: '700' }}>PRIORITY</div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {Object.entries(PRIORITY_COLORS).map(([key, val]) => (
              <button key={key} onClick={() => { data.onPriority(data.id, key); setShowMenu(false); }}
                style={{ background: val.bg, border: 'none', borderRadius: '4px',
                  padding: '3px 7px', color: '#fff', fontSize: '10px',
                  cursor: 'pointer', fontWeight: '600' }}>{val.label.split(' ')[0]}</button>
            ))}
          </div>
          {!data.isRoot && (
            <button onClick={() => { data.onDelete(data.id); setShowMenu(false); }}
              style={{ width: '100%', padding: '6px', background: '#ff475715',
                color: '#ff4757', border: '1px solid #ff475740', borderRadius: '6px',
                cursor: 'pointer', fontSize: '12px', marginBottom: '4px' }}>🗑 Delete node</button>
          )}
          <button onClick={() => setShowMenu(false)}
            style={{ width: '100%', padding: '4px', background: 'none',
              border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '11px' }}>✕ Close</button>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

function ColoredEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd }) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return <path id={id} style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} fill="none" />;
}

const edgeTypes = { colored: ColoredEdge };

function calcChildPosition(parentX, parentY, siblingCount, total) {
  const radius = 200;
  const angleStep = total > 1 ? (2 * Math.PI) / total : 0;
  const angle = -Math.PI / 2 + siblingCount * angleStep;
  return {
    x: parentX + radius * Math.cos(angle),
    y: parentY + radius * Math.sin(angle),
  };
}

function TreeNode({ node, onAddChild, onDelete, onPriority, onToggle, darkMode }) {
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [priority, setPriority] = useState('normal');
  const color = PRIORITY_COLORS[node.priority || 'normal'];

  const s = {
    container: { marginLeft: '16px', marginTop: '6px' },
    row: {
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '7px 10px', borderRadius: '10px',
      background: node.completed ? '#f0fff4' : (node.root ? color.bg : color.light),
      border: node.completed ? '1.5px solid #2ed573' : `1.5px solid ${color.border}`,
      marginBottom: '4px',
    },
    label: {
      flex: 1, fontSize: '14px',
      color: node.root && !node.completed ? '#fff' : '#2d2d2d',
      fontWeight: node.root ? '700' : '500', whiteSpace: 'pre-wrap',
      textDecoration: node.completed ? 'line-through' : 'none',
    },
    btn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 5px' },
    inputArea: {
      marginLeft: '16px', marginTop: '6px', marginBottom: '6px',
      padding: '10px', borderRadius: '10px',
      background: darkMode ? '#2a2a3e' : '#f8f8ff',
      border: darkMode ? '1px solid #3d3d6b' : '1px solid #eee',
    },
    input: {
      width: '100%', padding: '7px 10px', borderRadius: '8px',
      border: darkMode ? '1px solid #3d3d6b' : '1px solid #ddd',
      background: darkMode ? '#1e1e2e' : '#fff',
      color: darkMode ? '#e0e0ff' : '#2d2d2d',
      fontSize: '13px', outline: 'none', marginBottom: '6px',
      boxSizing: 'border-box', resize: 'vertical', minHeight: '50px', fontFamily: 'inherit',
    },
    priorityRow: { display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' },
    actionRow: { display: 'flex', gap: '6px' },
    addBtn: { flex: 1, padding: '6px', borderRadius: '8px', border: 'none',
      background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
      fontSize: '12px', cursor: 'pointer' },
    cancelBtn: { padding: '6px 10px', borderRadius: '8px', border: 'none',
      background: darkMode ? '#3d3d6b' : '#f0f0f0',
      color: darkMode ? '#e0e0ff' : '#666', fontSize: '12px', cursor: 'pointer' }
  };

  return (
    <div style={s.container}>
      <div style={s.row}>
        {node.children?.length > 0 && (
          <button style={s.btn} onClick={() => setExpanded(!expanded)}>{expanded ? '▼' : '▶'}</button>
        )}
        {node.subtaskId && (
          <input type="checkbox" checked={node.completed || false}
            onChange={() => onToggle(node.id)}
            style={{ accentColor: '#2ed573', width: '14px', height: '14px' }} />
        )}
        <span style={s.label}>{node.label}</span>
        <button style={{ ...s.btn, color: '#667eea', fontSize: '18px' }}
          onClick={() => setAdding(!adding)}>+</button>
        {!node.root && (
          <button style={{ ...s.btn, color: '#ff4757' }}
            onClick={() => onDelete(node.id)}>✕</button>
        )}
      </div>
      {adding && (
        <div style={s.inputArea}>
          <textarea style={s.input} value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Node label... (Shift+Enter for new line)" autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && newLabel.trim()) {
                e.preventDefault();
                onAddChild(node.id, newLabel, priority);
                setNewLabel(''); setAdding(false); setPriority('normal');
              }
            }} />
          <div style={s.priorityRow}>
            {Object.entries(PRIORITY_COLORS).map(([key, val]) => (
              <button key={key} onClick={() => setPriority(key)}
                style={{ background: priority === key ? val.bg : val.light,
                  border: `1px solid ${val.border}`, borderRadius: '6px',
                  padding: '3px 8px', color: priority === key ? '#fff' : val.bg,
                  fontSize: '11px', cursor: 'pointer' }}>{val.label}</button>
            ))}
          </div>
          <div style={s.actionRow}>
            <button style={s.addBtn} onClick={() => {
              if (newLabel.trim()) {
                onAddChild(node.id, newLabel, priority);
                setNewLabel(''); setAdding(false); setPriority('normal');
              }
            }}>Add node</button>
            <button style={s.cancelBtn}
              onClick={() => { setAdding(false); setNewLabel(''); }}>Cancel</button>
          </div>
        </div>
      )}
      {expanded && node.children?.map(child => (
        <TreeNode key={child.id} node={child} onAddChild={onAddChild}
          onDelete={onDelete} onPriority={onPriority}
          onToggle={onToggle} darkMode={darkMode} />
      ))}
    </div>
  );
}

function CanvasList({ taskId, taskTitle, task, onSelectCanvas, onClose, darkMode, token }) {
  const [canvases, setCanvases] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLabel, setNewLabel] = useState('none');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const loadCanvases = () => {
    const url = taskId
      ? `${API}/canvases/task/${taskId}`
      : `${API}/canvases/standalone`;
    fetch(url, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCanvases(Array.isArray(data) ? data : []))
      .catch(() => setCanvases([]));
  };

  useEffect(() => { loadCanvases(); }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  const createCanvas = () => {
    if (!newTitle.trim()) return;
    const labelObj = CANVAS_LABELS.find(l => l.key === newLabel);
    const url = taskId ? `${API}/canvases/task/${taskId}` : `${API}/canvases`;
    fetch(url, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({
        title: newTitle, label: newLabel,
        labelColor: labelObj?.color || '#667eea'
      })
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setNewTitle(''); setCreating(false); loadCanvases(); }
        else setError('Failed to create canvas');
      })
      .catch(() => setError('Failed to create canvas'));
  };

  const deleteCanvas = (id) => {
    fetch(`${API}/canvases/${id}`, {
      method: 'DELETE', headers: getHeaders()
    })
      .then(() => loadCanvases())
      .catch(() => loadCanvases());
  };

  const generateFromTask = async () => {
    if (!task || !task.subtasks || task.subtasks.length === 0) return;
    setGenerating(true);
    setError('');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const labelObj = CANVAS_LABELS.find(l => l.key === 'project');

      const canvasRes = await fetch(
        taskId ? `${API}/canvases/task/${taskId}` : `${API}/canvases`,
        {
          method: 'POST', headers,
          body: JSON.stringify({
            title: `${task.title} — Auto Map`,
            label: 'project',
            labelColor: labelObj.color
          })
        }
      );
      if (!canvasRes.ok) throw new Error(`Canvas failed: ${canvasRes.status}`);
      const canvas = await canvasRes.json();

      const rootRes = await fetch(`${API}/canvas/${canvas.id}/root`, {
        method: 'POST', headers,
        body: JSON.stringify({ label: task.title, priority: 'normal' })
      });
      if (!rootRes.ok) throw new Error(`Root node failed: ${rootRes.status}`);
      const rootNode = await rootRes.json();

      const total = task.subtasks.length;
      for (let i = 0; i < total; i++) {
        const sub = task.subtasks[i];
        const pos = calcChildPosition(300, 200, i, total);
        // Use subtask priority if available, otherwise infer from due date
        const priority = sub.priority && sub.priority !== 'normal'
          ? sub.priority
          : sub.completed ? 'low'
          : (sub.dueDate && new Date(sub.dueDate) < new Date() ? 'critical' : 'normal');
        const childRes = await fetch(`${API}/${rootNode.id}/child`, {
          method: 'POST', headers,
          body: JSON.stringify({
            label: sub.title, priority,
            x: pos.x, y: pos.y,
            subtaskId: sub.id,
            completed: sub.completed
          })
        });
        if (!childRes.ok) throw new Error(`Child failed for "${sub.title}"`);
      }

      loadCanvases();
    } catch (err) {
      console.error('Auto-generate failed:', err);
      setError(`Failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const hasSubtasks = task?.subtasks?.length > 0;

  const s = {
    overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' },
    modal: { background: darkMode ? '#1e1e2e' : '#fafafa', borderRadius: '20px',
      width: '100%', maxWidth: '600px', maxHeight: '80vh',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.4)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 20px', borderBottom: darkMode ? '1px solid #3d3d6b' : '1px solid #eee',
      background: darkMode ? '#16162a' : '#fff' },
    title: { fontSize: '17px', fontWeight: '700',
      color: darkMode ? '#e0e0ff' : '#2d2d2d', margin: 0 },
    closeBtn: { background: '#ff475720', border: 'none', borderRadius: '50%',
      width: '32px', height: '32px', color: '#ff4757', cursor: 'pointer', fontSize: '16px' },
    body: { flex: 1, overflow: 'auto', padding: '20px' },
    errorBox: { background: '#ff475715', border: '1px solid #ff475740',
      borderRadius: '8px', padding: '10px 14px', marginBottom: '12px',
      color: '#ff4757', fontSize: '13px' },
    newBtn: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff', fontWeight: '700', fontSize: '15px',
      cursor: 'pointer', marginBottom: '10px' },
    autoBtn: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
      background: generating ? '#aaa' : 'linear-gradient(135deg, #2ed573, #00d2d3)',
      color: '#fff', fontWeight: '700', fontSize: '15px',
      cursor: generating ? 'not-allowed' : 'pointer', marginBottom: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    createForm: { background: darkMode ? '#2a2a3e' : '#f0eeff',
      border: darkMode ? '1px solid #3d3d6b' : '1px solid #d0c8ff',
      borderRadius: '14px', padding: '16px', marginBottom: '16px' },
    input: { width: '100%', padding: '10px 14px', borderRadius: '10px',
      border: darkMode ? '2px solid #3d3d6b' : '2px solid #e8e8e8',
      background: darkMode ? '#1e1e2e' : '#fff',
      color: darkMode ? '#e0e0ff' : '#2d2d2d',
      fontSize: '14px', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' },
    labelRow: { display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' },
    actionRow: { display: 'flex', gap: '8px' },
    createBtn: { flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff', fontWeight: '600', cursor: 'pointer' },
    cancelBtn: { padding: '9px 14px', borderRadius: '9px', border: 'none',
      background: darkMode ? '#3d3d6b' : '#f0f0f0',
      color: darkMode ? '#e0e0ff' : '#666', cursor: 'pointer' },
    canvasCard: { display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px', borderRadius: '14px', marginBottom: '10px',
      background: darkMode ? '#2a2a3e' : '#fff',
      border: darkMode ? '1px solid #3d3d6b' : '1px solid #eee',
      cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    empty: { textAlign: 'center', color: darkMode ? '#666688' : '#aaa',
      padding: '30px', fontSize: '15px' },
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <h3 style={s.title}>
            🧠 {taskTitle ? `Mind Maps — ${taskTitle}` : 'My Mind Maps'}
          </h3>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.body}>
          {error && <div style={s.errorBox}>⚠ {error}</div>}

          {hasSubtasks && (
            <button style={s.autoBtn} onClick={generateFromTask} disabled={generating}>
              {generating
                ? '⏳ Generating...'
                : `✨ Auto-generate from ${task.subtasks.length} subtasks`}
            </button>
          )}

          {!creating ? (
            <button style={s.newBtn} onClick={() => setCreating(true)}>
              + Create Mind Map Manually
            </button>
          ) : (
            <div style={s.createForm}>
              <input style={s.input} value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Mind map title..." autoFocus
                onKeyDown={e => e.key === 'Enter' && createCanvas()} />
              <div style={{ fontSize: '11px', color: '#888',
                fontWeight: '700', marginBottom: '6px' }}>LABEL</div>
              <div style={s.labelRow}>
                {CANVAS_LABELS.map(l => (
                  <button key={l.key} onClick={() => setNewLabel(l.key)}
                    style={{ background: newLabel === l.key ? l.color : 'transparent',
                      border: `2px solid ${l.color}`, borderRadius: '8px',
                      padding: '4px 12px', color: newLabel === l.key ? '#fff' : l.color,
                      fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                    {l.name}
                  </button>
                ))}
              </div>
              <div style={s.actionRow}>
                <button style={s.createBtn} onClick={createCanvas}>Create</button>
                <button style={s.cancelBtn}
                  onClick={() => { setCreating(false); setNewTitle(''); }}>Cancel</button>
              </div>
            </div>
          )}

          {canvases.length === 0 ? (
            <p style={s.empty}>No mind maps yet. Create one or auto-generate!</p>
          ) : (
            canvases.map(canvas => {
              const labelObj = CANVAS_LABELS.find(l => l.key === canvas.label) || CANVAS_LABELS[0];
              return (
                <div key={canvas.id} style={s.canvasCard}
                  onClick={() => onSelectCanvas(canvas)}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px',
                    background: `${labelObj.color}20`, border: `2px solid ${labelObj.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', flexShrink: 0 }}>🧠</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '600',
                      color: darkMode ? '#e0e0ff' : '#2d2d2d' }}>{canvas.title}</div>
                    <div style={{ fontSize: '12px', marginTop: '2px' }}>
                      <span style={{ background: `${labelObj.color}20`, color: labelObj.color,
                        border: `1px solid ${labelObj.color}40`, borderRadius: '6px',
                        padding: '2px 8px', fontWeight: '600' }}>{labelObj.name}</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteCanvas(canvas.id); }}
                    style={{ background: 'none', border: 'none', color: '#ff4757',
                      cursor: 'pointer', fontSize: '16px', padding: '4px' }}>🗑</button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function MindMap({ canvas, onClose, onBack, darkMode, token }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [treeData, setTreeData] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [newRootLabel, setNewRootLabel] = useState('');
  const [hasMap, setHasMap] = useState(false);
  const [addingToNode, setAddingToNode] = useState(null);
  const [newChildLabel, setNewChildLabel] = useState('');
  const [newChildPriority, setNewChildPriority] = useState('normal');
  const allNodesRef = useRef([]);

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const buildTree = (allNodes) => {
    const map = {};
    allNodes.forEach(n => { map[n.id] = { ...n, children: [] }; });
    let root = null;
    allNodes.forEach(n => {
      if (n.root) root = map[n.id];
      else if (n.parent) map[n.parent.id]?.children.push(map[n.id]);
    });
    return root;
  };

  const handleDelete = (id) => {
    fetch(`${API}/${id}`, { method: 'DELETE', headers: getHeaders() })
      .then(() => loadMap());
  };

  const handlePriority = (id, priority) => {
    fetch(`${API}/${id}/priority`, { method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ priority }) }).then(() => loadMap());
  };

  const handleLabelUpdate = (id, text) => {
    fetch(`${API}/${id}/label`, { method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ label: text }) }).then(() => loadMap());
  };

  const handleToggle = (id) => {
    fetch(`${API}/${id}/toggle`, { method: 'PUT', headers: getHeaders() })
      .then(() => loadMap());
  };

  const buildFlowData = useCallback((allNodes, savedEdges = []) => {
    const flowNodes = allNodes.map(n => ({
      id: String(n.id), type: 'custom',
      position: { x: n.x || 300, y: n.y || 200 },
      data: {
        id: n.id, label: n.label, isRoot: n.root,
        priority: n.priority || 'normal', darkMode,
        completed: n.completed || false,
        subtaskId: n.subtaskId,
        onAdd: (nodeId) => setAddingToNode(nodeId),
        onDelete: (nodeId) => handleDelete(nodeId),
        onPriority: (nodeId, p) => handlePriority(nodeId, p),
        onLabel: (nodeId, text) => handleLabelUpdate(nodeId, text),
        onToggle: (nodeId) => handleToggle(nodeId),
      }
    }));

    const parentEdges = allNodes.filter(n => n.parent).map((n, i) => ({
      id: `e${n.parent.id}-${n.id}`,
      source: String(n.parent.id), target: String(n.id),
      type: 'colored',
      style: { stroke: EDGE_COLORS[i % EDGE_COLORS.length], strokeWidth: 2.5 },
    }));

    const manualEdges = savedEdges.map(e => ({
      id: `manual-${e.id}`,
      source: e.sourceNodeId, target: e.targetNodeId,
      type: 'colored',
      style: { stroke: e.color, strokeWidth: 2.5 },
    }));

    return { flowNodes, flowEdges: [...parentEdges, ...manualEdges] };
  }, [darkMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMap = useCallback(() => {
    Promise.all([
      fetch(`${API}/canvas/${canvas.id}/nodes`, { headers: getHeaders() })
        .then(r => r.ok ? r.json() : []),
      fetch(`${API}/canvas/${canvas.id}/edges`, { headers: getHeaders() })
        .then(r => r.ok ? r.json() : []),
    ]).then(([nodeData, edgeData]) => {
      if (!nodeData || nodeData.length === 0) { setHasMap(false); return; }
      setHasMap(true);
      allNodesRef.current = nodeData;
      setTreeData(buildTree(nodeData));
      const { flowNodes, flowEdges } = buildFlowData(
        nodeData, Array.isArray(edgeData) ? edgeData : []
      );
      setNodes(flowNodes);
      setEdges(flowEdges);
    }).catch(() => setHasMap(false));
  }, [canvas.id, darkMode, buildFlowData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadMap(); }, [loadMap]);

  const createRoot = () => {
    if (!newRootLabel.trim()) return;
    fetch(`${API}/canvas/${canvas.id}/root`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ label: newRootLabel, priority: 'normal' })
    }).then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { setNewRootLabel(''); loadMap(); } });
  };

  const addChild = (parentId, label, priority = 'normal') => {
    const allNodes = allNodesRef.current;
    const parent = allNodes.find(n => n.id === parentId);
    const siblings = allNodes.filter(n => n.parent?.id === parentId);
    const total = Math.max(siblings.length + 1, 1);
    const pos = calcChildPosition(parent?.x || 300, parent?.y || 200, siblings.length, total);
    fetch(`${API}/${parentId}/child`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ label, priority, x: pos.x, y: pos.y })
    }).then(() => loadMap());
  };

  const onNodeDragStop = useCallback((event, node) => {
    fetch(`${API}/${node.id}/position`, {
      method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ x: node.position.x, y: node.position.y })
    });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const onConnect = useCallback((params) => {
    const strokeColor = EDGE_COLORS[Math.floor(Math.random() * EDGE_COLORS.length)];
    setEdges(eds => addEdge({ ...params, type: 'colored',
      style: { stroke: strokeColor, strokeWidth: 2.5 } }, eds));
    fetch(`${API}/canvas/${canvas.id}/edges`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({
        sourceNodeId: params.source,
        targetNodeId: params.target,
        color: strokeColor
      })
    });
  }, [setEdges, canvas.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Delete edge from backend when removed on canvas
  const onEdgesDelete = useCallback((deletedEdges) => {
    deletedEdges.forEach(edge => {
      if (edge.id.startsWith('manual-')) {
        const edgeId = edge.id.replace('manual-', '');
        fetch(`${API}/edges/${edgeId}`, {
          method: 'DELETE', headers: getHeaders()
        });
      }
    });
  }, [setEdges, canvas.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const labelObj = CANVAS_LABELS.find(l => l.key === canvas.label) || CANVAS_LABELS[0];

  const s = {
    overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' },
    modal: { background: darkMode ? '#1e1e2e' : '#fafafa', borderRadius: '20px',
      width: '100%', maxWidth: isMobile ? '100%' : '95vw', height: '88vh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '0 25px 80px rgba(0,0,0,0.4)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 20px', borderBottom: darkMode ? '1px solid #3d3d6b' : '1px solid #eee',
      background: darkMode ? '#16162a' : '#fff' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    backBtn: { background: darkMode ? '#3d3d6b' : '#f0f0f0', border: 'none',
      borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
      color: darkMode ? '#e0e0ff' : '#666', fontSize: '13px' },
    headerTitle: { fontSize: '16px', fontWeight: '700',
      color: darkMode ? '#e0e0ff' : '#2d2d2d', margin: 0 },
    labelBadge: { fontSize: '11px', padding: '3px 10px', borderRadius: '8px',
      background: `${labelObj.color}20`, color: labelObj.color,
      border: `1px solid ${labelObj.color}40`, fontWeight: '600' },
    closeBtn: { background: '#ff475720', border: 'none', borderRadius: '50%',
      width: '32px', height: '32px', color: '#ff4757', cursor: 'pointer', fontSize: '16px' },
    body: { flex: 1, overflow: isMobile ? 'auto' : 'hidden',
      padding: isMobile ? '16px' : '0', position: 'relative' },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '12px', padding: '20px' },
    emptyText: { color: darkMode ? '#666688' : '#aaa', fontSize: '15px', textAlign: 'center' },
    rootInput: { flex: 1, minWidth: '200px', padding: '12px 16px', borderRadius: '12px',
      border: darkMode ? '2px solid #3d3d6b' : '2px solid #e8e8e8',
      background: darkMode ? '#2a2a3e' : '#fff', color: darkMode ? '#e0e0ff' : '#2d2d2d',
      fontSize: '15px', outline: 'none', resize: 'vertical', minHeight: '60px',
      fontFamily: 'inherit', lineHeight: '1.5' },
    createBtn: { padding: '12px 20px', borderRadius: '12px', border: 'none',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff', fontWeight: '700', fontSize: '15px', cursor: 'pointer' },
    popup: { position: 'absolute', top: '12px', left: '50%',
      transform: 'translateX(-50%)',
      background: darkMode ? '#1e1e2e' : '#fff',
      border: darkMode ? '1px solid #3d3d6b' : '1px solid #ddd',
      borderRadius: '14px', padding: '14px', zIndex: 100,
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)', minWidth: '280px' },
    popupLabel: { fontSize: '11px', color: '#888', fontWeight: '700',
      marginBottom: '6px', letterSpacing: '0.5px' },
    popupInput: { width: '100%', padding: '8px 12px', borderRadius: '8px',
      border: darkMode ? '1px solid #3d3d6b' : '1px solid #ddd',
      background: darkMode ? '#2a2a3e' : '#f8f8ff',
      color: darkMode ? '#e0e0ff' : '#2d2d2d', fontSize: '14px', outline: 'none',
      marginBottom: '10px', boxSizing: 'border-box',
      resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' },
    priorityRow: { display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' },
    popupActions: { display: 'flex', gap: '6px' },
    popupAdd: { flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff', cursor: 'pointer', fontWeight: '600' },
    popupCancel: { padding: '8px 12px', borderRadius: '8px', border: 'none',
      background: darkMode ? '#3d3d6b' : '#f0f0f0',
      color: darkMode ? '#e0e0ff' : '#666', cursor: 'pointer' },
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.headerLeft}>
            <button style={s.backBtn} onClick={onBack}>← Back</button>
            <h3 style={s.headerTitle}>{canvas.title}</h3>
            <span style={s.labelBadge}>{labelObj.name}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '10px',
              background: darkMode ? '#3d3d6b' : '#ede9ff',
              color: darkMode ? '#667eea' : '#764ba2', fontWeight: '600' }}>
              {isMobile ? '📱 Tree' : '🖥 Canvas · Double-click to edit · Click edge + Del to remove'}
            </span>
            <button style={s.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={s.body}>
          {!hasMap ? (
            <div style={s.emptyState}>
              <div style={{ fontSize: '48px' }}>🧠</div>
              <p style={s.emptyText}>Create your central topic to start</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <textarea style={s.rootInput} value={newRootLabel}
                  onChange={e => setNewRootLabel(e.target.value)}
                  placeholder="Central topic... (Shift+Enter for new line)" autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createRoot(); }
                  }} />
                <button style={s.createBtn} onClick={createRoot}>Create 🚀</button>
              </div>
            </div>

          ) : isMobile ? (
            treeData && (
              <TreeNode node={treeData} onAddChild={addChild}
                onDelete={handleDelete} onPriority={handlePriority}
                onToggle={handleToggle} darkMode={darkMode} />
            )

          ) : (
            <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: '500px' }}>
              {addingToNode && (
                <div style={s.popup} onClick={e => e.stopPropagation()}>
                  <div style={s.popupLabel}>NODE LABEL</div>
                  <textarea style={s.popupInput} value={newChildLabel}
                    onChange={e => setNewChildLabel(e.target.value)}
                    placeholder="Enter label... (Shift+Enter for new line)" autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && newChildLabel.trim()) {
                        e.preventDefault();
                        addChild(addingToNode, newChildLabel, newChildPriority);
                        setNewChildLabel(''); setNewChildPriority('normal'); setAddingToNode(null);
                      }
                      if (e.key === 'Escape') { setAddingToNode(null); setNewChildLabel(''); }
                    }} />
                  <div style={s.popupLabel}>PRIORITY</div>
                  <div style={s.priorityRow}>
                    {Object.entries(PRIORITY_COLORS).map(([key, val]) => (
                      <button key={key} onClick={() => setNewChildPriority(key)}
                        style={{ background: newChildPriority === key ? val.bg : val.light,
                          border: `1.5px solid ${val.border}`, borderRadius: '8px',
                          padding: '4px 10px', color: newChildPriority === key ? '#fff' : val.bg,
                          fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>
                        {val.label}
                      </button>
                    ))}
                  </div>
                  <div style={s.popupActions}>
                    <button style={s.popupAdd} onClick={() => {
                      if (newChildLabel.trim()) {
                        addChild(addingToNode, newChildLabel, newChildPriority);
                        setNewChildLabel(''); setNewChildPriority('normal'); setAddingToNode(null);
                      }
                    }}>Add Node</button>
                    <button style={s.popupCancel} onClick={() => {
                      setAddingToNode(null); setNewChildLabel('');
                    }}>Cancel</button>
                  </div>
                </div>
              )}

              <ReactFlow nodes={nodes} edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                onEdgesDelete={onEdgesDelete}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                deleteKeyCode={['Backspace', 'Delete']}>
                <Controls />
                <MiniMap
                  nodeColor={n => PRIORITY_COLORS[n.data?.priority || 'normal']?.bg || '#667eea'}
                  style={{ background: darkMode ? '#1e1e2e' : '#fff',
                    border: darkMode ? '1px solid #3d3d6b' : '1px solid #ddd' }} />
                <Background color={darkMode ? '#3d3d6b' : '#e8e4ff'} gap={20} size={1} />
              </ReactFlow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MindMapWrapper({ taskId, taskTitle, task, onClose, darkMode, token }) {
  const [selectedCanvas, setSelectedCanvas] = useState(null);

  if (selectedCanvas) {
    return (
      <MindMap canvas={selectedCanvas} onClose={onClose}
        onBack={() => setSelectedCanvas(null)} darkMode={darkMode} token={token} />
    );
  }

  return (
    <CanvasList taskId={taskId} taskTitle={taskTitle} task={task}
      onSelectCanvas={setSelectedCanvas} onClose={onClose}
      darkMode={darkMode} token={token} />
  );
}