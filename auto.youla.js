const jsdom = require(`jsdom`);
const { JSDOM } = jsdom;

const SELECTOR = {
  elem: `article[class^=SerpSnippet_snippet_]`,
  link: `a[class^=SerpSnippet_name_]`,
  date: `div[class^=SerpSnippet_actualDate_]`,
  price: `div[class^=SerpSnippet_price_]`
};
const SORTBY_DATE_PARAM = `searchOrder=3`;

function getUrl(url, page) {
  if (url.includes(`?`)) {
    url = `${url}&${SORTBY_DATE_PARAM}`;
  } else {
    if (url[url.length - 1] !== `/`) url = `${url}/`;
    url = `${url}?${SORTBY_DATE_PARAM}`;
  }
  return `${url}&page=${page}`;
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
  const del = `Обновлено<!-- --> <!-- -->`;
  const date = item.querySelector(SELECTOR.date).textContent.trim();
  return date.replace(del, ``)
}

function getItemPrice(item) {
  return item.querySelector(SELECTOR.price).textContent.trim() + ` ₽`;
}

const youla = {
  getUrl: getUrl,
  getNewItems: getNewItems
};

module.exports = youla;
