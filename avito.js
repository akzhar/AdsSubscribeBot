const utils = require(`./utils.js`);
const needle = require(`needle`);
const parseHTML = require(`node-html-parser`).parse;

const BY_DATE_CODE = 104;
const PAGE_COUNT = 3;
const SITE = `https://www.avito.ru`;
const SELECTOR = {
  elem: `.item`,
  link: `.snippet-link`,
  date: `.snippet-date-info`,
  subway: `.item-address-georeferences-item__content`,
  distance: `.item-address-georeferences-item__after`,
  price: `.snippet-price`
};

function getURL(config) {
  const lastParam = (config.type) ? `/${config.type}` : ``;
  return `${SITE}/${config.city}/${config.category}/prodam/${config.obj}${lastParam}?cd=1&pmax=${config.pmax}&pmin=${config.pmin}&s=${BY_DATE_CODE}`
}

function retrieveData(options) {
  let results = [];
  for (let page = 1; page <= PAGE_COUNT; page++) {
    results = [];
    const params = {
      follow_max: 5, // Number of redirects to follow
      proxy: `https://62.112.118.14:8080` // Russian proxy for Avito
    };
    needle(`get`, options.url, null, params)
      .then((response) => {
        utils.logServerResponse(response);
        const html = response.body;
        const newItems = getAvitoData(html, options);
        if (newItems.length) results = [...results, ...newItems];
        if (page === PAGE_COUNT) printResults(results, options);
      })
      .catch((error) => {throw error});
  }
}

function getAvitoData(html, options) {
  const items = parseHTML(html).querySelectorAll(SELECTOR.elem);
  let newItems = [];
  items.forEach((item) => {
    let newItem = getNewItem(item, options);
    if (newItem) newItems.push(newItem);
  });
  return newItems;
}

function getNewItem(item, options) {
  const subway = getSubway(item);
  const distance = getDistance(item);
  const price = getPrice(item);
  const link = getLink(item);
  const id = item.id;
  const key = `${subway}|${distance}|${price}|${link}|${id}`;
  const date = getDate(item);

  if (!options.unique.has(key)) {
    options.unique.add(key);
    const condition = (options.metro === `*`) ? true : options.metro.some((station) => subway.toLowerCase().indexOf(station.toLowerCase()) !== -1);
    if (condition) {
      const newItem = {
        date: date,
        subway: subway,
        distance: distance,
        price: price,
        link: link
      };
      return newItem;
    }
  }
}

function getLink(item) {
  const HREF = `href="/`;
  const linkAttrs = item.querySelector(SELECTOR.link).rawAttrs;
  const link = linkAttrs.slice(linkAttrs.indexOf(HREF) + HREF.length, linkAttrs.indexOf(`target`) - 3)
  return `${SITE}/${link}`;
}

function getDate(item) {
  return item.querySelector(SELECTOR.date).rawText.trim();
}

function getSubway(item) {
  const subwayElem = item.querySelector(SELECTOR.subway);
  return (subwayElem) ? subwayElem.rawText.trim() : `N/A`;
}

function getDistance(item) {
  const distanceElem = item.querySelector(SELECTOR.distance);
  return (distanceElem) ? distanceElem.rawText.replace(/\s+/g, ' ').trim() : `N/A`;
}

function getPrice(item) {
  return item.querySelector(SELECTOR.price).rawText.replace(/\s+/g, ' ').trim();
}

function printResults(results, options) {
  utils.sendSearchResults(results.length, options.bot, options.chatId)
  utils.logSearchResults(results.length, options.unique);
  setTimeout(() => {
    if (results.length) {
      results.forEach((item) => {
        utils.sendNewItemInfo(item, options.bot, options.chatId);
        utils.logNewItemInfo(item);
      })
    }
  }, 3000);
  setTimeout(() => {
    utils.sendFrequency(options.frequency, options.bot, options.chatId);
    utils.logFrequency(options.frequency);
    utils.logDashedline();
  }, 5000);
}

const avito = {
  getURL: getURL,
  retrieveData: retrieveData
};

module.exports = avito;

// function test() {
//   const options = {
//     chatId: null,
//     bot: null,
//     url: getURL({
//       city: `sankt-peterburg`,
//       category: `kvartiry`,
//       obj: `2-komnatnye`,
//       type: `vtorichka`,
//       pmin: 0,
//       pmax: 7000000
//     }),
//     metro: ['автово','озерки','нарвская','славы','девяткино','просвещения'],
//     frequency: 1,
//     unique: new Set()
//   };

//   retrieveData(options);
// }

// test();
