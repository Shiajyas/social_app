
import { upload } from "../../presentation/middleware/uploadMiddleware";

export const uploadGroupMedia = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'iconImage', maxCount: 1 },
]);