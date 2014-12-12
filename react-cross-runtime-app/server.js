var exec = require('child_process').exec
var path = require('path')

var express = require('express')
var superagent = require('superagent')

var app = express()
var pkg = require('./package.json')

app.use(express.logger())
app.use(express.json())
app.use(app.router)
app.use(express.compress())
app.use(express.static(path.join(__dirname, './dist/browser')))
app.use(express.errorHandler({dumpExceptions: true, showStack: true }))

app.post('/proxy', function(req, res, next) {
  superagent.get(req.body.url)
    .auth(req.body.username, req.body.password)
    .accept('json')
    .end(function(err, apiRes) {
      if (err) { return next(err) }
      res.status(apiRes.status)
      res.type('json')
      res.send(apiRes.text)
    })
})

var port = process.env.PORT || 3000
var host = process.env.HOST || '0.0.0.0'
app.listen(port, host)
console.log(pkg.name + ' dev server listening on http://' + host + ':' + port)
