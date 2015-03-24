# ElasticsearchStreamIndex ![io.js supported](https://img.shields.io/badge/io.js-supported-green.svg?style=flat) [![Build Status](https://travis-ci.org/topdmc/ElasticsearchStreamIndex.svg?branch=master)](https://travis-ci.org/topdmc/ElasticsearchStreamIndex)

A writable stream wrapped elasticsearch index operation to bulk

# Install

`npm install elasticsearch-stream-index`

# Usage

```javascript
var ElasticsearchStreamIndex = require('../index');

var elasticsearch = require('elasticsearch');

var opt = {
  host: 'localhost:9200',
  log: 'error'
};

var es = new elasticsearch.Client(opt);

var create_stream = new ElasticsearchStreamIndex(es, { highWaterMark: 2 });
create_stream.on('finish', function(){
  console.log('---finished---');
});

var idxName = 'cc_idx', typeName = 'cc_type';

for(var i = 0; i < 10; i++){
  create_stream.write({
    index: idxName,
    type: typeName,
    id: i,
    body : {
      name: 'name _ ' + i
    }
  });
}
create_stream.end();
```
