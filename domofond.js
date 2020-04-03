const jsdom = require(`jsdom`);
const { JSDOM } = jsdom;

const SELECTOR = {
  elem: `a[class^=long-item-card__item]`,
  // link: `=== elem`,
  date: `span[class^=long-item-card__listDate]`,
  price: `span[class^=long-item-card__price]`
};
const SORTBY_DATE_PARAM = `&SortOrder=Newest`;

function getDomofondUrl(url, page) {
  if (!url.includes(`?`)) url = `${url}?`;
  return `${url}${SORTBY_DATE_PARAM}&Page=${page}`;
}

function getDomofondNewItems(html, knownAds) {
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
  const SITE = `https://www.domofond.ru`;
  return `${SITE}${item.href}`;
}

function getItemDate(item) {
  const del = `<!-- -->`;
  const date = item.querySelector(SELECTOR.date).innerHTML.trim();
  return date.replace(del, ``)
}

function getItemPrice(item) {
  return item.querySelector(SELECTOR.price).innerHTML.trim();
}

const domofond = {
  getDomofondUrl: getDomofondUrl,
  getDomofondNewItems: getDomofondNewItems
};

module.exports = domofond;
