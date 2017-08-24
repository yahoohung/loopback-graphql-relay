'use strict';

function base64(i) {
  return (new Buffer(i, 'ascii')).toString('base64');
}

function unbase64(i) {
  return (new Buffer(i, 'base64')).toString('ascii');
}

const PREFIX = 'connection.';

/**
 * Creates the cursor string from an offset.
 * @param {String} id the id to convert
 * @returns {String}   an opaque cursor
 */
function idToCursor(id) {
  return base64(PREFIX + id);
}

/**
 * Rederives the offset from the cursor string.
 * @param {String} cursor   the cursor for conversion
 * @returns {String} id   converted id
 */
function cursorToId(cursor) {
  return unbase64(cursor).substring(PREFIX.length);
}

function getId(cursor) {
  if (cursor === undefined || cursor === null) {
    return null;
  }
  return cursorToId(cursor);
}

module.exports = {
  getId,
  idToCursor,
  cursorToId,
};
