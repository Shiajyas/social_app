import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  private _Url: string;
  private _Options: ConnectOptions;
  static _Connect: any;
  // uri: string;

  constructor() {
    this._Url=
      process.env.MONGODB_URL ||
      'mongodb+srv://shijayzoro:bREsiivT9XpjWmbG@circlify.2dub3.mongodb.net/?retryWrites=true&w=majority';
    this._Options = {};
  }

  public async connect(): Promise<void> {
    try {
      await mongoose.connect(this._Url, this._Options);
      console.log('Database Connected!!');
    } catch (err: unknown) {
      console.error('Database connection error:', err);
      process.exit(1); // Exit process with failure
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('Database Disconnected!!');
    } catch (err: unknown) {
      console.error('Database disconnection error:', err);
    }
  }
}

export default new Database();
