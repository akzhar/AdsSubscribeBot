import LoggerService from '@services/logger';
import WebService from '@services/web';
import DatabaseService from '@services/database';

import Bot from './Bot';
import { SITES } from './sites';

const { NODE_ENV, TELEGRAM_API_TOKEN, TELEGRAM_SRVC_CHAT_ID, APP_HOST, APP_PORT, DB_URL } = process.env;

const mode = (NODE_ENV === 'production') ? NODE_ENV : 'development';

if (!TELEGRAM_API_TOKEN) throw new Error('Telegram API token was not provided...');
if (!TELEGRAM_SRVC_CHAT_ID) throw new Error('Telegram service chat ID was not provided...');
if (!APP_HOST && mode === 'production') throw new Error('App host was not provided...');
if (!APP_PORT && mode === 'production') throw new Error('App port was not provided...');
if (!DB_URL) throw new Error('Database url was not provided...');

const host = APP_HOST || 'localhost';
const port = APP_PORT || '3000';

(async () => {
  const logger = new LoggerService(mode);
  const web = new WebService(SITES, logger);
  const db = new DatabaseService(DB_URL, logger);
  await db.init();
  const bot = new Bot(mode, db, logger, web, { token: TELEGRAM_API_TOKEN, host, port }, +TELEGRAM_SRVC_CHAT_ID);
  bot.run();
})();

// async function runUsersQueriesFromDB() {
//   let response = await db.getUsers();
//   response.rows.forEach(user => {
//     users[user.chatId] = JSON.parse(user.userobj);
//   });
//   logger.allUsers(users);
//   if (getObjSize(users)) {
//     log.rerun();
//     for(let chatId in users) {
//       const requests = users[chatId].requests;
//       for(let siteName in requests) {
//         if (requests.hasOwnProperty(siteName) && getObjSize(requests[siteName])) {
//           for(let requestName in requests[siteName]) {
//             if (requests[siteName].hasOwnProperty(requestName)) {
//               logger.request(requestName, siteName, chatId, users);
//               doSiteRequest(siteName, requestName, chatId);
//             }
//           }
//         }
//       }
//     }
//   }
// }

// runUsersQueriesFromDB();

// log.start();
