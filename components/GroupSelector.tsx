/**
 * Group Selector Modal
 * Shown after login when user belongs to multiple groups
 */

import React, { useState } from 'react';
import { Users, Check, Star, Loader2, X } from 'lucide-react';
import { GroupMembershipResponse } from '../services';

interface GroupSelectorProps {
  groups: GroupMembershipResponse[];
  onSelect: (groupId: string, setAsDefault?: boolean) => Promise<void>;
  onDismiss: () => void;
  isLoading?: boolean;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({
  groups,
  onSelect,
  onDismiss,
  isLoading = false
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = async () => {
    if (!selectedGroup) return;

    setIsSubmitting(true);
    try {
      await onSelect(selectedGroup, setAsDefault);
    } catch (err) {
      console.error('Failed to select group:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'TREASURER':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'SECRETARY':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Select Group</h2>
                <p className="text-sm text-white/80">You belong to multiple groups</p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Group List */}
        <div className="p-4 max-h-[300px] overflow-y-auto">
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                key={group.groupId}
                onClick={() => setSelectedGroup(group.groupId)}
                disabled={isSubmitting}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedGroup === group.groupId
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-dark dark:text-white">
                        {group.groupName}
                      </span>
                      {group.isDefault && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <Star size={12} className="fill-current" />
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-subtext dark:text-gray-400">
                        {group.memberNumber}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(group.role)}`}>
                        {group.role}
                      </span>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                    selectedGroup === group.groupId
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedGroup === group.groupId && <Check size={14} />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Set as Default Option */}
        {selectedGroup && (
          <div className="px-6 pb-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                disabled={isSubmitting}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-subtext dark:text-gray-400">
                Set as my default group
              </span>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleSelect}
            disabled={!selectedGroup || isSubmitting}
            className="w-full py-3 px-6 bg-primary text-white font-medium rounded-2xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Selecting...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupSelector;
