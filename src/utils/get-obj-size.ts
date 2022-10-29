const getObjSize = (obj: { [key:string]: unknown } ) => {
  let size = 0, key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) size++;
  }
  return size;
}

export default getObjSize;
