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
