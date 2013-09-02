build: 
	browserify -r ./index.js -r underscore -o shuffle.js
	cat shuffle.js | uglifyjs --mangle --compress -o shuffle.min.js
	cat shuffle.min.js | gzip | wc -c