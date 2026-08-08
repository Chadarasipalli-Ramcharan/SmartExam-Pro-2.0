import { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Save, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/Loading';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  if (!profile) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      toast('Failed to update profile', 'error');
      return;
    }
    await refreshProfile();
    toast('Profile updated successfully', 'success');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal information.</p>
      </div>

      {/* Profile header */}
      <div className="card p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-2xl shadow">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.full_name}</h2>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <span className={`badge mt-2 ${profile.role === 'admin' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300'}`}>
            {profile.role}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <h3 className="font-semibold text-slate-900 dark:text-white">Edit information</h3>
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input pl-10" />
          </div>
        </div>
        <div>
          <label className="label">Email <span className="text-slate-400 font-normal">(cannot be changed)</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" disabled value={profile.email} className="input pl-10 opacity-60 cursor-not-allowed" />
          </div>
        </div>
        <div>
          <label className="label">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" className="input pl-10" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          Joined {new Date(profile.created_at).toLocaleDateString()}
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? <Spinner className="w-4 h-4" /> : <><Save className="w-4 h-4" /> Save changes</>}
        </button>
      </form>

      {/* Account info */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-slate-400" /> Account security</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Account status</span>
            <span className="badge bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300">Active</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Role</span>
            <span className="font-medium text-slate-900 dark:text-white capitalize">{profile.role}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">User ID</span>
            <span className="font-mono text-xs text-slate-400">{profile.id.slice(0, 8)}…</span>
          </div>
        </div>
      </div>
    </div>
  );
}
