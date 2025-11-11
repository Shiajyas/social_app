import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/appStore/AuthStore';
import AddParticipant from './ParticipantManager';
import { groupService } from '@/services/gropuService';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import GroupParticipantsView from './GroupParticipantsView';
import { useLocation, useNavigate } from 'react-router-dom';

interface GroupData {
  _id?: string;
  name: string;
  description: string;
  coverImageUrl?: string;
  iconUrl?: string;
  creatorId: { _id: string; username: string; avatar?: string };
  creatorName?: string;
  createdAt?: string;
}

interface Props {
  groupData?: GroupData;
  onClose?: () => void;
}

const GroupDetails: React.FC<Props> = ({ groupData, onClose }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Detect mode
  const isCreateMode = location.pathname === '/home/community/create';
  const isAdmin = user?._id === groupData?.creatorId?._id;
  const [editMode, setEditMode] = useState(isCreateMode);

  // Form states
  const [name, setName] = useState(groupData?.name || '');
  const [description, setDescription] = useState(groupData?.description || '');
  const [cover, setCover] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(groupData?.coverImageUrl || '');
  const [iconPreview, setIconPreview] = useState(groupData?.iconUrl || '');
  const [showParticipants, setShowParticipants] = useState(false);

  // Inline validation errors
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const canEdit = editMode && (isAdmin || isCreateMode);

  // --- Image Preview Effects ---
  useEffect(() => {
    if (cover) setCoverPreview(URL.createObjectURL(cover));
    return () => cover && URL.revokeObjectURL(coverPreview);
  }, [cover]);

  useEffect(() => {
    if (icon) setIconPreview(URL.createObjectURL(icon));
    return () => icon && URL.revokeObjectURL(iconPreview);
  }, [icon]);

  // --- Validation ---
  const validateFields = () => {
    const newErrors: any = {};

    if (!name.trim()) {
      newErrors.name = 'Group name is required.';
    } else if (name.length < 3) {
      newErrors.name = 'Group name must be at least 3 characters.';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
    }

    setErrors(newErrors);

    // Show toast for first error only (optional UX improvement)
    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey) toast.error(newErrors[firstErrorKey]);

    return Object.keys(newErrors).length === 0;
  };

  // --- Handle Save ---
  const handleSave = async () => {
    if (!validateFields()) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('creatorId', user?._id);
    if (cover) formData.append('coverImage', cover);
    if (icon) formData.append('iconImage', icon);

    try {
      setLoading(true);

      if (groupData?._id) {
        await groupService.updateGroup(groupData._id, formData);
        toast.success('Group updated successfully!');
      } else {
        const res = await groupService.createGroup(formData);
        const navigateId = res.group._id;
        toast.success('Group created successfully!');
        navigate(`/home/community/${navigateId}/edit`);
      }

      setEditMode(false);
      onClose?.();
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong while saving the group.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Cover Preview */}
      {coverPreview && (
        <img
          src={groupData?.coverImageUrl || coverPreview}
          alt="Cover"
          className="w-full h-48 object-cover rounded-lg transition hover:opacity-90"
        />
      )}
      {canEdit && (
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files?.[0] || null)}
        />
      )}

      {/* Icon + Name */}
      <div className="flex items-center gap-4">
        {iconPreview && (
          <img
            src={groupData?.iconUrl || iconPreview}
            alt="Icon"
            className="w-16 h-16 rounded-full object-cover transition hover:ring-2"
          />
        )}
        {canEdit ? (
          <div className="flex flex-col gap-2 w-full">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setIcon(e.target.files?.[0] || null)}
            />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>
        ) : (
          <h2 className="text-xl font-bold">{groupData?.name}</h2>
        )}
      </div>

      {/* Description */}
      {canEdit ? (
        <div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the group"
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description}</p>
          )}
        </div>
      ) : (
        <p className="text-gray-700 dark:text-gray-300">{description}</p>
      )}

      {/* Creator Info */}
      {!editMode && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Created by <strong>{groupData?.creatorId?.username || 'Unknown'}</strong> on{' '}
          <span>
            {groupData?.createdAt
              ? new Date(groupData.createdAt).toLocaleString()
              : 'N/A'}
          </span>
        </div>
      )}

      {/* Admin Actions */}
      <div className="flex gap-3 flex-wrap">
        {/* Save / Cancel */}
        {canEdit && editMode && (
          <>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : '💾 Save'}
            </Button>
            {!isCreateMode && (
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            )}
          </>
        )}

        {/* Edit / Add Participants */}
        {isAdmin && !editMode && (
          <>
            <Button onClick={() => setEditMode(true)}>✏️ Edit Group</Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!groupData?._id) {
                  toast.error('Please create the group first.');
                } else {
                  setShowParticipants(!showParticipants);
                }
              }}
            >
              👥 <span>Add Participants</span>
            </Button>
          </>
        )}
      </div>

      {/* Participant Manager */}
      {isAdmin && showParticipants && (
        <div className="border rounded-md p-4 mt-4">
          <AddParticipant groupId={groupData?._id} />
          <Button variant="ghost" onClick={() => setShowParticipants(false)}>
            <ArrowLeftCircleIcon className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Participant List */}
      <GroupParticipantsView
        groupId={groupData?._id || ''}
        showTitle={true}
        layout="vertical"
      />
    </div>
  );
};

export default GroupDetails;
