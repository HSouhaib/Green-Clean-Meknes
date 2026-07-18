import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useErrorModal } from '@/hooks/useErrorModal';
import { Award, Search, Trophy, Users, Plus, Settings2 } from 'lucide-react';

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function LeaderboardTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pointsInput, setPointsInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');

  const { data: leaders, isLoading } = trpc.leaderboard.getTop.useQuery(
    { limit: 50 },
    { staleTime: 1000 * 60 }
  );
  const { data: users } = trpc.user.list.useQuery(
    { page: 1, limit: 1000 },
    { staleTime: 1000 * 60 * 5 }
  );
  const { data: settings } = trpc.settings.list.useQuery();

  const [registrationPoints, setRegistrationPoints] = useState('1');
  const [attendancePoints, setAttendancePoints] = useState('5');
  const [perWasteKgPoints, setPerWasteKgPoints] = useState('0');

  useEffect(() => {
    if (settings) {
      const timeout = setTimeout(() => {
        setRegistrationPoints(settings.points_registration ?? '1');
        setAttendancePoints(settings.points_attendance ?? '5');
        setPerWasteKgPoints(settings.points_per_waste_kg ?? '0');
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [settings]);

  const updateSettingMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.list.invalidate();
      toast.success(t('toast.settings_saved'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const handleSavePointSettings = () => {
    const reg = parseInt(registrationPoints, 10);
    const att = parseInt(attendancePoints, 10);
    const waste = parseInt(perWasteKgPoints, 10);
    if (
      isNaN(reg) ||
      isNaN(att) ||
      isNaN(waste) ||
      reg < 0 ||
      att < 0 ||
      waste < 0
    ) {
      showError(t('admin.leaderboard.invalid_points'));
      return;
    }
    updateSettingMutation.mutate({
      key: 'points_registration',
      value: String(reg),
    });
    updateSettingMutation.mutate({
      key: 'points_attendance',
      value: String(att),
    });
    updateSettingMutation.mutate({
      key: 'points_per_waste_kg',
      value: String(waste),
    });
  };

  const hasPointChanges =
    registrationPoints !== (settings?.points_registration ?? '1') ||
    attendancePoints !== (settings?.points_attendance ?? '5') ||
    perWasteKgPoints !== (settings?.points_per_waste_kg ?? '0');

  const awardMutation = trpc.leaderboard.awardPoints.useMutation({
    onSuccess: () => {
      utils.leaderboard.getTop.invalidate();
      utils.leaderboard.listAwards.invalidate();
      toast.success(t('toast.points_awarded'));
      setSelectedUserId(null);
      setPointsInput('');
      setReasonInput('');
    },
    onError: (err) => showError(err.message),
  });

  const handleAward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !pointsInput || !reasonInput) return;
    const points = parseInt(pointsInput, 10);
    if (isNaN(points)) return;
    awardMutation.mutate({
      userId: selectedUserId,
      points,
      reason: reasonInput,
    });
  };

  const filtered = leaders?.filter((leader) =>
    leader.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
          {t('admin.leaderboard.title')}
        </h2>
      </div>

      {/* Points system configuration */}
      <div
        className="p-5 rounded-xl space-y-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
      >
        <div className="flex items-center gap-2">
          <Settings2 size={18} style={{ color: 'var(--accent-green)' }} />
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('admin.leaderboard.points_system')}
          </h3>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {t('admin.leaderboard.points_system_help')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              className="text-xs font-mono uppercase tracking-wider block mb-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {t('admin.leaderboard.points_registration')}
            </label>
            <input
              type="number"
              min={0}
              value={registrationPoints}
              onChange={(e) => setRegistrationPoints(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label
              className="text-xs font-mono uppercase tracking-wider block mb-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {t('admin.leaderboard.points_attendance')}
            </label>
            <input
              type="number"
              min={0}
              value={attendancePoints}
              onChange={(e) => setAttendancePoints(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label
              className="text-xs font-mono uppercase tracking-wider block mb-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {t('admin.leaderboard.points_per_waste_kg')}
            </label>
            <input
              type="number"
              min={0}
              value={perWasteKgPoints}
              onChange={(e) => setPerWasteKgPoints(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {hasPointChanges && (
          <div className="flex justify-end">
            <button
              onClick={handleSavePointSettings}
              disabled={updateSettingMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                background: 'var(--accent-green)',
                color: 'var(--bg-primary)',
              }}
            >
              {updateSettingMutation.isPending
                ? t('admin.leaderboard.saving')
                : t('admin.leaderboard.save_points')}
            </button>
          </div>
        )}
      </div>

      {/* Award points form */}
      <form
        onSubmit={handleAward}
        className="p-4 rounded-lg space-y-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
      >
        <h3
          className="text-sm font-medium flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <Plus size={16} />
          {t('admin.leaderboard.award_points')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <select
              value={selectedUserId ?? ''}
              onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">{t('admin.leaderboard.select_user')}</option>
              {users?.users
                .filter((u) => u.role !== 'super_admin' && u.role !== 'admin')
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email ?? user.unionId}
                  </option>
                ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <input
              type="number"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              placeholder={t('admin.leaderboard.points')}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div className="md:col-span-3">
            <input
              type="text"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder={t('admin.leaderboard.reason')}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={awardMutation.isPending || !selectedUserId || !pointsInput || !reasonInput}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                background: 'var(--accent-green)',
                color: 'var(--bg-primary)',
              }}
            >
              {t('admin.leaderboard.award')}
            </button>
          </div>
        </div>
      </form>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.leaderboard.search')}
          className="w-full rounded-lg pl-10 pr-4 py-2 text-sm"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-surface-light)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Leaderboard list */}
      {isLoading ? (
        <div style={{ color: 'var(--text-secondary)' }}>{t('leaderboard.loading')}</div>
      ) : filtered?.length === 0 ? (
        <div
          className="p-8 text-center rounded-lg"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-surface-light)',
            color: 'var(--text-secondary)',
          }}
        >
          {t('leaderboard.empty')}
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-surface-light)',
          }}
        >
          {filtered?.map((leader) => (
            <div
              key={leader.userId}
              className="flex items-center gap-4 p-4"
              style={{ borderBottom: '1px solid var(--bg-surface-light)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background:
                    leader.rank === 1
                      ? '#FFD700'
                      : leader.rank === 2
                      ? '#C0C0C0'
                      : leader.rank === 3
                      ? '#CD7F32'
                      : 'var(--bg-surface-light)',
                  color: leader.rank <= 3 ? '#000' : 'var(--text-secondary)',
                }}
              >
                {leader.rank}
              </div>
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-surface-light)' }}
              >
                <Avatar src={leader.avatar} name={leader.name} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {leader.name}
                </p>
                <p
                  className="text-xs flex items-center gap-1"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <Users size={12} />
                  {leader.attendedCount} {t('leaderboard.campaigns_attended')}
                </p>
              </div>
              <div
                className="flex items-center gap-1 text-sm font-bold"
                style={{ color: 'var(--accent-green-light)' }}
              >
                <Trophy size={14} />
                {leader.totalPoints}
              </div>
              <button
                onClick={() => {
                  if (leader.userId) {
                    setSelectedUserId(leader.userId);
                    setReasonInput('');
                  }
                }}
                disabled={!leader.userId}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-30"
                style={{
                  background: 'rgba(58,90,42,0.3)',
                  color: 'var(--accent-green-light)',
                }}
              >
                <Award size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
