import { Request, Response } from 'express';

import { ResponseMessages,HttpStatus } from '../../infrastructure/constants/constants';

 export class GroupController {
   constructor(private readonly _GroupService: any) {}

   async createGroup(req: Request, res: Response): Promise<void> {
  try {
    const files = req.files as {
      [fieldname: string]: Express.MulterS3.File[];
    };

    const groupData = req.body;

    if (files?.coverImage?.[0]) {
      groupData.coverImageUrl = files.coverImage[0].location;
    }

    if (files?.iconImage?.[0]) {
      groupData.iconUrl = files.iconImage[0].location;
    }

    const group = await this._GroupService.createGroup(groupData);
    res.status(HttpStatus.CREATED).json({ message: ResponseMessages.GROUP_CREATED, group });
  } catch (error) {
    console.error('❌ createGroup error:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.INTERNAL_SERVER_ERROR });
  }
}

async updateGroup(req: Request, res: Response): Promise<void> {
  try {
    const groupId = req.params.groupId;
    const groupData = req.body;

    const files = req.files as {
      [fieldname: string]: Express.MulterS3.File[];
    };

    console.log('files', files);

    if (files?.coverImage?.[0]) {
      groupData.coverImageUrl = files.coverImage[0].location;
    }

    if (files?.iconImage?.[0]) {
      groupData.iconUrl = files.iconImage[0].location;
    }

    const updatedGroup = await this._GroupService.updateGroup(groupId, groupData);
    res.status(HttpStatus.OK).json({ message: ResponseMessages.GROUP_UPDATED, group: updatedGroup });
  } catch (error) {
    console.error('❌ updateGroup error:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.INTERNAL_SERVER_ERROR });
  }
}

   async getGroups(req: Request, res: Response): Promise<void> {
     try {
       const groups = await this._GroupService.getGroups();
       console.log(groups, 'groups');
       res.status(HttpStatus.OK).json(groups);
     } catch (error) {
        console.log(error, 'error');
       res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.INTERNAL_SERVER_ERROR });
     }
   }

   async deleteGroup(req: Request, res: Response): Promise<void> {
    console.log(req.params.id, 'req.params.id');
     try {
       const groupId = req.params.id;
       await this._GroupService.deleteGroup(groupId);
       res.status(HttpStatus.OK).json({ message: ResponseMessages.GROUP_DELETED });
     } catch (error) {
        console.log(error, 'error');
       res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.INTERNAL_SERVER_ERROR });
     }
   }

   async getUserGroups(req: Request, res: Response): Promise<void> {
    console.log(req.params.id, 'req.params.id');
     try {
       const userId = req.params.id;
       const groups = await this._GroupService.getUserGroups(userId);
       res.status(HttpStatus.OK).json(groups);
     } catch (error) {
        console.log(error, 'error');
       res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.INTERNAL_SERVER_ERROR });
     }
   }

async getGroupMessages(req: Request, res: Response): Promise<void> {
  try {
    const { communityId, before, limit } = req.query;

    if (!communityId || typeof communityId !== "string") {
      res.status(400).json({ message: "Missing or invalid communityId" });
      return;
    }

    const messages = await this._GroupService.getGroupMessages(
      communityId,
      typeof before === "string" ? before : undefined,
      limit ? parseInt(limit as string, 10) : 20
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ message: "Failed to fetch group messages" });
  }
}

 
 }