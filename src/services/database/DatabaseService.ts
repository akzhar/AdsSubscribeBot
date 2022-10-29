import LoggerService from '@services/logger';
import User from '@models/user/User';
import pg from 'pg';

class DatabaseService {
  static _instance: DatabaseService;
  pool!: pg.Pool;
  logger!: LoggerService;

  constructor(url: string, logger: LoggerService) {
    if (!DatabaseService._instance) {
      this.pool = new pg.Pool({ connectionString: url });
      this.logger = logger;
      DatabaseService._instance = this;
    }
    return DatabaseService._instance;
  }

  async _makeQuery(query: string) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(query);
      this.logger.info(`Database query OK: ${res.command}`);
      return res;
    } catch (err) {
      this.logger.error(`Database query NOK: ${err}`);
    } finally {
      client.release();
    }
  }

  async init() {
    return await this._makeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL,
        chatId INT NOT NULL,
        userobj TEXT NOT NULL,
        PRIMARY KEY(id)
      );
    `);
  }

  async drop() {
    return await this._makeQuery(`
      DROP TABLE IF EXISTS users;
    `);
  }

  async getUsers() {
    return await this._makeQuery(
      `SELECT * FROM users;
    `);
  }

  async createUser(chatId: number, user: User) {
    return await this._makeQuery(`
      INSERT INTO users (chatId, userobj) VALUES (${chatId}, '${JSON.stringify(user)}');
    `);
  }

  async updateUser(chatId: number, user: User) {
    return await this._makeQuery(`
      UPDATE users SET userobj = '${JSON.stringify(user)}' WHERE chatId = ${chatId};
    `);
  }

  async deleteUser(chatId: number) {
    return await this._makeQuery(`
      DELETE FROM users WHERE chatId = ${chatId};
    `);
  }

}

export default DatabaseService;
