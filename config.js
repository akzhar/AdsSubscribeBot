const fs = require(`fs`);
const agent = require('socks5-https-client/lib/Agent');

const isDeploy = true;

let dbOptions = {};
let botOptions = {};
let botHook = ``;

if (isDeploy) {
  const token = fs.readFileSync(`token.txt`, `utf8`).trim();
  const herokuAppUrl = `https://tranquil-ravine-43566.herokuapp.com`;
  const externalUrl = process.env.CUSTOM_ENV_VARIABLE || herokuAppUrl
  botOptions = {
    webHook: {
      port: process.env.PORT || 443,
      host: `0.0.0.0`
    }
  };
  botHook = `${externalUrl}:443/bot${token}`;
  const dbName = fs.readFileSync(`dbName_production.txt`, `utf8`).trim();
  const dbPassword = fs.readFileSync(`dbPassword_production.txt`, `utf8`).trim();
  dbOptions.connectionString = `postgres://${dbName}:${dbPassword}@balarama.db.elephantsql.com:5432/${dbName}`;
} else {
  const proxyToTelegram = fs.readFileSync(`proxyToTelegram.txt`, `utf8`).trim(); // запрос через иностранный прокси на Telegram
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
  const dbName = fs.readFileSync(`dbName_local.txt`, `utf8`).trim();
  const dbPassword = fs.readFileSync(`dbPassword_local.txt`, `utf8`).trim();
  dbOptions.connectionString = `pg://${dbName}:${dbPassword}@localhost:5432/AdsSubscribeBot`;
}

const config = {
  isDeploy: isDeploy,
  dbOptions: dbOptions,
  botOptions: botOptions,
  botHook: botHook
}

module.exports = config;
