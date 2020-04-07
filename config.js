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
  dbOptions.connectionString = process.env.DATABASE_URL + `?ssl=true&sslfactory=org.postgresql.ssl.NonValidatingFactory`;
  dbOptions.ssl = true;
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
  const dbPassword = fs.readFileSync(`dbPassword.txt`, `utf8`).trim();
  dbOptions.connectionString = `pg://postgres:${dbPassword}@localhost:5432/AdsSubscribeBot`;
}

const config = {
  isDeploy: isDeploy,
  dbOptions: dbOptions,
  botOptions: botOptions,
  botHook: botHook
}

console.log(dbOptions);

module.exports = config;
