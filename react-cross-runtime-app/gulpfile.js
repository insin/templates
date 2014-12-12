var fs = require('fs')

var beep = require('beepbeep')
var browserify = require('browserify')
var del = require('del')
var gulp = require('gulp')
var gutil = require('gulp-util')
var source = require('vinyl-source-stream')

var concat = require('gulp-concat')
var jshint = require('gulp-jshint')
var minifyCSS = require('gulp-minify-css')
var plumber = require('gulp-plumber')
var react = require('gulp-react')
var rename = require('gulp-rename')
var streamify = require('gulp-streamify')
var template = require('gulp-template')
var uglify = require('gulp-uglify')

var RUNTIMES = ['browser', 'hta']

var pkg = require('./package.json')
var runtime = gutil.env.runtime || 'browser'
if (RUNTIMES.indexOf(runtime) == -1) {
  throw new Error('Invalid runtime: "' + runtime + '". Must be one of: ' +
                  RUNTIMES.join(', '))
}
var production = gutil.env.production

var cssSrcFiles = './public/css/style.css'
var cssExt = (production ? 'min.css' : 'css')

var jsSrcFiles = './src/**/*.js*'
var jsBuildFiles = './build/modules/**/*.js'
var jsExt = (production ? 'min.js' : 'js')

process.env.RUNTIME = runtime
process.env.NODE_ENV = (production ? 'production' : 'development')
process.env.VERSION = pkg.version

/** Prepare all deps */
gulp.task('deps', ['css-deps', 'js-deps'])

/** Build an external bundle containing all dependencies of app.js */
gulp.task('js-deps', function() {
  var b = browserify({detectGlobals: false})
  b.require('react')
  b.require('superagent')
  b.transform('envify')

  return b.bundle()
    .pipe(source('deps.js'))
    .pipe(gulp.dest('./build'))
    .pipe(rename('deps.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('./build'))
})

/** Bundle all CSS dependencies into deps.css */
gulp.task('css-deps', function() {
  gulp.src('./vendor/css/*.css')
    .pipe(concat('deps.css'))
    .pipe(gulp.dest('./build'))
    .pipe(rename('deps.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./build'))
})

/** Delete everything from /build/modules */
gulp.task('clean-modules', function(cb) {
  del('./build/modules/**', cb)
})

/** Transpile JSX to JavaScript and run ES6 transforms on all code. */
gulp.task('transpile-js', ['clean-modules'], function() {
  return gulp.src(jsSrcFiles)
    .pipe(plumber())
    .pipe(react({
      harmony: true // Enable ES6 transforms
    }))
    .pipe(gulp.dest('./build/modules'))
})

/** Lint everything in /build/modules */
gulp.task('lint', ['transpile-js'], function() {
  return gulp.src(jsBuildFiles)
    .pipe(jshint('./.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
})

var broken = false
var needsFixed = false

/** Bundle app.js */
gulp.task('bundle-js', ['lint'], function() {
  var b = browserify('./build/modules/app.js', {
    debug: runtime == 'browser' && !production
  , detectGlobals: false
  })
  b.external('react')
  b.external('superagent')
  b.transform('envify')

  var stream = b.bundle()
    .on('error', function(err) {
      gutil.log(err.message)
      beep(2, 0)
      broken = true
      this.emit('end')
    })
    .on('end', function() {
      if (broken) {
        needsFixed = true
      }
      else if (needsFixed) {
        beep()
        needsFixed = false
      }
      broken = false
    })
    .pipe(source('app.js'))
    .pipe(gulp.dest('./build'))

  if (production) {
    stream = stream
      .pipe(rename('app.min.js'))
      .pipe(streamify(uglify()))
      .pipe(gulp.dest('./build'))
  }

  return stream
})

/* Copy CSS to /build and minify */
gulp.task('minify-css', function() {
  return gulp.src('./public/css/style.css')
    .pipe(gulp.dest('./build'))
    .pipe(rename('style.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./build'))
})

/** Delete everything from the appropriate /dist subdirectory */
gulp.task('clean-dist', function(cb) {
  del('./dist/' + runtime, cb)
})

/** Copy CSS and JavaScript to /dist for browser builds */
gulp.task('copy-dist', ['clean-dist', 'bundle-js', 'minify-css'], function(cb) {
  if (runtime == 'browser') {
    var sources = ['./build/*.' + jsExt, './build/*.' + cssExt]
    if (!production) {
      sources = sources.concat(['!./build/*.min.js', '!./build/*.min.css'])
    }
    return gulp.src(sources).pipe(gulp.dest('./dist/browser'))
  }
  cb()
})

/** Template the appropriate file for the target runtime */
gulp.task('dist', ['copy-dist'], function() {
  if (runtime == 'browser') {
    gulp.src('./templates/index.html')
      .pipe(template({
        cssExt: cssExt
      , jsExt: jsExt
      }))
      .pipe(gulp.dest('./dist/browser'))
  }
  // For the HTA version, copy all CSS and JS directly into the .hta template
  // for a single file to distribute.
  if (runtime == 'hta') {
    gulp.src('./templates/' + pkg.name + '.hta')
      .pipe(template({
        css: fs.readFileSync('./build/style.' + cssExt)
      , cssDeps: fs.readFileSync('./build/deps.' + cssExt)
      , js: fs.readFileSync('./build/app.' + jsExt)
      , jsDeps: fs.readFileSync('./build/deps.' + jsExt)
      }))
      .pipe(gulp.dest('./dist/hta'))
  }
})

/** Rebuild and redistribute on changes */
gulp.task('watch', function() {
  gulp.watch([jsSrcFiles, './public/css/*.css','./templates/*'], ['dist'])
})

gulp.task('default', ['dist', 'watch'])