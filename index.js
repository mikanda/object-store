
/**
 * Module dependencies.
 */

var Emitter = require('emitter')
  , each = require('each');

/**
 * Module exports.
 */

module.exports = Store;

/**
 * Initialize new store.
 */

function Store(opts) {
  opts = opts || {};
  this._timeout = opts.timeout === undefined ? 30000 : opts.timeout;
  this._store = {};
}

// emitter mixin
Emitter(Store.prototype);

/**
 * Push new model or collection.
 */

Store.prototype.push = function(id, object){
  var self = this;
  if (this._store[id]) throw new Error('object exists ' + id);
  this._store[id] = { object: object, refs: 1 };
};

/**
 * Attempt to remove an object from the store.
 *
 * @param {String} id the id of the object to remove
 */

Store.prototype.remove = function(id){
  var self = this;
  var object = this._store[id];
  object.refs -= 1;
  if (object.refs === 0) {
    if (object._timeout) {
      clearTimeout(object._timeout);
    }
    object._timeout = setTimeout(function(){
      delete object._timeout;
      self.destroy(id);
    }, this._timeout);
  }
};

/**
 * Install driver.
 */

Store.prototype.use = function(driver){
  driver(this);
};

/**
 * Get a model.
 * @param {Array|String} ids
 * @param {Function} fetch
 * @param {Function} [cb]
 */

Store.prototype.get = function(ids, fetch, cb){
  if (ids.length == null) ids = [ ids ];
  var uncached = []
    , indices = []
    , self = this;

  // traverse ids to detect those which aren't yet in the store
  each(ids, function(id, index){
    if (!self._store[id]) {
      indices.push(index);
      return uncached.push(id);
    }
    var o = self._store[id];
    o.refs += 1;
    ids[index] = o.object;
  });
  if (uncached.length === 0) {

    // all objects are available: nothing to do
    if (cb) cb.call(this, null, ids);
    return ids;
  } else {

    // load uncached models by id from server
    fetch(uncached, function (err, res) {
      if (err) return cb.call(self, err);
      each(res, function(o, i){

        // create new entry in the store
        var e = { object: o, refs: 1 };
        self._store[uncached[i]] = e;

        // insert result models at right positions.
        var index = indices[i];
        ids[index] = o;
      });
      cb.call(self, null, ids);
    });
  }
};

/**
 * Check if the heap has a model.
 */

Store.prototype.has = function(id){
  return !!this._store[id];
};

/**
 * Remove model in heap, edits and all entry-collections
 */

Store.prototype.destroy = function(id){
  if (!this._store[id]) return;
  var entry = this._store[id];
  delete this._store[id];
  this.emit('remove', entry.object);
};
