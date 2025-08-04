import { Router, Request, Response, NextFunction } from 'express';


import userAuthMiddleware from '../../middleware/userAuthMiddleware';
import { upload } from '../../middleware/uploadMiddleware';

import { PostController } from '../../controllers/PostController';


import { PostService } from '../../../useCase/postOperations';
import { IPostService } from '../../../useCase/interfaces/IPostService';
import { PostRepository } from '../../../data/repositories/PostRepository';
import { IPostRepository } from '../../../data/interfaces/IPostRepository';
import { AuthenticatedPostRequest } from '../../../core/domain/interfaces/IAuthenticatedPostRequest';
import { ICommentRepository } from '../../../data/interfaces/ICommentRepository';
import { CommentRepository } from '../../../data/repositories/CommentRepository';
import { UserRepository } from '../../../data/repositories/UserRepository';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import SubscriptionRepository from '../../../data/repositories/SubscriptionRepository';
import { ISubscriptionRepository } from '../../../data/interfaces/ISubscriptionRepository';

const router = Router();

// Initialize repositories and services
const postRepository: IPostRepository = new PostRepository();
const userRepository: IUserRepository = new UserRepository()
const subscriptionRepo: ISubscriptionRepository = new SubscriptionRepository()

const postService: IPostService = new PostService(postRepository,userRepository,subscriptionRepo);
const commentService: ICommentRepository = new CommentRepository();
const postController = new PostController(postService, commentService);

// Routes
router.post(
  '/upload',
  userAuthMiddleware.authenticate,
  upload.array('mediaUrls', 5), // Accepts both images and videos
  (req: Request, res: Response, next: NextFunction) =>
    postController
      .createPost(req as unknown as AuthenticatedPostRequest, res)
      .catch(next),
);

router.get(
  '/',
  userAuthMiddleware.authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    postController
      .getPosts(req as unknown as AuthenticatedPostRequest, res)
      .catch(next),
);
router.get('/:id', (req: Request, res: Response, next: NextFunction) =>
  postController
    .getPost(req as unknown as AuthenticatedPostRequest, res)
    .catch(next),
);

router.put(
  '/update/:id',
  userAuthMiddleware.authenticate,
  upload.array('mediaUrls', 5), // Accepts both images and videos
  (req: Request, res: Response, next: NextFunction) =>
    postController
      .updatePost(req as unknown as AuthenticatedPostRequest, res)
      .catch(next),
);

router.delete(
  '/:id',
  userAuthMiddleware.authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    postController
      .deletePost(req as unknown as AuthenticatedPostRequest, res)
      .catch(next),
);

router.patch(
  '/:id/like',
  userAuthMiddleware.authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    postController
      .likePost(req as unknown as AuthenticatedPostRequest, res)
      .catch(next),
);
router.patch(
  '/:id/unlike',
  userAuthMiddleware.authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    postController
      .unlikePost(req as unknown as AuthenticatedPostRequest, res)
      .catch(next),
);

router.get('/user/:id', (req: Request, res: Response, next: NextFunction) =>
  postController.getUserPosts(req as any, res).catch(next),
);
router.post(
  '/:id/report',
  userAuthMiddleware.authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    postController
      .reportPost(req as unknown as AuthenticatedPostRequest, res)
      .catch(next),
);


router.get(
  '/:id/comments',
  (req, res, next) => {
    console.log('Route hit: /:id/comments', req.params.id);
    next();
  },
  userAuthMiddleware.authenticate,
  (req, res, next) => {
    console.log('Authentication successful');
    postController
      .getPostComments(req as unknown as AuthenticatedPostRequest, res)
      .catch(next);
  },
);

router.post(
  '/generate-hashtags',
  userAuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      await postController.generateHashtags(req, res);
    } catch (err) {
      next(err);
    }
  },

  router.get(
    "/search/hashtag/:hashtag",
    userAuthMiddleware.authenticate,
    (req: Request, res: Response, next: NextFunction) =>
      postController
        .searchPostsByHashtags(req, res)
        .catch(next),
  ),
);

export default router;
