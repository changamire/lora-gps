// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
// eslint-disable-next-line
function __deepFreeze(object) {
  // Retrieve the property names defined on object
  const propNames = Object.getOwnPropertyNames(object);
  // Freeze properties before freezing self
  propNames.forEach(name => {
    const value = object[name];
    // eslint-disable-next-line
    object[name] = value && typeof value === 'object' ? __deepFreeze(value) : value;
  });

  return Object.freeze(object);
}

// eslint-disable-next-line
const Config = {
  apiConfig: {
    url: 'https://56fa5zxh2k.execute-api.us-east-1.amazonaws.com/dev/',
    key: 'HIyqJJYmxj1vC7FsRprkb4pVRopGuvpi31pNR0Nj'
  }
};

__deepFreeze(Config);
