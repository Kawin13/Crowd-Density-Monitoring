import { useState, useEffect } from 'react'
import { Edit2, Trash2, UserCheck, UserX, RefreshCw, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { parseServerDate } from '../utils/date'

const ROLE_COLOR = { ADMIN:'#2563EB', OPERATOR:'#F59E0B', VIEWER:'#10B981' }

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ fullName:user?.fullName||'', email:user?.email||'', role:user?.role||'VIEWER' })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]:e.target.value }))
  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true)
    try { await api.put(`/users/${user.id}`, form); toast.success('User updated'); onSave() }
    catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Edit User</span>
          <button className="btn-icon sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:500, color:'var(--t2)', marginBottom:6, display:'block' }}>Username</label>
            <input className="form-control" value={user?.username} disabled style={{ opacity:.6 }}/>
          </div>
          {[['Full Name','fullName','text','Full name'],['Email','email','email','Email address']].map(([label,key,type,ph]) => (
            <div key={key}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--t2)', marginBottom:6, display:'block' }}>{label}</label>
              <input className="form-control" type={type} placeholder={ph} value={form[key]} onChange={set(key)}/>
            </div>
          ))}
          <div>
            <label style={{ fontSize:13, fontWeight:500, color:'var(--t2)', marginBottom:6, display:'block' }}>Role</label>
            <select className="form-control" value={form.role} onChange={set('role')}>
              {['ADMIN','OPERATOR','VIEWER'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateUserModal({ onClose, onSave }) {
  const [form, setForm] = useState({ username:'', email:'', password:'', fullName:'', role:'VIEWER' })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]:e.target.value }))
  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true)
    try { await api.post('/users', form); toast.success('User created'); onSave() }
    catch (err) { toast.error(err?.response?.data?.message || 'Create failed') }
    finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Create User</span>
          <button className="btn-icon sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[['Username','username','text','Username'],['Full Name','fullName','text','Full name'],['Email','email','email','Email address'],['Password','password','password','Minimum 8 characters']].map(([label,key,type,ph]) => (
            <div key={key}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--t2)', marginBottom:6, display:'block' }}>{label}</label>
              <input className="form-control" type={type} placeholder={ph} value={form[key]} onChange={set(key)} required={key!=='fullName'} minLength={key==='password'?8:undefined}/>
            </div>
          ))}
          <div>
            <label style={{ fontSize:13, fontWeight:500, color:'var(--t2)', marginBottom:6, display:'block' }}>Role</label>
            <select className="form-control" value={form.role} onChange={set('role')}>
              {['ADMIN','OPERATOR','VIEWER'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Creating…':'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const { user: me } = useAuth()

  const fetchUsers = async () => {
    setLoading(true)
    try { const r = await api.get('/users'); setUsers(r.data.data||[]) }
    catch { toast.error('Unable to fetch data') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleActive = async u => {
    if (u.id === me?.id) { toast.error('Cannot deactivate your own account'); return }
    try { await api.put(`/users/${u.id}/toggle-active`); toast.success(`User ${u.isActive?'deactivated':'activated'}`); fetchUsers() }
    catch { toast.error('Action failed') }
  }

  const deleteUser = async u => {
    if (u.id === me?.id) { toast.error('Cannot delete your own account'); return }
    if (!confirm(`Delete user "${u.username}"?`)) return
    try { await api.delete(`/users/${u.id}`); toast.success('User deleted'); fetchUsers() }
    catch { toast.error('Delete failed') }
  }

  return (
    <div className="slide-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p style={{ fontSize:13, color:'var(--t2)', marginTop:3 }}>{users.length} registered users</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchUsers}><RefreshCw size={13}/> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><UserPlus size={13}/> Create User</button>
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:24 }}>
            {[...Array(4)].map((_,i) => (
              <div key={i} style={{ display:'flex', gap:12, padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
                <div className="skeleton" style={{ width:36, height:36, borderRadius:'50%' }}/>
                <div style={{ flex:1 }}>
                  <div className="skeleton" style={{ height:14, width:'40%', marginBottom:6 }}/>
                  <div className="skeleton" style={{ height:12, width:'60%' }}/>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tw">
            <table>
              <thead>
                <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:34, height:34, borderRadius:'50%', flexShrink:0,
                          background:`${ROLE_COLOR[u.role]||'#2563EB'}18`,
                          border:`2px solid ${ROLE_COLOR[u.role]||'#2563EB'}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:12, fontWeight:700, color:ROLE_COLOR[u.role]||'#2563EB'
                        }}>
                          {(u.fullName||u.username||'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:500, fontSize:13 }}>{u.fullName||u.username}</div>
                          <div style={{ fontSize:11, color:'var(--t3)' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:13, color:'var(--t2)' }}>{u.email}</td>
                    <td>
                      <span style={{ background:`${ROLE_COLOR[u.role]||'#2563EB'}18`, color:ROLE_COLOR[u.role]||'#2563EB', padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:600 }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:u.isActive?'#10B981':'#EF4444' }}/>
                        {u.isActive?'Active':'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--t3)' }}>
                      {u.lastLogin ? format(parseServerDate(u.lastLogin),'dd MMM yyyy') : 'Never'}
                    </td>
                    <td style={{ fontSize:12, color:'var(--t3)' }}>
                      {u.createdAt ? format(parseServerDate(u.createdAt),'dd MMM yyyy') : '—'}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn-icon sm" onClick={() => setEditing(u)} title="Edit"><Edit2 size={13}/></button>
                        <button className={`btn-icon sm ${u.isActive?'':'btn-success'}`} onClick={() => toggleActive(u)}
                          disabled={u.id===me?.id}
                          title={u.isActive?'Deactivate':'Activate'}
                          style={{ color:u.isActive?'var(--t2)':'var(--success)' }}>
                          {u.isActive ? <UserX size={13}/> : <UserCheck size={13}/>}
                        </button>
                        <button className="btn-icon sm" onClick={() => deleteUser(u)}
                          disabled={u.id===me?.id} title="Delete"
                          style={{ color:'var(--danger)' }}
                          onMouseEnter={e => e.currentTarget.style.background='#FEF2F2'}
                          onMouseLeave={e => e.currentTarget.style.background='var(--surface-2)'}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <UserModal user={editing} onClose={() => setEditing(null)} onSave={() => { setEditing(null); fetchUsers() }}/>}
      {creating && <CreateUserModal onClose={() => setCreating(false)} onSave={() => { setCreating(false); fetchUsers() }}/>}
    </div>
  )
}
