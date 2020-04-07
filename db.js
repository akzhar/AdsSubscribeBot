const log = require(`./log.js`);
const config = require(`./config.js`);
const pg = require(`pg`);
const pool = new pg.Pool(config.dbOptions);

async function makeQuery(query) {
  pool.connect();
  const promise = pool.query(query);
  let response;
  try {
    response = await promise; // будет ждать, пока промис не выполнится
  } catch(error) {
    console.log(`ERROR: `, error);
  }
  return response;
}

function getUsers() {
  const query = `SELECT * FROM users`;
  return makeQuery(query);
}

function createUser(chatID, userObj) {
  const query = `INSERT INTO users (chatID, userobj) VALUES (${chatID}, '${JSON.stringify(userObj)}')`;
  makeQuery(query).then(response => {
    const result = (response.rowCount) ? true : false;
    log.created(result);
  });
}

function updateUser(chatID, userObj) {
  const query = `UPDATE users SET userobj = '${JSON.stringify(userObj)}' WHERE chatID = ${chatID}`;
  makeQuery(query).then(response => {
    const result = (response.rowCount) ? true : false;
    log.updated(result);
  });
}

function deleteUser(chatID) {
  const query = `DELETE FROM users WHERE chatID = ${chatID}`;
  makeQuery(query).then(response => {
    const result = (response.rowCount) ? true : false;
    log.deleted(result);
  });
}

const db = {
  getUsers: getUsers,
  createUser: createUser,
  updateUser: updateUser,
  deleteUser: deleteUser
};

module.exports = db;
