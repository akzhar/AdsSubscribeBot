const jsdom = require(`jsdom`);
const { JSDOM } = jsdom;

const SELECTOR = {
  elem: `div[class*=--main--]`,
  link: `a[class*=--header--]`,
  date: `div[class*=--relative--]`,
  price: `div[class*=--header--]`
};

function getUrl(url, page) {
  if (url.includes(`?`)) {
    url = `${url}&`;
  } else {
    if (url[url.length - 1] !== `/`) url = `${url}/`;
    url = `${url}?`;
  }
  return `${url}p=${page}`;
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
  return item.querySelector(SELECTOR.link).href;
}

function getItemDate(item) {
  return item.querySelector(SELECTOR.date).textContent.trim();
}

function getItemPrice(item) {
  return item.querySelector(SELECTOR.price).textContent.trim();
}

const cian = {
  getUrl: getUrl,
  getNewItems: getNewItems
};

module.exports = cian;
