const fs = require(`fs`);
const agent = require('socks5-https-client/lib/Agent');

const isDeploy = false;

const token = fs.readFileSync(`save/token.txt`, `utf8`).trim();
const debugChatID = fs.readFileSync(`save/debugChatID.txt`, `utf8`).trim();
let dbOptions = {};
let botOptions = {};
let botHook = ``;

if (isDeploy) {
  const herokuAppUrl = fs.readFileSync(`save/herokuAppUrl.txt`, `utf8`).trim();
  const externalUrl = process.env.CUSTOM_ENV_VARIABLE || herokuAppUrl
  botOptions = {
    webHook: {
      port: process.env.PORT || 443,
      host: `0.0.0.0`
    }
  };
  botHook = `${externalUrl}:443/bot${token}`;
  const dbName = fs.readFileSync(`save/dbName_production.txt`, `utf8`).trim();
  const dbPassword = fs.readFileSync(`save/dbPassword_production.txt`, `utf8`).trim();
  dbOptions.connectionString = `postgres://${dbName}:${dbPassword}@balarama.db.elephantsql.com:5432/${dbName}`;
} else {
  const proxyToTelegram = fs.readFileSync(`save/proxyToTelegram.txt`, `utf8`).trim(); // запрос через иностранный прокси на Telegram
  botOptions = {
    request: {
      agentClass: agent,
      agentOptions: {
        socksHost: proxyToTelegram.slice(0, proxyToTelegram.indexOf(`:`)),
        socksPort: +proxyToTelegram.slice(proxyToTelegram.indexOf(`:`) + 1)
      }
    },
    polling: true
  };
  const dbName = fs.readFileSync(`save/dbName_local.txt`, `utf8`).trim();
  const dbPassword = fs.readFileSync(`save/dbPassword_local.txt`, `utf8`).trim();
  dbOptions.connectionString = `pg://${dbName}:${dbPassword}@localhost:5432/AdsSubscribeBot`;
}

const config = {
  token: token,
  debugChatID: debugChatID,
  isDeploy: isDeploy,
  dbOptions: dbOptions,
  botOptions: botOptions,
  botHook: botHook
}

module.exports = config;
