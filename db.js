const log = require(`./log.js`);
const config = require(`./config.js`);
const pg = require(`pg`);
const pool = new pg.Pool(config.dbOptions);

// async function makeQuery(query) {
//   client.connect();
//   const promise = client.query(query);
//   let response;
//   try {
//     response = await promise; // будет ждать, пока промис не выполнится
//   } catch(error) {
//     console.log(`Query error: `, error);
//   }
//   return response;
// }

// async function makeQuery(query) {
//   let response;
//   client.connect();
//   const promise = client
//     .query(query)
//     .then(result => response = result)
//     .catch(error => console.error(`Query error: `, error))
//     .then(() => client.end())
//   // try {
//     await promise; // будет ждать, пока промис не выполнится
//   // } catch(error) {
//     // console.log(`Query error: `, error);
//   // }
//   return response;
// }

// async function makeQuery(query) {
//   let result;
//   const promise = pool
//   .connect()
//   .then(client => {
//     return client
//       .query(query)
//       .then(response => {
//         client.release()
//         result = response;
//       })
//       .catch(error => {
//         client.release()
//         console.log(`Query error: `, error)
//       })
//   })
//   await promise; // будет ждать, пока промис не выполнится
//   return result;
// }

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
  // makeQuery(query).then(response => {
  //   const result = (response.rowCount) ? true : false;
  //   log.created(result);
  // });
}

function updateUser(chatID, userObj) {
  const query = `UPDATE users SET userobj = '${JSON.stringify(userObj)}' WHERE chatID = ${chatID};`;
  makeQuery(query);
  log.updated();
  // makeQuery(query).then(response => {
  //   const result = (response.rowCount) ? true : false;
  //   log.updated(result);
  // });
}

function deleteUser(chatID) {
  const query = `DELETE FROM users WHERE chatID = ${chatID};`;
  makeQuery(query);
  log.deleted();
  // makeQuery(query).then(response => {
  //   const result = (response.rowCount) ? true : false;
  //   log.deleted(result);
  // });
}

const db = {
  getUsers: getUsers,
  createUser: createUser,
  updateUser: updateUser,
  deleteUser: deleteUser
};

module.exports = db;
