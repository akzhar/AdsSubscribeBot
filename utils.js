debug = (obj) => {
  return JSON.stringify(obj, null, 4);
}

getObjSize = (obj) => {
    let size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
}

getTimestamp = () => {
  const now = new Date();
  return `[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}]`;
}

const utils = {
  debug: debug,
  getObjSize: getObjSize,
  getTimestamp: getTimestamp
};

module.exports = utils;
