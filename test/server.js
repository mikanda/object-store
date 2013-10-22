
/**
 * Module dependencies.
 */

var fs = require('fs')
  , express = require('express')
  , Builder = require('component-builder')
  , writeFile = fs.writeFileSync;

/**
 * Module exports.
 */

var app = module.exports = express();
app.set('view engine', 'jade');
app.set('views', __dirname);
app.use(function(req, res, next){
  var builder = new Builder('.');
  builder.development();
  builder.copyAssetsTo('test');
  builder.build(function(err, res){
    if (err) return next(err);
    writeFile('test/build.js', res.require + res.js);
    writeFile('test/build.css', res.css);
    next();
  });
});
app.use(express.static(__dirname));

/**
 * GET index.
 */

app.get('/', function(req, res){
  res.render('index');
});

// kickoff
app.listen(3000, function(){
  console.log('server listening on port 3000');
});
