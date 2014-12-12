var path = require('path')

var bodyParser = require('body-parser')
var compression = require('compression')
var errorhandler = require('errorhandler')
var express = require('express')
var logger = require('morgan')
var serveStatic = require('serve-static')
var superagent = require('superagent')

var pkg = require('./package.json')

var app = express()

app.set('port', process.env.PORT || 3000)
app.set('host', process.env.HOST || '0.0.0.0')
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(compression())
app.use(serveStatic(path.join(__dirname, './dist/browser')))

app.post('/proxy', function(req, res, next) {
  var proxyReq = superagent.get(req.body.url)
  if (req.body.username && req.body.password) {
    proxyReq.auth(req.body.username, req.body.password)
  }
  proxyReq.accept('json').end(function(err, proxyRes) {
    if (err) { return next(err) }
    res.status(proxyRes.status)
    res.type('json')
    res.send(proxyRes.text)
  })
})

if ('development' == app.get('env')) {
  app.use(errorhandler())
}

app.listen(app.get('port'), app.get('host'), function() {
  console.log(pkg.name + ' dev server listening on http://' + app.get('host') +
              ':' + app.get('port'))
})