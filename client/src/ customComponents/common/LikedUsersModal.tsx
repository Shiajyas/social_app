import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FollowBtn from "../FollowBtn";
import { useAuthStore } from "@/appStore/AuthStore";
import { c } from "node_modules/vite/dist/node/moduleRunnerTransport.d-DJ_mE5sf";
const LikedUsersModal = ({
  users,
  onClose,
  currentUserId,
}: {
  users: any[];
  onClose: () => void;
  currentUserId: string;
}) => {

 
    const {user : currentUser} = useAuthStore();
  const navigate = useNavigate();

  const handleUserClick = (userId: string) => {
    onClose();
    navigate(`/home/profile/${userId}`);
  };

  console.log("current user",currentUser)

// useEffect(() => {
//   if (!users?.length || !currentUser) return;

//   setIsFollowing(
//     users.some((u) => {
//       const id = u?._id;
//       console.log("id",id)
//     console.log("current user",currentUser.followers)
//       return (
//         // currentUser.following?.includes(id) 
//         currentUser.following?.includes(id)
//       );
//     })
//   );
// }, [users, currentUser]);


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-sm p-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2 mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Liked by
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Users List */}
        <div className="max-h-60 overflow-y-auto">
          {users.length > 0 ? (
            users.map((user) => (
              <div
                key={user?._id}
                className="flex items-center justify-between gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {/* Avatar + Name */}
                <div
                  onClick={() => handleUserClick(user._id)}
                  className="flex items-center gap-2 cursor-pointer"
                >

                  <img
                    src={user?.avatar || "/default-avatar.png"}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-gray-800 dark:text-gray-200">
                    
                  {user._id !== currentUser?._id ? user?.username : "You"}
                  </span>
                </div>

                {/* Follow Button (hide if current user is same as listed user) */}
        
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No likes yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikedUsersModal;
