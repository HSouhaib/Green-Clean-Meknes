interface PermissionMatrixProps {
  
  selected: string[];
  onChange: (selected: string[]) => void;
}

const PERMISSION_CATEGORIES: Record<string, string[]> = {
  Dashboard: ['dashboard.view'],
  Users: ['users.view', 'users.manage', 'users.edit_role'],
  Roles: ['roles.view', 'roles.manage'],
  Content: ['campaigns.view', 'campaigns.manage', 'neighborhoods.view', 'neighborhoods.manage', 'faqs.view', 'faqs.manage', 'testimonials.view', 'testimonials.manage', 'polls.view', 'polls.manage'],
  Sections: ['sections.view', 'sections.manage'],
  Settings: ['settings.view', 'settings.manage'],
  Contacts: ['contacts.view', 'contacts.manage'],
  Planning: ['plans.view', 'plans.manage'],
  System: ['activity_logs.view'],
};

export function PermissionMatrix({ selected, onChange }: PermissionMatrixProps) {
  const togglePermission = (perm: string) => {
    if (selected.includes(perm)) {
      onChange(selected.filter((p) => p !== perm));
    } else {
      onChange([...selected, perm]);
    }
  };

  const toggleCategory = (categoryPerms: string[]) => {
    const allSelected = categoryPerms.every((p) => selected.includes(p));
    if (allSelected) {
      onChange(selected.filter((p) => !categoryPerms.includes(p)));
    } else {
      const newSelected = new Set(selected);
      categoryPerms.forEach((p) => newSelected.add(p));
      onChange(Array.from(newSelected));
    }
  };

  const isCategorySelected = (categoryPerms: string[]) => {
    return categoryPerms.every((p) => selected.includes(p));
  };

  const isCategoryPartial = (categoryPerms: string[]) => {
    const selectedCount = categoryPerms.filter((p) => selected.includes(p)).length;
    return selectedCount > 0 && selectedCount < categoryPerms.length;
  };

  return (
    <div className="space-y-6">
      {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryPerms]) => (
        <div key={category}>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => toggleCategory(categoryPerms)}
              className="w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0"
              style={{
                borderColor: 'var(--bg-surface-light)',
                background: isCategorySelected(categoryPerms) ? 'var(--accent-green)' : 'transparent',
              }}
              aria-label={`Toggle ${category}`}
            >
              {isCategorySelected(categoryPerms) && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: 'white' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {isCategoryPartial(categoryPerms) && (
                <div className="w-2.5 h-0.5 rounded" style={{ background: 'var(--accent-green)' }} />
              )}
            </button>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {category}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-8">
            {categoryPerms.map((perm) => {
              const isChecked = selected.includes(perm);
              const label = perm.split('.')[1].replace(/_/g, ' ');
              return (
                <label
                  key={perm}
                  className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors min-h-[44px]"
                  style={{
                    background: isChecked ? 'var(--bg-surface)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePermission(perm)}
                    className="w-5 h-5 rounded flex-shrink-0"
                    style={{ accentColor: 'var(--accent-green)' }}
                  />
                  <span className="text-sm capitalize truncate" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
