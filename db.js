const log = require(`./log.js`);
const config = require(`./config.js`);
const pg = require(`pg`);
const pool = new pg.Pool(config.dbOptions);

async function makeQuery(query) {
  let result;
  const promise = pool
  .query(query)
  .then(response => result = response)
  .catch(error =>  console.log(`Query error: `, error))
  await promise; // будет ждать, пока промис не выполнится
  return result;
}

function getUsers() {
  const query = `SELECT * FROM users;`;
  return makeQuery(query);
}

function createUser(chatID, userObj) {
  const query = `INSERT INTO users (chatID, userobj) VALUES (${chatID}, '${JSON.stringify(userObj)}');`;
  makeQuery(query);
  log.created();
}

function updateUser(chatID, userObj) {
  const query = `UPDATE users SET userobj = '${JSON.stringify(userObj)}' WHERE chatID = ${chatID};`;
  makeQuery(query);
  log.updated();
}

function deleteUser(chatID) {
  const query = `DELETE FROM users WHERE chatID = ${chatID};`;
  makeQuery(query);
  log.deleted();
}

const db = {
  getUsers: getUsers,
  createUser: createUser,
  updateUser: updateUser,
  deleteUser: deleteUser
};

module.exports = db;
