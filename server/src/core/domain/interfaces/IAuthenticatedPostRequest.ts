import { IUser } from './IUser';

export interface AuthenticatedPostRequest extends Request {
  params: any;
  query: any;
  user?: IUser;
  files?: Express.Multer.File;
}