/*
*	Task Automation to make my life easier.
*	Author: Jean-Pierre Sierens
*	===========================================================================
*/

// declarations, dependencies
// ----------------------------------------------------------------------------
var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var babelify = require('babelify');
var reactify = require('reactify');
var sass = require('gulp-ruby-sass');
var minifycss = require('gulp-minify-css');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var image = require('gulp-image');

gulp.task('styles', function() {
  return sass(['app/sass/*.scss', 'app/sass/**/*.scss'], {
    style: 'expanded',
    sourcemap: true
  })
  .on('error', sass.logError)
  .pipe(gulp.dest('app/css'))
  .pipe(minifycss())
  .pipe(concat('styles.css'))
  .pipe(rename({suffix: '.min'} ))
  .pipe(gulp.dest('web/css'));
});

gulp.task('image', function () {
  gulp.src([
    'app/assets/**/*.png',
    'app/assets/**/*.jpg',
    'app/assets/**/*.jpeg',
    'app/assets/**/*.gif',
  ])
    .pipe(image({
      pngquant: true,
      optipng: false,
      zopflipng: true,
      jpegRecompress: false,
      jpegoptim: true,
      mozjpeg: true,
      gifsicle: true,
      svgo: true,
      concurrent: 10
    }))
    .pipe(gulp.dest('web/assets'));
});

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
	'react',
	'react-dom',
  'react-redux',
  'react-router',
  'react-router-redux',
  'redux',
  'classnames'
];
// keep a count of the times a task refires
var scriptsCount = 0;

// Gulp tasks
// ----------------------------------------------------------------------------
gulp.task('scripts', function () {
    bundleApp(false);
});

gulp.task('deploy', function (){
	bundleApp(true);
});

gulp.task('watch', function () {
	gulp.watch(['./app/*.js', './app/**/*.js'], ['scripts']);
	gulp.watch(['./app/*.scss', './app/**/*.scss'], ['styles']);
});

// When running 'gulp' on the terminal this task will fire.
// It will start watching for changes in every .js file.
// If there's a change, the task 'scripts' defined above will fire.
gulp.task('default', ['scripts', 'styles', 'image', 'watch']);

// Private Functions
// ----------------------------------------------------------------------------
function bundleApp(isProduction) {
	scriptsCount++;
	// Browserify will bundle all our js files together in to one and will let
	// us use modules in the front end.
	var appBundler = browserify({
    	entries: './app/js/index.js',
      ignore: /\/node_modules\/(?!app\/)/,
      extensions: [".babel"],
    	debug: true
  	})

	// If it's not for production, a separate vendors.js file will be created
	// the first time gulp is run so that we don't have to rebundle things like
	// react everytime there's a change in the js file
  	if (!isProduction && scriptsCount === 1){
  		// create vendors.js for dev environment.
  		browserify({
			require: dependencies,
			debug: true
		})
			.bundle()
			.on('error', gutil.log)
			.pipe(source('vendors.js'))
			.pipe(gulp.dest('./web/js/'));
  	}
  	if (!isProduction){
  		// make the dependencies external so they dont get bundled by the
  		// app bundler. Dependencies are already bundled in vendor.js for
  		// development environments.
  		dependencies.forEach(function(dep){
  			appBundler.external(dep);
  		})
  	}

  	appBundler
  		// transform ES6 and JSX to ES5 with babelify
	  	.transform("babelify", {presets: ["es2015", "react"]})
	    .bundle()
	    .on('error', gutil.log)
	    .pipe(source('bundle.js'))
	    .pipe(gulp.dest('./web/js/'));
}