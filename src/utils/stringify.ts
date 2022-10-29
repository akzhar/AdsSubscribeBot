const stringify = (obj: { [key:string]: unknown } ) => {
  return JSON.stringify(obj, null, 4);
}

export default stringify;
