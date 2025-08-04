import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/appStore/AuthStore';
import AddParticipant from './ParticipantManager';
import { groupService } from '@/services/gropuService';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftCircleIcon } from '@heroicons/react/24/solid';
import { chatSocket as socket } from '@/utils/chatSocket';
import { toast } from 'react-toastify';
import GroupParticipantsView from './GroupParticipantsView';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

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
  // const isCreateMode = !groupData;

  const isCreateMode = useLocation().pathname === '/home/community/create';
  const isEditMode = useLocation().pathname === '/home/community/:communityId/edit';
  console.log(isCreateMode, 'isCreateMode');
  
  const isAdmin = user?._id === groupData?.creatorId._id;
  console.log(isAdmin, 'isAdmin');
  const [editMode, setEditMode] = useState(isCreateMode);
  const [name, setName] = useState(groupData?.name || '');
  const [description, setDescription] = useState(groupData?.description || '');
  const [cover, setCover] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(groupData?.coverImageUrl || '');
  const [iconPreview, setIconPreview] = useState(groupData?.iconUrl || '');
  const [showParticipants, setShowParticipants] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const canEdit = editMode && (isAdmin || isCreateMode);

  


  // Cover preview effect
  useEffect(() => {
    if (cover) setCoverPreview(URL.createObjectURL(cover));
    return () => cover && URL.revokeObjectURL(coverPreview);
  }, [cover]);

  // Icon preview effect
  useEffect(() => {
    if (icon) setIconPreview(URL.createObjectURL(icon));
    return () => icon && URL.revokeObjectURL(iconPreview);
  }, [icon]);

  // Save handler
  const handleSave = async () => {
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
        toast.success('Group updated successfully');
     
      } else {
       let res = await groupService.createGroup(formData);
       console.log(res.group._id,'res');
        const navigateId = res.group._id;
        toast.success('Group created successfully');
           navigate(`/home/community/${navigateId}/edit`);
      }
      setEditMode(false);
      // queryClient.invalidateQueries({ queryKey: ['groups'] });
      onClose?.();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
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
      {canEdit&& (
        <Input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />
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
          <>
            <Input type="file" accept="image/*" onChange={(e) => setIcon(e.target.files?.[0] || null)} />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
            />
          </>
        ) : (
          <h2 className="text-xl font-bold">{groupData?.name}</h2>
        )}
      </div>

      {/* Description */}
      {canEdit   ? (
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of the group"
        />
      ) : (
        <p className="text-gray-700 dark:text-gray-300">{description}</p>
      )}

      {/* Creator Info */}
      {!editMode && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Created by <strong>{groupData?.creatorId?.username || 'Unknown'}</strong> on{' '}
          <span>{groupData?.createdAt ? new Date(groupData.createdAt).toLocaleString() : 'N/A'}</span>
        </div>
      )}

      {/* Admin-only Actions */}
     <div className="flex gap-3 flex-wrap">
  {/* Show Save / Cancel in Edit Mode or Create Mode */}
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

  {/* Show Edit/Add buttons only for admins (and not in edit/create mode) */}
  {isAdmin && !editMode && (
    <>
      <Button onClick={() => setEditMode(true)}>✏️ Edit Group</Button>
      <Button
        variant="outline"
        onClick={() => {
          if (!groupData?._id) {
            toast.error('Create group first');
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
        showTitle={false}
        layout="vertical"
      />
    </div>
  );
};

export default GroupDetails;
