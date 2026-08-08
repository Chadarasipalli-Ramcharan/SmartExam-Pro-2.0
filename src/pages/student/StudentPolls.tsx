import { useEffect, useState, useCallback } from 'react';
import { BarChart3, Vote, Users, CheckCircle2, Lock } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { SkeletonRow } from '@/components/Loading';
import { Modal } from '@/components/Modal';
import { fetchPolls, fetchPoll, votePoll, hasUserVoted } from '@/lib/queries';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { PollWithDetails, PollOptionWithVotes } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  single: 'Single choice',
  multiple: 'Multiple choice',
  yesno: 'Yes / No',
};
const TYPE_BADGE: Record<string, string> = {
  single: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  multiple: 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300',
  yesno: 'bg-warning-100 dark:bg-warning-700/30 text-warning-700 dark:text-warning-300',
};

export function StudentPolls() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [polls, setPolls] = useState<PollWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [confirmPoll, setConfirmPoll] = useState<PollWithDetails | null>(null);
  const [confirmOption, setConfirmOption] = useState<PollOptionWithVotes | null>(null);
  const [multiSelections, setMultiSelections] = useState<Record<string, string[]>>({});

  const isRelevant = useCallback(
    (p: PollWithDetails) => {
      if (p.target_audience !== 'students' && p.target_audience !== 'both') return false;
      if (p.department_id && p.department_id !== profile?.department_id) return false;
      if (p.semester_id && p.semester_id !== profile?.semester_id) return false;
      if (p.section_id && p.section_id !== profile?.section_id) return false;
      return true;
    },
    [profile],
  );

  async function load() {
    setLoading(true);
    try {
      const all = await fetchPolls();
      const relevant = all.filter(isRelevant);
      // Enrich with has_voted status for the current user
      const enriched = await Promise.all(
        relevant.map(async (p) => {
          if (profile?.id) {
            try {
              const voted = await hasUserVoted(p.id, profile.id);
              return { ...p, has_voted: voted };
            } catch {
              return p;
            }
          }
          return p;
        }),
      );
      setPolls(enriched);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function toggleMulti(pollId: string, optionId: string) {
    setMultiSelections((prev) => {
      const current = prev[pollId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [pollId]: current.filter((id) => id !== optionId) };
      }
      return { ...prev, [pollId]: [...current, optionId] };
    });
  }

  async function castVote(pollId: string, optionIds: string[]) {
    if (!profile?.id) {
      toast('You must be signed in to vote', 'error');
      return;
    }
    setVoting(true);
    try {
      await votePoll(pollId, optionIds, profile.id);
      toast('Vote submitted', 'success');
      // Refresh the single poll to get updated counts and has_voted
      const updated = await fetchPoll(pollId, profile.id);
      if (updated) {
        setPolls((prev) => prev.map((p) => (p.id === pollId ? updated : p)));
      }
      setMultiSelections((prev) => {
        const next = { ...prev };
        delete next[pollId];
        return next;
      });
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setVoting(false);
    }
  }

  function handleSingleVote(poll: PollWithDetails, option: PollOptionWithVotes) {
    setConfirmPoll(poll);
    setConfirmOption(option);
  }

  function confirmSingleVote() {
    if (confirmPoll && confirmOption) {
      castVote(confirmPoll.id, [confirmOption.id]);
    }
    setConfirmPoll(null);
    setConfirmOption(null);
  }

  async function submitMultiple(poll: PollWithDetails) {
    const selected = multiSelections[poll.id] ?? [];
    if (selected.length === 0) {
      toast('Select at least one option', 'error');
      return;
    }
    await castVote(poll.id, selected);
  }

  function renderResults(poll: PollWithDetails) {
    const total = poll.total_votes ?? 0;
    return (
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
          {poll.has_voted ? 'You voted · ' : ''}Results
        </p>
        {(poll.options ?? []).map((opt) => {
          const pct = total > 0 ? Math.round((opt.vote_count / total) * 100) : 0;
          return (
            <div key={opt.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                <span className="text-slate-500">{opt.vote_count} ({pct}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {total === 0 && <p className="text-xs text-slate-400 text-center py-2">No votes yet.</p>}
      </div>
    );
  }

  function renderPoll(poll: PollWithDetails) {
    const isClosed = poll.status === 'closed';
    const alreadyVoted = !!poll.has_voted;
    const showResults = isClosed || alreadyVoted;
    const selected = multiSelections[poll.id] ?? [];

    return (
      <div key={poll.id} className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">{poll.title}</h3>
              <span className={`badge ${TYPE_BADGE[poll.poll_type]}`}>{TYPE_LABELS[poll.poll_type]}</span>
              <span className={`badge ${isClosed ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300'}`}>
                {isClosed ? 'Closed' : 'Active'}
              </span>
              {poll.is_anonymous && <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500">Anonymous</span>}
            </div>
            {poll.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{poll.description}</p>}
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {poll.target_audience}</span>
              <span className="flex items-center gap-1"><Vote className="w-3 h-3" /> {poll.total_votes ?? 0} votes</span>
              <span>{new Date(poll.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {!showResults && poll.poll_type === 'multiple' && (
          <div className="space-y-2">
            {(poll.options ?? []).map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  selected.includes(opt.id)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggleMulti(poll.id, opt.id)}
                  className="rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
              </label>
            ))}
            <button
              onClick={() => submitMultiple(poll)}
              disabled={voting || selected.length === 0}
              className="btn-primary mt-2"
            >
              {voting ? 'Submitting…' : 'Submit Votes'}
            </button>
          </div>
        )}

        {!showResults && (poll.poll_type === 'single' || poll.poll_type === 'yesno') && (
          <div className="grid sm:grid-cols-2 gap-2">
            {(poll.options ?? []).map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSingleVote(poll, opt)}
                disabled={voting}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-left text-sm text-slate-700 dark:text-slate-300 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {showResults && renderResults(poll)}

        {isClosed && !alreadyVoted && (
          <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3" /> This poll is closed. Results shown above.
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Polls" subtitle="Share your voice — vote on active polls" icon={BarChart3} />
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Polls" subtitle="Share your voice — vote on active polls" icon={BarChart3} />

      {polls.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No polls available"
          message="There are no active polls for you right now. Check back later."
        />
      ) : (
        <div className="space-y-3">
          {polls.map(renderPoll)}
        </div>
      )}

      <Modal
        open={!!confirmPoll}
        onClose={() => { setConfirmPoll(null); setConfirmOption(null); }}
        title="Confirm your vote"
        size="sm"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          You are about to vote for{' '}
          <span className="font-semibold text-slate-900 dark:text-white">"{confirmOption?.label}"</span>
          {' '}in{' '}
          <span className="font-semibold text-slate-900 dark:text-white">"{confirmPoll?.title}"</span>.
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => { setConfirmPoll(null); setConfirmOption(null); }} className="btn-secondary">Cancel</button>
          <button onClick={confirmSingleVote} disabled={voting} className="btn-primary">
            {voting ? 'Submitting…' : 'Confirm vote'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
