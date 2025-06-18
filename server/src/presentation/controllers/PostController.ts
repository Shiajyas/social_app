import { Request, Response } from 'express';
import { IPostService } from '../../useCase/interfaces/IPostService';
import { getErrorMessage } from '../../infrastructure/utils/errorHelper';
import { AuthenticatedPostRequest } from '../../core/domain/interfaces/IAuthenticatedPostRequest';
import { ICommentRepository } from '../../data/interfaces/ICommentRepository';

export class PostController {
  private _PostService: IPostService;
  private _CommentService: ICommentRepository;

  constructor(postService: IPostService, commentService: ICommentRepository) {
    this._PostService = postService;
    this._CommentService = commentService;
  }

  async createPost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
    try {
      let mediaUrls: string[] = [];
      if (req.files) {
        mediaUrls = (req.files as unknown as { location: string }[]).map(
          (file) => file.location,
        );
      }

      // Ensure req.body is correctly cast
      const body = req.body as unknown as {
        title: string;
        description: string;
        visibility?: 'public' | 'private';
      };

      const { title, description, visibility = 'public' } = body; // Default to "public" if not provided

      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized access.' });
        return;
      }
      if (!mediaUrls.length) {
        res.status(400).json({ message: 'Please add photo(s).' });
        return;
      }

      const newPost = await this._PostService.createPost(
        req.user.id,
        title,
        description,
        mediaUrls,
        visibility,
      );
      res
        .status(201)
        .json({ message: 'Post created successfully.', post: newPost });
    } catch (error) {
      res.status(500).json({ message: getErrorMessage(error) });
    }
  }

  async updatePost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
    try {
      let mediaUrls: string[] = [];
      if (req.files) {
        mediaUrls = (req.files as unknown as { location: string }[]).map(
          (file: { location: string }) => file.location,
        );
      }

      let { title, description } = req.body as unknown as {
        title: string;
        description: string;
      };

      const postId = (req as unknown as Request).params.id;

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized access.' });
        return;
      }

      const updatedPost = await this._PostService.updatePost(
        postId,
        userId,
        title,
        description,
        mediaUrls,
      );
      res
        .status(200)
        .json({ message: 'Post updated successfully.', post: updatedPost });
    } catch (error) {
      res.status(500).json({ message: getErrorMessage(error) });
    }
  }

  async getPosts(req: AuthenticatedPostRequest, res: Response): Promise<void> {
    try {
      const page =
        parseInt((req as unknown as Request).query.page as string) || 1;
      const limit =
        parseInt((req as unknown as Request).query.limit as string) || 10;

      const userId = req.user?.id as string;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized access.' });
        return;
      }

      const { posts, nextPage } = await this._PostService.getPosts(
        userId,
        page,
        limit,
      );

      res.status(200).json({ message: 'Success', posts, nextPage });
    } catch (error) {
      console.error(error, '>>>>Error in getPosts Controller');

      res.status(500).json({ message: getErrorMessage(error) });
    }
  }

  async getPost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
    try {
      const post = await this._PostService.getPost(
        (req as unknown as Request).params.id,
      );

      if (!post) {
        res.status(404).json({ message: 'Post not found.' });
        return;
      }
      res.status(200).json({ post });
    } catch (error) {
      res.status(500).json({ message: getErrorMessage(error) });
    }
  }

  async deletePost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized access.' });
        return;
      }
      await this._PostService.deletePost(
        userId,
        (req as unknown as Request).params.id,
      );
      res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: getErrorMessage(error) });
    }
  }

  async likePost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized access.' });
        return;
      }
      await this._PostService.likePost(
        userId,
        (req as unknown as Request).params.id,
      );
      res.status(200).json({ message: 'Post liked successfully.' });
    } catch (error) {
      res.status(500).json({ message: getErrorMessage(error) });
    }
  }

  async unlikePost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized access.' });
        return;
      }
      await this._PostService.unlikePost(
        userId,
        (req as unknown as Request).params.id,
      );
      res.status(200).json({ message: 'Post unliked successfully.' });
    } catch (error) {
      res.status(500).json({ message: getErrorMessage(error) });
    }
  }

  async getUserPosts(req: AuthenticatedPostRequest, res: Response): Promise<void> {
    try {
      const page =
        parseInt((req as unknown as Request).query.page as string) || 1;
      const limit =
        parseInt((req as unknown as Request).query.limit as string) || 10;

      const posts = await this._PostService.getUserPosts(
        (req as unknown as Request).params.id,
        page,
        limit,
      );
      res.status(200).json({ posts });
    } catch (error) {
      res.status(500).json({ message: getErrorMessage(error) });
    }
  }

  async reportPost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized access.' });
        return;
      }
      await this._PostService.reportPost(
        userId,
        (req as unknown as Request).params.id,
      );
      res.status(200).json({ message: 'Post reported successfully.' });
    } catch (error) {
      res.status(500).json({ message: getErrorMessage(error) });
    }
  }

  async getPostComments(
    req: AuthenticatedPostRequest,
    res: Response,
  ): Promise<void> {
    try {
      const postId = (req as unknown as Request).params.id;
      if (!postId) {
        res.status(400).json({ message: 'Post ID is required' });
      }

      const page =
        parseInt((req as unknown as Request).query.page as string) || 1;
      const limit =
        parseInt((req as unknown as Request).query.limit as string) || 10;

      const comments = await this._CommentService.getCommentsForPost(
        postId,
        page,
        limit,
      );

      console.log(`✅ Fetched ${comments.length} comments for post: ${postId}`);

      res.status(200).json({ comments: comments || [] });
    } catch (error) {
      console.error('❌ Error in getPostComments Controller:', error);
      res.status(500).json({ message: getErrorMessage(error) });
    }
  }
}
