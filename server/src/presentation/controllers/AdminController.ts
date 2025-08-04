import { Request, Response } from 'express';
import { IAdminUseCase } from '../../useCase/interfaces/IAdminUseCase';
import { toAdminResponseDTO } from '../../core/domain/dto/toAdminResponseDTO';
import { HttpStatus, ResponseMessages } from '../../infrastructure/constants/constants';

export class AdminController {
  constructor(private readonly _AdminUseCase: IAdminUseCase) {}

  createAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, roleName, password, userName, permissions } = req.body;
      const admin = await this._AdminUseCase.createAdmin({ email, roleName, password, userName, permissions });
      res.status(HttpStatus.CREATED).json({
        message: ResponseMessages.ADMIN_CREATED,
        admin: toAdminResponseDTO(admin),
      });
    } catch (err: any) {
      console.error('Create admin error:', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: ResponseMessages.INTERNAL_SERVER_ERROR });
    }
  };

  getAllAdmins = async (_: Request, res: Response): Promise<void> => {
    try {
      const admins = await this._AdminUseCase.getAllAdmins();
      res.status(HttpStatus.OK).json(admins.map(toAdminResponseDTO));
    } catch (err: any) {
      console.error('Get all admins error:', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: ResponseMessages.INTERNAL_SERVER_ERROR });
    }
  };

  deleteAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this._AdminUseCase.deleteAdmin(id);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (err: any) {
      console.error('Delete admin error:', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: ResponseMessages.INTERNAL_SERVER_ERROR });
    }
  };

  updateAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: adminId} = req.params;
      const updated = await this._AdminUseCase.updateAdmin(adminId, req.body);
      if (!updated) {
        res.status(HttpStatus.NOT_FOUND).json({ error: ResponseMessages.ADMIN_NOT_FOUND });
        return;
      }

      res.status(HttpStatus.OK).json({
        message: ResponseMessages.ADMIN_UPDATED,
        admin: toAdminResponseDTO(updated),
      });
    } catch (err: any) {
      console.error('Update admin error:', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: ResponseMessages.INTERNAL_SERVER_ERROR });
    }
  };
}
