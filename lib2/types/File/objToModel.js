const Parse = require('parse/node');

module.exports = function typeObjToModel(obj) {
  let modelObj = null;

  if (obj.base64) {
    const fileName = obj.name || 'untitled';
    modelObj = new Parse.File(fileName, { base64: obj.base64 }, obj.type);
    // file.save()
  }

  return modelObj;
};
