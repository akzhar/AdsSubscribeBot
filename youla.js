const jsdom = require(`jsdom`);
const { JSDOM } = jsdom;

const SELECTOR = {
  elem: `div[class^=SerpSnippet_snippetContent__]`,
  link: `a[class^=SerpSnippet_name__]`,
  date: `div[class^=SerpSnippet_actualDate__]`,
  price: `div[class^=SerpSnippet_price__]`
};
const SORTBY_DATE_PARAM = `&searchOrder=3`;

function getYoulaUrl(url, page) {
  if (!url.includes(`?`)) url = `${url}?`;
  return `${url}${SORTBY_DATE_PARAM}&page=${page}`;
}

function getYoulaNewItems(html, knownAds) {
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
  return item.querySelector(SELECTOR.link).href;
}

function getItemDate(item) {
  const del = `Обновлено<!-- --> <!-- -->`;
  const date = item.querySelector(SELECTOR.date).innerHTML.trim();
  return date.replace(del, ``)
}

function getItemPrice(item) {
  return item.querySelector(SELECTOR.price).innerHTML.trim() + ` ₽`;
}

const youla = {
  getYoulaUrl: getYoulaUrl,
  getYoulaNewItems: getYoulaNewItems
};

module.exports = youla;
