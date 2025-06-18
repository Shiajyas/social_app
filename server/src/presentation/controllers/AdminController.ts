import { Request, Response } from 'express';
import { IAdminUseCase } from '../../useCase/interfaces/IAdminUseCase';
import { toAdminResponseDTO } from '../../core/domain/dto/toAdminResponseDTO';

export class AdminController {
  constructor(
    private readonly _AdminUseCase: IAdminUseCase
  ) {}

  createAdmin = async (req: Request, res: Response) => {
    try {
      const { email, roleName, password, userName, permissions } = req.body;
      const admin = await this._AdminUseCase.createAdmin({ email, roleName, password, userName, permissions });
      res.status(201).json({ message: 'Admin created', admin: toAdminResponseDTO(admin) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  getAllAdmins = async (_: Request, res: Response) => {
    try {
      const admins = await this._AdminUseCase.getAllAdmins();
      res.status(200).json(admins.map(toAdminResponseDTO));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  deleteAdmin = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this._AdminUseCase.deleteAdmin(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  updateAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this._AdminUseCase.updateAdmin(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Admin not found' });
        return;
      }

      res.status(200).json({ message: 'Admin updated', admin: toAdminResponseDTO(updated) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
