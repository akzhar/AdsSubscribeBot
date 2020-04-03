const jsdom = require(`jsdom`);
const { JSDOM } = jsdom;

const SELECTOR = {
  elem: `.item`,
  link: `.snippet-link`,
  date: `.snippet-date-info`,
  price: `.snippet-price`
};
const SORTBY_DATE_PARAM = `s=104`;

function getAvitoUrl(url, page) {
  url = (url.includes(`?`)) ? `${url}&${SORTBY_DATE_PARAM}` : `${url}?${SORTBY_DATE_PARAM}`;
  return `${url}&p=${page}`;
}

function getAvitoNewItems(html, knownAds) {
  const dom = new JSDOM(html);
  const items = dom.window.document.querySelectorAll(SELECTOR.elem);
  let newItems = [];
  items.forEach((item) => {
    let newItem = getNewItem(item, knownAds);
    if (newItem) newItems.push(newItem);
  });
  return newItems;
}

function getNewItem(item, knownAds) {
  const date = getItemDate(item);
  const price = getItemPrice(item);
  const link = getItemLink(item);

  const key = link;

  if (!knownAds.has(key)) {
    knownAds.add(key);
    const newItem = {
      date: date,
      price: price,
      link: link
    };
    return newItem;
  }
  return null;
}

function getItemLink(item) {
  const SITE = `https://www.avito.ru`;
  const link = item.querySelector(SELECTOR.link).href;
  return `${SITE}${link}`;
}

function getItemDate(item) {
  return item.querySelector(SELECTOR.date).innerHTML.trim();
}

function getItemPrice(item) {
  return item.querySelector(SELECTOR.price).innerHTML.trim();
}

const avito = {
  getAvitoUrl: getAvitoUrl,
  getAvitoNewItems: getAvitoNewItems
};

module.exports = avito;
