// node modules
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// npm modules
var Writable = require('readable-stream').Writable;

var debug = function(){};
try{
  debug = require('debug')('StreamingElasticsearch:BulkStream');
} catch (err){}

function ElasticsearchStreamIndex(es_client, options){
  if(!(this instanceof ElasticsearchStreamIndex)){
    return new ElasticsearchStreamIndex(es_client);
  }
  Writable.call(this, { objectMode: true });
  this.es_client = es_client;
  this.highWaterMark = (options && options.highWaterMark) || 64;
  this.bulkCount = 0;
  this.arr = [];
}
util.inherits(ElasticsearchStreamIndex, Writable);

ElasticsearchStreamIndex.prototype._write = function _write(chunk, enc, next){
  debug('_write chunk', chunk);
  this.bulkCount++;
  this.arr.push(chunk);

  if(this.bulkCount >= this.highWaterMark){
    return this._bulk(next);
  }

  return next();
};

ElasticsearchStreamIndex.prototype._bulk = function _bulk(callback){
  debug('_bulk arr', this.arr.length);
  var self = this;
  var bufArray = [];
  // transform
  this.arr.forEach(function(p){
    bufArray.push({
      index: {
        _index: p.index,
        _type: p.type,
        _id: p.id
      }
    });
    bufArray.push(p.body);
  });
  debug('_bulk bufArray', bufArray.length);
  // bulk insert
  this.es_client.bulk({ body: bufArray }, function(err, resp){
    if(err){
      debug('_bulk error', err.stack);
      self.emit('error', err);
    }
    debug('_bulk resp', resp);
    
     // add fail handle
    if (resp.errors === true) {
      debug('_bulk error', resp.items);
      self.emit('fail', resp.items);
    }
    
    self.bulkCount = 0;
    self.nextChunkIsParams = false;
    self.arr = [];
    callback();
  });
};

/*
 * Defer `finish` event
 */
ElasticsearchStreamIndex.prototype.emit = function(evt){
  debug('emit evt', evt);
  var self = this;
  if(evt == 'finish'){
    debug('ElasticsearchStreamIndex onfinish, this.arr.length', this.arr.length);
    if(this.arr.length > 0){
      this._bulk(function(){
        self.emit('finish');
      });
    } else {
      EventEmitter.prototype.emit.call(this, 'finish');
    }
  } else {
    var args = Array.prototype.slice.call(arguments);
    EventEmitter.prototype.emit.apply(this, args);
  }
};

exports = module.exports = ElasticsearchStreamIndex;
