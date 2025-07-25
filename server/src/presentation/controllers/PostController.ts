import { Request, Response } from 'express';
import { IPostService } from '../../useCase/interfaces/IPostService';
import { getErrorMessage } from '../../infrastructure/utils/errorHelper';
import { AuthenticatedPostRequest } from '../../core/domain/interfaces/IAuthenticatedPostRequest';
import { ICommentRepository } from '../../data/interfaces/ICommentRepository';
import { StatusCode,ResponseMessages } from '../../infrastructure/constants/postconstants';

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

    const { isProUser } = req.params;

    const body = req.body as unknown as {
      title: string;
      description: string;
      visibility?: 'public' | 'private';
    };
    const { title, description, visibility = 'public' } = body;

    if (!req.user) {
      res.status(StatusCode.UNAUTHORIZED).json({ message: ResponseMessages.UNAUTHORIZED });
      return;
    }

    if (!mediaUrls.length) {
      res.status(StatusCode.BAD_REQUEST).json({ message: ResponseMessages.PHOTO_REQUIRED });
      return;
    }

    const newPost = await this._PostService.createPost(
      req.user.id,
      title,
      description,
      mediaUrls,
      visibility,
      isProUser
    );

    res.status(StatusCode.CREATED).json({
      message: ResponseMessages.POST_CREATED,
      post: newPost,
    });
  } catch (error) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
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
      res.status(StatusCode.UNAUTHORIZED).json({ message: ResponseMessages.UNAUTHORIZED });
      return;
    }
      const updatedPost = await this._PostService.updatePost(
        postId,
        userId,
        title,
        description,
        mediaUrls,
      );
    res.status(StatusCode.OK).json({
      message: ResponseMessages.POST_UPDATED,
      post: updatedPost,
    });
   } catch (error) {
     res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
   }
  }

async getPosts(req: AuthenticatedPostRequest, res: Response): Promise<void> {
  try {
    const page = parseInt((req as unknown as Request).query.page as string) || 1;
    const limit = parseInt((req as unknown as Request).query.limit as string) || 10;
    const userId = req.user?.id as string;

    if (!userId) {
      res.status(StatusCode.UNAUTHORIZED).json({ message: ResponseMessages.UNAUTHORIZED });
      return;
    }

    const { posts, nextPage } = await this._PostService.getPosts(userId, page, limit);

    res.status(StatusCode.OK).json({
      message: ResponseMessages.SUCCESS,
      posts,
      nextPage,
    });
  } catch (error) {
    console.error(error, '>>>> Error in getPosts Controller');
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}

async getPost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
  try {
    const post = await this._PostService.getPost(
      (req as unknown as Request).params.id,
    );

    if (!post) {
      res.status(StatusCode.NOT_FOUND).json({ message: ResponseMessages.POST_NOT_FOUND });
      return;
    }

    res.status(StatusCode.OK).json({ message: ResponseMessages.SUCCESS, post });
  } catch (error) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}


async deletePost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(StatusCode.UNAUTHORIZED).json({ message: ResponseMessages.UNAUTHORIZED });
      return;
    }

    await this._PostService.deletePost(
      userId,
      (req as unknown as Request).params.id,
    );

    res.status(StatusCode.OK).json({ message: ResponseMessages.POST_DELETED });
  } catch (error) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}

async likePost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(StatusCode.UNAUTHORIZED).json({ message: ResponseMessages.UNAUTHORIZED });
      return;
    }

    await this._PostService.likePost(
      userId,
      (req as unknown as Request).params.id,
    );

    res.status(StatusCode.OK).json({ message: ResponseMessages.POST_LIKED });
  } catch (error) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}



async unlikePost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(StatusCode.UNAUTHORIZED).json({ message: ResponseMessages.UNAUTHORIZED });
      return;
    }

    await this._PostService.unlikePost(userId, req.params.id);
    res.status(StatusCode.OK).json({ message: ResponseMessages.POST_UNLIKED });
  } catch (error) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}

async getUserPosts(req: AuthenticatedPostRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const posts = await this._PostService.getUserPosts(req.params.id, page, limit);
    res.status(StatusCode.OK).json({ message: ResponseMessages.SUCCESS, posts });
  } catch (error) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}

async reportPost(req: AuthenticatedPostRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(StatusCode.UNAUTHORIZED).json({ message: ResponseMessages.UNAUTHORIZED });
      return;
    }

    await this._PostService.reportPost(userId, req.params.id);
    res.status(StatusCode.OK).json({ message: ResponseMessages.POST_REPORTED });
  } catch (error) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}

async getPostComments(req: AuthenticatedPostRequest, res: Response): Promise<void> {
  try {
    const postId = req.params.id;
    if (!postId) {
      res.status(StatusCode.BAD_REQUEST).json({ message: ResponseMessages.POST_ID_REQUIRED });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const comments = await this._CommentService.getCommentsForPost(postId, page, limit);

    res.status(StatusCode.OK).json({
      message: ResponseMessages.SUCCESS,
      comments: comments || [],
    });
  } catch (error) {
    console.error('❌ Error in getPostComments Controller:', error);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}
}
