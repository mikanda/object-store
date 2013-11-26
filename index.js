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

  // removal is already scheduled if refcount is 0
  if (object.refs > 0) {
    object.refs -= 1;
    remove();
  }

  /**
   * Remove the object if refcount is 0.
   */

  function remove(notimeout) {
    if (object._timeout) {
      clearTimeout(object._timeout);
      object._timeout = null;
    }
    if (object.refs === 0) {
      if (notimeout) return self.destroy(id);
      object._timeout = setTimeout(function(){
        delete object._timeout;
        remove(true);
      }, self._timeout);
    }
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
      each(res, function(object, i){

        // check if model has been loaded during own request
        if (self.has(uncached[i])) {

          // overwrite given object with stored
          object = self._store[uncached[i]];
        } else {

          // create new entry in the store
          var o = { object: object, refs: 1 };
          self._store[uncached[i]] = o;
        }

        // insert result models at right positions.
        var index = indices[i];
        ids[index] = object;
      });
      cb.call(self, null, ids);
    });
  }
};

/**
 * Check if the heap has a model.
 */

Store.prototype.has = function(id){
  var object = this._store[id];
  return (object || false) && object.refs > 0;
};

/**
 * Remove model from the store and emit remove event.
 */

Store.prototype.destroy = function(id){
  if (!this._store[id]) return;
  var entry = this._store[id];
  delete this._store[id];
  this.emit('remove', entry.object);
};
