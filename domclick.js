const jsdom = require(`jsdom`);
const { JSDOM } = jsdom;

const SELECTOR = {
  elem: `a[class=_1X0Y9]`,
  // link: `=== elem`,
  date: `div[class^=date-]`,
  price: `p[class^=price-]`
};
const SORTBY_DATE_PARAM = `sort=published`;

function getUrl(url, page) {
  if (url.includes(`?`)) {
    url = `${url}&${SORTBY_DATE_PARAM}`;
  } else {
    if (url[url.length - 1] !== `/`) url = `${url}/`;
    url = `${url}?${SORTBY_DATE_PARAM}`;
  }
  return `${url}&offset=${page * 30}&limit=${30}`;
}

function getNewItems(html, knownAds) {
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

  if (!knownAds.hasOwnProperty(key)) {
    knownAds[key] = true;
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
  return item.querySelector(SELECTOR.date).textContent.trim();
}

function getItemPrice(item) {
  return item.querySelector(SELECTOR.price).textContent.trim();
}

const domclick = {
  getUrl: getUrl,
  getNewItems: getNewItems
};

module.exports = domclick;
