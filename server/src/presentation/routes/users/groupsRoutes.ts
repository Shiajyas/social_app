// routes/groupRoutes.ts
import { Router } from "express";
import userAuthMiddleware from "../../middleware/userAuthMiddleware";
import { upload } from "../../middleware/uploadMiddleware";

import { GroupController } from "../../controllers/GroupController";
import { IGroupService } from "../../../useCase/interfaces/IGroupService";
import { IGroupRepository } from "../../../data/interfaces/IGroupRepository";
import { GroupRepository } from "../../../data/repositories/GroupRepository";
import { GroupService } from "../../../useCase/GroupServiceUsecase";

import { Server as SocketIOServer } from "socket.io";
import { IGroupMessageRepository } from "../../../data/interfaces/IGroupMessageRepository";
import { GroupMessageRepository } from "../../../data/interfaces/MessageRepository";

export const groupRoutes = (io: SocketIOServer) => {
  const router = Router();

  const groupMessageRepository : IGroupMessageRepository = new GroupMessageRepository()
  // Dependency Injection
  const groupRepository: IGroupRepository = new GroupRepository();
  const groupService: IGroupService = new GroupService(groupRepository,groupMessageRepository, io);
  const groupController = new GroupController(groupService);

  // 🔹 Group CRUD Routes
  router.post(
    "/create",
    userAuthMiddleware.authenticate,
    upload.fields([
      { name: "coverImage", maxCount: 1 },
      { name: "iconImage", maxCount: 1 },
    ]),
    (req, res) => groupController.createGroup(req, res)
  );

  router.put(
    "/update/:groupId",
    userAuthMiddleware.authenticate,
    upload.fields([
      { name: "coverImage", maxCount: 1 },
      { name: "iconImage", maxCount: 1 },
    ]),
    (req, res) => groupController.updateGroup(req, res)
  );

  router.get(
    "/",
    userAuthMiddleware.authenticate,
    (req, res) => groupController.getGroups(req, res)
  );

  router.delete(
    "/:id",
    userAuthMiddleware.authenticate,
    (req, res) => groupController.deleteGroup(req, res)
  );

  router.get(
    "/user/:id",
    userAuthMiddleware.authenticate,
    (req, res) => groupController.getUserGroups(req, res)
  );

  // 🔹 Group Messages Route (Infinite Scroll)
  router.get(
    "/messages",
    userAuthMiddleware.authenticate,
    (req, res) => groupController.getGroupMessages(req, res)
  );

  return router;
};
