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
        chat_id INT NOT NULL,
        user_obj TEXT NOT NULL,
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
    return await this._makeQuery(`
      SELECT chat_id, user_obj FROM users;
    `);
  }

  async hasUser(chatId: number) {
    const res = await this._makeQuery(`
      SELECT COUNT(*) FILTER(WHERE chat_id = '${chatId}') FROM users;
    `);
    if (res?.rows[0].count === '0') {
      throw new Error('User does not exists in database');
    }
  }

  async createUser(chatId: number, user: User) {
    return await this._makeQuery(`
      INSERT INTO users (chat_id, user_obj) VALUES (${chatId}, '${JSON.stringify(user)}');
    `);
  }

  async updateUser(chatId: number, user: User) {
    return await this._makeQuery(`
      UPDATE users SET user_obj = '${JSON.stringify(user)}' WHERE chat_id = ${chatId};
    `);
  }

  async deleteUser(chatId: number) {
    return await this._makeQuery(`
      DELETE FROM users WHERE chat_id = ${chatId};
    `);
  }

}

export default DatabaseService;
