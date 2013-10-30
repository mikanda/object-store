
/**
 * Module dependencies.
 */

var chai = require('chai')
  , Store = require('object-store')
  , expect = chai.expect;

describe('ObjectStore', function(){
  describe('.get()', function(){
    it('should use the fetch function to load all objects', function(done){
      var stub = sinon.stub().callsArgWith(1, null, [ { id: '1' }, { id: '2' } ]);
      var store = new Store();
      store.get([ '1', '2' ], stub, function(err, os){
        if (err) return done(err);
        expect(os).to.eql([ { id: '1' }, { id: '2' } ]);
        expect(stub.args[0][0]).to.eql([ '1', '2' ]);
        expect([ store._store['1'].refs, store._store['2'].refs ])
          .to.eql([ 1, 1 ]);
        done();
      });
    });
    it('should use the fetch function to load some objects', function(done){
      var stub = sinon.stub().callsArgWith(1, null, [ { id: '2' } ]);
      var store = new Store();
      store._store['1'] = { object: { id: '1' }, refs: 1 };
      store.get([ '1', '2' ], stub, function(err, os){
        if (err) return done(err);
        expect(os).to.eql([ { id: '1' }, { id: '2' } ]);
        expect(stub.args[0][0]).to.eql([ '2' ]);
        expect([ store._store['1'].refs, store._store['2'].refs ])
          .to.eql([ 2, 1 ]);
        done();
      });
    });
  });
  describe('.remove()', function(){
    it('should remove the element when ref-count becomes zero', function(done){
      var stub = sinon.stub().callsArgWith(1, null, [ { id: '2' } ]);
      var store = new Store({ timeout: 500 });
      store._store['1'] = { object: { id: '1' }, refs: 1 };
      store.get([ '1', '2' ], stub, function(err, os){
        if (err) return done(err);
        store.remove('1');
        expect(store._store['1']).to.not.equal(undefined);
        expect(store._store['1'].refs).to.equal(1);
        expect(store.has('1')).to.be.true;
        store.remove('1');
        expect(store._store['1']).to.not.equal(undefined);
        expect(store._store['1'].refs).to.equal(0);
        expect(store.has('1')).to.be.false;
        setTimeout(function(){
          expect(store._store['1']).to.not.equal(undefined);
          setTimeout(function(){
            expect(store._store['1']).to.equal(undefined);
            expect(store.has('1')).to.be.false;
            done();
          }, 1);
        }, 499);
      });      
    });
  });
});
