const jsdom = require(`jsdom`);
const { JSDOM } = jsdom;

const SELECTOR = {
  elem: `a[class=_1X0Y9]`,
  // link: `=== elem`,
  date: `div[class^=date-]`,
  price: `p[class^=price-]`
};
const SORTBY_DATE_PARAM = `&sort=published`;

function getDomclickUrl(url, page) {
  const limit = url.match(/(?<=limit=)\d+/)[0];
  return `${url}${SORTBY_DATE_PARAM}&offset=${page * limit}`;
}

function getDomclickNewItems(html, knownAds) {
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
  const SITE = `https://www.domclick.ru`;
  return `${SITE}${item.href}`;
}

function getItemDate(item) {
  return item.querySelector(SELECTOR.date).innerHTML.trim();
}

function getItemPrice(item) {
  return item.querySelector(SELECTOR.price).innerHTML.trim();
}

const domclick = {
  getDomclickUrl: getDomclickUrl,
  getDomclickNewItems: getDomclickNewItems
};

module.exports = domclick;
