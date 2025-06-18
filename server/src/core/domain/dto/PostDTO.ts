// import { z } from 'zod';
// import { Types } from 'mongoose';
// import mongoose from 'mongoose';


// // ---------------------------
// // Create Post Schema
// // ---------------------------
// export const CreatePostSchema = z.object({
//   title: z.string().min(1, 'Title is required'),
//   description: z.string().min(1, 'Description is required'),
//   visibility: z.enum(['public', 'private']).default('public'),
//   mediaUrls: z
//     .array(z.string().url('Media must be valid URLs'))
//     .min(1, 'At least one media URL is required'),
// });

// // ---------------------------
// // Update Post Schema
// // ---------------------------
// export const UpdatePostSchema = z.object({
//   title: z.string().min(1, 'Title is required'),
//   description: z.string().min(1, 'Description is required'),
//   mediaUrls: z.array(z.string().url('Invalid media URL')).optional(),
// });

// // ---------------------------
// // Post Response DTO (For Client)
// // ---------------------------
// export interface PostResponseDTO {
//   id: string;
//   userId: string;
//   title: string;
//   description: string;
//   mediaUrls: string[];
//   visibility: 'public' | 'private';
//   commendCount: number;
//   likesCount: number;
//   commentsCount: number;
//   isSaved: boolean;
//   createdAt: string;
//   updatedAt?: string;
// }

// import { IPost } from '../interfaces/IPost';



// export const mapToPostResponseDTO = (
//   post: IPost,
//   currentUserId?: string
// ): PostResponseDTO => ({
//   id: post._id.toString(),
//   userId: post.userId.toString(),
//   title: post.title,
//   description: post.description,
//   mediaUrls: post.mediaUrls,
//   visibility: post.visibility,
//   commendCount: post.commendCount || 0,
//   likesCount: post.likes?.length || 0,
//   commentsCount: post.comments?.length || 0,
//  isSaved: currentUserId ? post.saved?.includes(new mongoose.Types.ObjectId(currentUserId)) ?? false : false,
//   createdAt: post.createdAt?.toISOString() || '',
//   updatedAt: post.updatedAt?.toISOString(),
// });
