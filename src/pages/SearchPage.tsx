import { useState } from 'react';
import { Search as SearchIcon, Users, User, BookOpen, Building2, ArrowRight } from 'lucide-react';
import { globalSearch } from '@/lib/queries';
import type { Profile, SubjectWithDetails, Department } from '@/types';
import { Spinner } from '@/components/Loading';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ students: Profile[]; faculty: Profile[]; subjects: SubjectWithDetails[]; departments: Department[] } | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      setResults(await globalSearch(query.trim()));
    } finally {
      setLoading(false);
    }
  }

  const hasResults = results && (results.students.length > 0 || results.faculty.length > 0 || results.subjects.length > 0 || results.departments.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search</h1>
        <p className="text-sm text-slate-500 mt-1">Search students, faculty, subjects, and departments.</p>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-2xl">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, code, email…" className="input pl-10 pr-24 text-base" />
        <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !py-1.5 !px-4 text-sm">
          {loading ? <Spinner className="w-4 h-4" /> : 'Search'}
        </button>
      </form>

      {loading && <div className="flex justify-center py-12"><Spinner className="w-8 h-8 text-primary-500" /></div>}

      {!loading && results && !hasResults && (
        <div className="card p-12 text-center">
          <SearchIcon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No results found for "{query}"</p>
        </div>
      )}

      {!loading && results && hasResults && (
        <div className="space-y-6">
          {results.departments.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> Departments</h3>
              <div className="space-y-2">
                {results.departments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <div><p className="font-medium text-slate-900 dark:text-white">{d.name}</p><p className="text-xs text-slate-400">{d.code}</p></div>
                    <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{d.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.students.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> Students</h3>
              <div className="space-y-2">
                {results.students.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold text-sm">{s.full_name.charAt(0)}</div>
                    <div className="flex-1"><p className="font-medium text-slate-900 dark:text-white">{s.full_name}</p><p className="text-xs text-slate-400">{s.email} · {s.roll_number ?? s.enrollment_number ?? ''}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.faculty.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> Faculty</h3>
              <div className="space-y-2">
                {results.faculty.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center text-white font-semibold text-sm">{f.full_name.charAt(0)}</div>
                    <div className="flex-1"><p className="font-medium text-slate-900 dark:text-white">{f.full_name}</p><p className="text-xs text-slate-400">{f.email} · {f.designation ?? ''}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.subjects.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-slate-400" /> Subjects</h3>
              <div className="space-y-2">
                {results.subjects.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <div><p className="font-medium text-slate-900 dark:text-white">{s.name}</p><p className="text-xs text-slate-400">{s.code} · {s.department?.name} · {s.credits} credits</p></div>
                    <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{s.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
