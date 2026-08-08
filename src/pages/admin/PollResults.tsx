import { useEffect, useState, useMemo } from 'react';
import { BarChart3, CheckCircle2, Lock, Vote, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { SkeletonCard } from '@/components/Loading';
import { fetchPolls, fetchAllProfiles, fetchDepartments } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import type { PollWithDetails, Profile, Department } from '@/types';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const TYPE_LABELS: Record<string, string> = { single: 'Single', multiple: 'Multiple', yesno: 'Yes/No' };

export function PollResults() {
  const [polls, setPolls] = useState<PollWithDetails[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPolls(), fetchAllProfiles(), fetchDepartments()])
      .then(([p, prof, d]) => { setPolls(p); setProfiles(prof); setDepartments(d); })
      .finally(() => setLoading(false));
  }, []);

  // Fetch all poll_votes with user info to analyze participation by role & department.
  const [votes, setVotes] = useState<{ poll_id: string; option_id: string; user_id: string }[]>([]);
  useEffect(() => {
    supabase.from('poll_votes').select('poll_id,option_id,user_id').then(({ data }) => {
      if (data) setVotes(data as typeof votes);
    });
  }, []);

  const totalPolls = polls.length;
  const activePolls = polls.filter((p) => p.status === 'active').length;
  const closedPolls = polls.filter((p) => p.status === 'closed').length;
  const totalVotes = polls.reduce((s, p) => s + (p.total_votes ?? 0), 0);

  // Faculty vs Student participation (by voter role)
  const roleData = useMemo(() => {
    let faculty = 0, students = 0, other = 0;
    const seen = new Set<string>();
    votes.forEach((v) => {
      if (seen.has(v.user_id)) return;
      seen.add(v.user_id);
      const prof = profiles.find((p) => p.id === v.user_id);
      if (prof?.role === 'faculty') faculty += 1;
      else if (prof?.role === 'student') students += 1;
      else other += 1;
    });
    return [
      { name: 'Faculty', value: faculty, color: '#3b82f6' },
      { name: 'Students', value: students, color: '#22c55e' },
      { name: 'Other', value: other, color: '#94a3b8' },
    ].filter((d) => d.value > 0);
  }, [votes, profiles]);

  // Department-wise response distribution
  const deptData = useMemo(() => {
    const map: Record<string, number> = {};
    const seen = new Set<string>();
    votes.forEach((v) => {
      const key = `${v.poll_id}:${v.user_id}`;
      if (seen.has(key)) return;
      seen.add(key);
      const prof = profiles.find((p) => p.id === v.user_id);
      const deptId = prof?.department_id;
      const deptName = departments.find((d) => d.id === deptId)?.name ?? 'Unknown';
      map[deptName] = (map[deptName] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [votes, profiles, departments]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Poll Results" subtitle="Analytics and insights from polls" icon={BarChart3} />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BarChart3} label="Total Polls" value={totalPolls} color="primary" />
            <StatCard icon={CheckCircle2} label="Active Polls" value={activePolls} color="success" />
            <StatCard icon={Lock} label="Closed Polls" value={closedPolls} color="warning" />
            <StatCard icon={Vote} label="Total Votes" value={totalVotes} color="accent" />
          </div>

          {/* Participation overview */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-500" /> Faculty vs Student Participation
              </h3>
              <p className="text-sm text-slate-400 mb-4">Unique voters by role</p>
              {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label>
                      {roleData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgb(226 232 240)', fontSize: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No votes yet.</div>
              )}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Department-wise Responses</h3>
              <p className="text-sm text-slate-400 mb-4">Vote distribution across departments</p>
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgb(148 163 184 / 0.6)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgb(226 232 240)', fontSize: 12 }} />
                    <Bar dataKey="value" name="Votes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No votes yet.</div>
              )}
            </div>
          </div>

          {/* Per-poll breakdown */}
          {polls.length === 0 ? (
            <div className="card p-12 text-center">
              <BarChart3 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No polls to analyze</p>
            </div>
          ) : (
            <div className="space-y-6">
              {polls.map((poll, idx) => {
                const total = poll.total_votes ?? 0;
                const pieData = (poll.options ?? []).map((o, i) => ({
                  name: o.label, value: o.vote_count ?? 0, color: PIE_COLORS[i % PIE_COLORS.length],
                })).filter((d) => d.value > 0);
                const barData = (poll.options ?? []).map((o) => ({ name: o.label, votes: o.vote_count ?? 0 }));

                return (
                  <div key={poll.id} className="card p-6">
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{poll.title}</h3>
                      <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500">{TYPE_LABELS[poll.poll_type] ?? poll.poll_type}</span>
                      <span className={`badge ${poll.status === 'active' ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{poll.status}</span>
                      <span className="text-xs text-slate-400 ml-auto">{total} total votes</span>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Pie chart */}
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Vote distribution</p>
                        {pieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label>
                                {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgb(226 232 240)', fontSize: 12 }} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No votes yet.</div>
                        )}
                      </div>

                      {/* Bar chart */}
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Votes per option</p>
                        {barData.some((d) => d.votes > 0) ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgb(148 163 184 / 0.6)" />
                              <YAxis tick={{ fontSize: 12 }} stroke="rgb(148 163 184 / 0.6)" allowDecimals={false} />
                              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgb(226 232 240)', fontSize: 12 }} />
                              <Bar dataKey="votes" name="Votes" fill={PIE_COLORS[idx % PIE_COLORS.length]} radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No votes yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Percentage cards per option */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {(poll.options ?? []).map((opt, i) => {
                        const pct = total > 0 ? Math.round((opt.vote_count / total) * 100) : 0;
                        return (
                          <div key={opt.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{opt.label}</p>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{pct}%</p>
                            <p className="text-xs text-slate-400">{opt.vote_count} votes</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
