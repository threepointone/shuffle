require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"1SmzYX":[function(require,module,exports){
"use strict";
var _ = require('fn'),
    morpheus = require('morpheus'),
    easing = function(pos) {
        return (-Math.cos(pos * Math.PI) / 2) + 0.5;
    };

module.exports = shuffle;

var zero = 0;
var one = 1;

function shuffle(el, options) {
    options = options || {};

    var compare = options.compare || _.identity;
    var sort = options.sort;
    var union = options.union || false;
    var replace = _.isValue(options.replace) ? options.replace : true;
    var duration = options.duration || function() {
            return (Math.random() * 800) + 200;
        };

    var selector = options.selector;

    var selectNodes = function() {
        return _.filter((selector ? el.querySelectorAll(selector) : el.childNodes), function(el) {
            return !el.__clone__;
        });
    };

    return {
        add: function(nodes) {
            var children = selectNodes();

            var toAdd = _.filter(nodes, function(node) {
                return !_.find(children, function(child) {
                    return compare(child) === compare(node);
                });
            });

            var toLeave = _.filter(children, function(child) {
                return !_.find(nodes, function(node) {
                    return compare(child) === compare(node);
                });
            });

            var toMove = _.filter(children, function(child) {
                return !!_.find(nodes, function(node) {
                    return compare(child) === compare(node);
                });
            });

            // and, let's do the insert
            var queue = [];

            if (!union) {
                _.each(toLeave, function(child) {
                    var clone = absclone(child);
                    child.parentNode.appendChild(clone);
                    glass(child);
                    queue.push(function() {
                        child.parentNode.removeChild(child);
                    });

                    setTimeout(function() {
                        var out = options.out ? options.out(child) : {
                            top: -500 + Math.random() * 1500,
                            left: -500 + Math.random() * 1500
                        };
                        morpheus(clone, {
                            top: out.top,
                            left: out.left,
                            opacity: zero,
                            easing: easing,
                            duration: duration(),
                            complete: function() {
                                clone.parentNode.removeChild(clone);
                            }
                        });
                    }, Math.random() * 200);
                });
            } else {
                // just move them around
                _.each(toLeave, function(child) {
                    var clone = absclone(child);
                    clone.style.opacity = one;

                    glass(child);

                    child.parentNode.appendChild(clone);

                    var m = margin(child);
                    queue.push(function() {
                        setTimeout(function() {
                            morpheus(clone, {
                                top: child.offsetTop - m.top,
                                left: child.offsetLeft - m.left,
                                easing: easing,
                                duration: duration(),
                                complete: function() {
                                    clone.parentNode.removeChild(clone);
                                    wood(child);
                                }

                            });
                        }, Math.random() * 200);

                    });
                });
            }

            _.each(toMove, function(child) {

                if (replace) {
                    var m = margin(child),
                        childClone = absclone(child),
                        node = _.find(nodes, function(node) {
                            return compare(node) === compare(child);
                        }),
                        nodeClone = absclone(node);

                    _.extend(nodeClone.style, {
                        opacity: zero,
                        top: (child.offsetTop - m.top) + 'px',
                        left: (child.offsetLeft - m.left) + 'px'
                    });

                    glass(node);
                    glass(child);

                    child.parentNode.appendChild(node);

                    child.parentNode.appendChild(nodeClone);
                    child.parentNode.appendChild(childClone);
                    var target = swap(child, node);

                    queue.push(function() {
                        setTimeout(function() {
                            var m = margin(node);

                            var opts = {
                                top: target.offsetTop - m.top,
                                left: target.offsetLeft - m.left,
                                easing: easing,
                                duration: duration()
                            };

                            morpheus(childClone, _.extend({}, opts, {
                                opacity: zero,
                                complete: function() {
                                    childClone.parentNode.removeChild(childClone);
                                    wood(child);
                                }
                            }));

                            morpheus(nodeClone, _.extend({}, opts, {
                                opacity: one,
                                complete: function() {
                                    nodeClone.parentNode.removeChild(nodeClone);
                                    wood(target);
                                }
                            }));
                        }, Math.random() * 200);
                    })
                } else {
                    var clone = absclone(child);
                    glass(child);
                    el.appendChild(clone);
                    queue.push(function() {
                        setTimeout(function() {
                            var m = margin(child);
                            clone.animation = morpheus(clone, {
                                top: child.offsetTop - m.top,
                                left: child.offsetLeft - m.left,
                                easing: easing,
                                duration: duration(),
                                complete: function() {
                                    clone.parentNode.removeChild(clone);
                                    wood(child);
                                }
                            });
                        }, Math.random() * 200);

                    });
                }


            });

            _.each(toAdd, function(node) {
                var clone = absclone(node);
                var _in = options._in ? options._in(node) : {
                    top: (-500 + Math.random() * 1500),
                    left: (-500 + Math.random() * 1500)
                };
                _.extend(clone.style, {
                    top: _in.top + 'px',
                    left: _in.left + 'px'
                });

                glass(clone);
                glass(node);
                el.appendChild(clone);
                el.appendChild(node);

                queue.push(function() {
                    setTimeout(function() {
                        var m = margin(node);
                        morpheus(clone, {
                            opacity: one,
                            top: node.offsetTop - m.top,
                            left: node.offsetLeft - m.left,
                            easing: easing,
                            duration: duration(),
                            complete: function() {
                                clone.parentNode.removeChild(clone);
                                wood(node);
                            }
                        });
                    }, Math.random() * 200);
                });
            });

            // sort
            _.each(sortBy(selectNodes(), sort || function(el) {
                return _.indexOf(nodes, el);
            }), function(ele) {
                el.appendChild(ele);
            });
            // run the stuff in queue
            _.each(queue, function(f) {
                f();
            });
        },

        fromString: function(str) {
            var div = document.createElement('div');
            div.innerHTML = str;
            return this.add(div.childNodes);
        }
    };
};

// herlpers

function swap(older, newer) {
    if (older === newer) {
        return older;
    }
    var parent = older.parentNode;
    parent.insertBefore(newer, older);
    parent.removeChild(older);
    return newer;
}

function glass(el) {
    el.style.opacity = zero;
}

function wood(el) {
    el.style.opacity = one;
}

function margin(el) {
    var style = el.currentStyle || window.getComputedStyle(el);
    return {
        top: parseInt(style.marginTop, 10),
        left: parseInt(style.marginLeft, 10)
    };
}

function absclone(el) {
    var clone = el.cloneNode(true);
    var m = margin(el);

    _.extend(clone.style, {
        position: 'absolute',
        top: (el.offsetTop - m.top) + 'px',
        left: (el.offsetLeft - m.left) + 'px'
    });

    clone.className += ' clone';
    clone.__clone__ = true; // a little hint for anyone else to ignore this. 

    return clone;
}

function sortBy(obj, value, context) {
    var iterator = (typeof value === 'function') ? value : function(obj) {
            return obj[value];
        };
    var sorted = _.map(obj, function(value, index, list) {
        return {
            value: value,
            index: index,
            criteria: iterator.call(context, value, index, list)
        };
    }).sort(function(left, right) {
        var a = left.criteria;
        var b = right.criteria;
        if (a !== b) {
            if (a > b || a === void 0) return 1;
            if (a < b || b === void 0) return -1;
        }
        return left.index < right.index ? -1 : 1;
    })

    return _.map(sorted, function(el) {
        return el.value
    });
}
},{"fn":"vLmZuc","morpheus":5}],"./index.js":[function(require,module,exports){
module.exports=require('1SmzYX');
},{}],"vLmZuc":[function(require,module,exports){
// fair caveat, this is code collected from various places, and I don't have tests yet. YET.

"use strict";

module.exports = {
    isValue: isValue,
    identity: identity,
    indexOf: indexOf,
    keys: keys,
    values: values,
    isArray: isArray,
    toArray: toArray,
    each: each,
    extend: extend,
    map: map,
    times: times,
    invoke: invoke,
    filter: filter,
    find: find,
    reduce: reduce,
    debounce: debounce,
    compose: compose,
    chain: chain
};

var slice = [].slice,
    has = {}.hasOwnProperty,
    toString = {}.toString;

function isValue(v) {
    return v != null;
}

function identity(x) {
    return x;
}

function indexOf(arr, obj) {
    if (arr.indexOf) {
        return arr.indexOf(obj);
    }
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i] === obj) {
            return i;
        }
    }
    return -1;
}

function keys(obj) {
    if (obj !== Object(obj)) {
        throw new TypeError('Invalid object');
    }
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) {
            keys.push(key);
        }
    }
    return keys;
}

function values(obj) {
    var values = [];
    for (var key in obj) {
        if (has.call(obj, key)) {
            values.push(obj[key]);
        }
    }
    return values;
}

function isArray(obj) {
    if (Array.isArray) {
        return Array.isArray(obj);
    }
    return toString.call(obj) === '[object Array]';
}

function toArray(obj) {
    if (!obj) {
        return [];
    }
    if (isArray(obj)) {
        return slice.call(obj);
    }
    if (obj.length === +obj.length) {
        return map(obj, identity);
    }
    return values(obj);
}

function each(obj, fn) {
    if (isArray(obj)) {
        for (var i = 0, j = obj.length; i < j; i++) {
            fn(obj[i], i);
        }
    } else {
        for (var prop in obj) {
            if (has.call(obj, prop)) {
                fn(obj[prop], prop);
            }
        }
    }
}

function extend(obj) {
    var args = slice.call(arguments, 1);
    each(args, function(arg) {
        each(arg, function(val, prop) {
            obj[prop] = val;
        });
    });
    return obj;
}

function map(obj, fn) {
    var arr = [];
    each(obj, function(v, k) {
        arr.push(fn(v, k));
    });
    return arr;
}

function times(n, fn) {
    var arr = [];
    for (var i = 0; i < n; i++) {
        arr[i] = fn(i);
    }
    return arr;
}

function invoke(obj, fnName) {
    var args = slice.call(arguments, 2);
    return map(obj, function(v) {
        return v[fnName].apply(v, args);
    });
}

function filter(arr, fn) {
    var ret = [];
    for (var i = 0, j = arr.length; i < j; i++) {
        if (fn(arr[i], i)) {
            ret.push(arr[i]);
        }
    }
    return ret;
}

function find(arr, fn) {
    for (var i = 0, j = arr.length; i < j; i++) {
        if (fn(arr[i], i)) {
            return arr[i];
        }
    }
    return null;
}

function reduce(arr, fn, initial) {
    var idx = 0;
    var len = arr.length;
    var curr = arguments.length === 3 ? initial : arr[idx++];

    while (idx < len) {
        curr = fn.call(null, curr, arr[idx], ++idx, arr);
    }
    return curr;
}

function debounce(func, wait, immediate) {
    var result;
    var timeout = null;
    return function() {
        var context = this,
            args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
            }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(context, args);
        }
        return result;
    };
}

function compose() {
    var funcs = arguments;
    return function() {
        var args = arguments;
        each(funcs, function(fn) {
            args = [fn.apply(this, args)];
        });
        return args[0];
    };
}

// chaining, à la underscore

function chain(obj) {
    if (!(this instanceof chain)) {
        return new chain(obj);
    }
    this._obj = obj;
}

each(module.exports, function(fn, name) {
    chain.prototype[name] = function() {
        this._obj = fn.apply(this, [this._obj].concat(slice.call(arguments, 0)));
        return this;
    };
});

chain.prototype.val = function() {
    return this._obj;
};
},{}],"fn":[function(require,module,exports){
module.exports=require('vLmZuc');
},{}],5:[function(require,module,exports){
/*!
  * Morpheus - A Brilliant Animator
  * https://github.com/ded/morpheus - (c) Dustin Diaz 2011
  * License MIT
  */
!function (name, definition) {
  if (typeof define == 'function') define(definition)
  else if (typeof module != 'undefined') module.exports = definition()
  else this[name] = definition()
}('morpheus', function () {

  var doc = document
    , win = window
    , perf = win.performance
    , perfNow = perf && (perf.now || perf.webkitNow || perf.msNow || perf.mozNow)
    , now = perfNow ? function () { return perfNow.call(perf) } : function () { return +new Date() }
    , html = doc.documentElement
    , thousand = 1000
    , rgbOhex = /^rgb\(|#/
    , relVal = /^([+\-])=([\d\.]+)/
    , numUnit = /^(?:[\+\-]=?)?\d+(?:\.\d+)?(%|in|cm|mm|em|ex|pt|pc|px)$/
    , rotate = /rotate\(((?:[+\-]=)?([\-\d\.]+))deg\)/
    , scale = /scale\(((?:[+\-]=)?([\d\.]+))\)/
    , skew = /skew\(((?:[+\-]=)?([\-\d\.]+))deg, ?((?:[+\-]=)?([\-\d\.]+))deg\)/
    , translate = /translate\(((?:[+\-]=)?([\-\d\.]+))px, ?((?:[+\-]=)?([\-\d\.]+))px\)/
      // these elements do not require 'px'
    , unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1, transform: 1}

  // which property name does this browser use for transform
  var transform = function () {
    var styles = doc.createElement('a').style
      , props = ['webkitTransform', 'MozTransform', 'OTransform', 'msTransform', 'Transform']
      , i
    for (i = 0; i < props.length; i++) {
      if (props[i] in styles) return props[i]
    }
  }()

  // does this browser support the opacity property?
  var opasity = function () {
    return typeof doc.createElement('a').style.opacity !== 'undefined'
  }()

  // initial style is determined by the elements themselves
  var getStyle = doc.defaultView && doc.defaultView.getComputedStyle ?
    function (el, property) {
      property = property == 'transform' ? transform : property
      property = camelize(property)
      var value = null
        , computed = doc.defaultView.getComputedStyle(el, '')
      computed && (value = computed[property])
      return el.style[property] || value
    } : html.currentStyle ?

    function (el, property) {
      property = camelize(property)

      if (property == 'opacity') {
        var val = 100
        try {
          val = el.filters['DXImageTransform.Microsoft.Alpha'].opacity
        } catch (e1) {
          try {
            val = el.filters('alpha').opacity
          } catch (e2) {}
        }
        return val / 100
      }
      var value = el.currentStyle ? el.currentStyle[property] : null
      return el.style[property] || value
    } :
    function (el, property) {
      return el.style[camelize(property)]
    }

  var frame = function () {
    // native animation frames
    // http://webstuff.nfshost.com/anim-timing/Overview.html
    // http://dev.chromium.org/developers/design-documents/requestanimationframe-implementation
    return win.requestAnimationFrame  ||
      win.webkitRequestAnimationFrame ||
      win.mozRequestAnimationFrame    ||
      win.msRequestAnimationFrame     ||
      win.oRequestAnimationFrame      ||
      function (callback) {
        win.setTimeout(function () {
          callback(+new Date())
        }, 17) // when I was 17..
      }
  }()

  var children = []

  function has(array, elem, i) {
    if (Array.prototype.indexOf) return array.indexOf(elem)
    for (i = 0; i < array.length; ++i) {
      if (array[i] === elem) return i
    }
  }

  function render(timestamp) {
    var i, count = children.length
    // if we're using a high res timer, make sure timestamp is not the old epoch-based value.
    // http://updates.html5rocks.com/2012/05/requestAnimationFrame-API-now-with-sub-millisecond-precision
    if (perfNow && timestamp > 1e12) timestamp = now()
    for (i = count; i--;) {
      children[i](timestamp)
    }
    children.length && frame(render)
  }

  function live(f) {
    if (children.push(f) === 1) frame(render)
  }

  function die(f) {
    var rest, index = has(children, f)
    if (index >= 0) {
      rest = children.slice(index + 1)
      children.length = index
      children = children.concat(rest)
    }
  }

  function parseTransform(style, base) {
    var values = {}, m
    if (m = style.match(rotate)) values.rotate = by(m[1], base ? base.rotate : null)
    if (m = style.match(scale)) values.scale = by(m[1], base ? base.scale : null)
    if (m = style.match(skew)) {values.skewx = by(m[1], base ? base.skewx : null); values.skewy = by(m[3], base ? base.skewy : null)}
    if (m = style.match(translate)) {values.translatex = by(m[1], base ? base.translatex : null); values.translatey = by(m[3], base ? base.translatey : null)}
    return values
  }

  function formatTransform(v) {
    var s = ''
    if ('rotate' in v) s += 'rotate(' + v.rotate + 'deg) '
    if ('scale' in v) s += 'scale(' + v.scale + ') '
    if ('translatex' in v) s += 'translate(' + v.translatex + 'px,' + v.translatey + 'px) '
    if ('skewx' in v) s += 'skew(' + v.skewx + 'deg,' + v.skewy + 'deg)'
    return s
  }

  function rgb(r, g, b) {
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)
  }

  // convert rgb and short hex to long hex
  function toHex(c) {
    var m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    return (m ? rgb(m[1], m[2], m[3]) : c)
      .replace(/#(\w)(\w)(\w)$/, '#$1$1$2$2$3$3') // short skirt to long jacket
  }

  // change font-size => fontSize etc.
  function camelize(s) {
    return s.replace(/-(.)/g, function (m, m1) {
      return m1.toUpperCase()
    })
  }

  // aren't we having it?
  function fun(f) {
    return typeof f == 'function'
  }

  function nativeTween(t) {
    // default to a pleasant-to-the-eye easeOut (like native animations)
    return Math.sin(t * Math.PI / 2)
  }

  /**
    * Core tween method that requests each frame
    * @param duration: time in milliseconds. defaults to 1000
    * @param fn: tween frame callback function receiving 'position'
    * @param done {optional}: complete callback function
    * @param ease {optional}: easing method. defaults to easeOut
    * @param from {optional}: integer to start from
    * @param to {optional}: integer to end at
    * @returns method to stop the animation
    */
  function tween(duration, fn, done, ease, from, to) {
    ease = fun(ease) ? ease : morpheus.easings[ease] || nativeTween
    var time = duration || thousand
      , self = this
      , diff = to - from
      , start = now()
      , stop = 0
      , end = 0

    function run(t) {
      var delta = t - start
      if (delta > time || stop) {
        to = isFinite(to) ? to : 1
        stop ? end && fn(to) : fn(to)
        die(run)
        return done && done.apply(self)
      }
      // if you don't specify a 'to' you can use tween as a generic delta tweener
      // cool, eh?
      isFinite(to) ?
        fn((diff * ease(delta / time)) + from) :
        fn(ease(delta / time))
    }

    live(run)

    return {
      stop: function (jump) {
        stop = 1
        end = jump // jump to end of animation?
        if (!jump) done = null // remove callback if not jumping to end
      }
    }
  }

  /**
    * generic bezier method for animating x|y coordinates
    * minimum of 2 points required (start and end).
    * first point start, last point end
    * additional control points are optional (but why else would you use this anyway ;)
    * @param points: array containing control points
       [[0, 0], [100, 200], [200, 100]]
    * @param pos: current be(tween) position represented as float  0 - 1
    * @return [x, y]
    */
  function bezier(points, pos) {
    var n = points.length, r = [], i, j
    for (i = 0; i < n; ++i) {
      r[i] = [points[i][0], points[i][1]]
    }
    for (j = 1; j < n; ++j) {
      for (i = 0; i < n - j; ++i) {
        r[i][0] = (1 - pos) * r[i][0] + pos * r[parseInt(i + 1, 10)][0]
        r[i][1] = (1 - pos) * r[i][1] + pos * r[parseInt(i + 1, 10)][1]
      }
    }
    return [r[0][0], r[0][1]]
  }

  // this gets you the next hex in line according to a 'position'
  function nextColor(pos, start, finish) {
    var r = [], i, e, from, to
    for (i = 0; i < 6; i++) {
      from = Math.min(15, parseInt(start.charAt(i),  16))
      to   = Math.min(15, parseInt(finish.charAt(i), 16))
      e = Math.floor((to - from) * pos + from)
      e = e > 15 ? 15 : e < 0 ? 0 : e
      r[i] = e.toString(16)
    }
    return '#' + r.join('')
  }

  // this retreives the frame value within a sequence
  function getTweenVal(pos, units, begin, end, k, i, v) {
    if (k == 'transform') {
      v = {}
      for (var t in begin[i][k]) {
        v[t] = (t in end[i][k]) ? Math.round(((end[i][k][t] - begin[i][k][t]) * pos + begin[i][k][t]) * thousand) / thousand : begin[i][k][t]
      }
      return v
    } else if (typeof begin[i][k] == 'string') {
      return nextColor(pos, begin[i][k], end[i][k])
    } else {
      // round so we don't get crazy long floats
      v = Math.round(((end[i][k] - begin[i][k]) * pos + begin[i][k]) * thousand) / thousand
      // some css properties don't require a unit (like zIndex, lineHeight, opacity)
      if (!(k in unitless)) v += units[i][k] || 'px'
      return v
    }
  }

  // support for relative movement via '+=n' or '-=n'
  function by(val, start, m, r, i) {
    return (m = relVal.exec(val)) ?
      (i = parseFloat(m[2])) && (start + (m[1] == '+' ? 1 : -1) * i) :
      parseFloat(val)
  }

  /**
    * morpheus:
    * @param element(s): HTMLElement(s)
    * @param options: mixed bag between CSS Style properties & animation options
    *  - {n} CSS properties|values
    *     - value can be strings, integers,
    *     - or callback function that receives element to be animated. method must return value to be tweened
    *     - relative animations start with += or -= followed by integer
    *  - duration: time in ms - defaults to 1000(ms)
    *  - easing: a transition method - defaults to an 'easeOut' algorithm
    *  - complete: a callback method for when all elements have finished
    *  - bezier: array of arrays containing x|y coordinates that define the bezier points. defaults to none
    *     - this may also be a function that receives element to be animated. it must return a value
    */
  function morpheus(elements, options) {
    var els = elements ? (els = isFinite(elements.length) ? elements : [elements]) : [], i
      , complete = options.complete
      , duration = options.duration
      , ease = options.easing
      , points = options.bezier
      , begin = []
      , end = []
      , units = []
      , bez = []
      , originalLeft
      , originalTop

    if (points) {
      // remember the original values for top|left
      originalLeft = options.left;
      originalTop = options.top;
      delete options.right;
      delete options.bottom;
      delete options.left;
      delete options.top;
    }

    for (i = els.length; i--;) {

      // record beginning and end states to calculate positions
      begin[i] = {}
      end[i] = {}
      units[i] = {}

      // are we 'moving'?
      if (points) {

        var left = getStyle(els[i], 'left')
          , top = getStyle(els[i], 'top')
          , xy = [by(fun(originalLeft) ? originalLeft(els[i]) : originalLeft || 0, parseFloat(left)),
                  by(fun(originalTop) ? originalTop(els[i]) : originalTop || 0, parseFloat(top))]

        bez[i] = fun(points) ? points(els[i], xy) : points
        bez[i].push(xy)
        bez[i].unshift([
          parseInt(left, 10),
          parseInt(top, 10)
        ])
      }

      for (var k in options) {
        switch (k) {
        case 'complete':
        case 'duration':
        case 'easing':
        case 'bezier':
          continue
        }
        var v = getStyle(els[i], k), unit
          , tmp = fun(options[k]) ? options[k](els[i]) : options[k]
        if (typeof tmp == 'string' &&
            rgbOhex.test(tmp) &&
            !rgbOhex.test(v)) {
          delete options[k]; // remove key :(
          continue; // cannot animate colors like 'orange' or 'transparent'
                    // only #xxx, #xxxxxx, rgb(n,n,n)
        }

        begin[i][k] = k == 'transform' ? parseTransform(v) :
          typeof tmp == 'string' && rgbOhex.test(tmp) ?
            toHex(v).slice(1) :
            parseFloat(v)
        end[i][k] = k == 'transform' ? parseTransform(tmp, begin[i][k]) :
          typeof tmp == 'string' && tmp.charAt(0) == '#' ?
            toHex(tmp).slice(1) :
            by(tmp, parseFloat(v));
        // record original unit
        (typeof tmp == 'string') && (unit = tmp.match(numUnit)) && (units[i][k] = unit[1])
      }
    }
    // ONE TWEEN TO RULE THEM ALL
    return tween.apply(els, [duration, function (pos, v, xy) {
      // normally not a fan of optimizing for() loops, but we want something
      // fast for animating
      for (i = els.length; i--;) {
        if (points) {
          xy = bezier(bez[i], pos)
          els[i].style.left = xy[0] + 'px'
          els[i].style.top = xy[1] + 'px'
        }
        for (var k in options) {
          v = getTweenVal(pos, units, begin, end, k, i)
          k == 'transform' ?
            els[i].style[transform] = formatTransform(v) :
            k == 'opacity' && !opasity ?
              (els[i].style.filter = 'alpha(opacity=' + (v * 100) + ')') :
              (els[i].style[camelize(k)] = v)
        }
      }
    }, complete, ease])
  }

  // expose useful methods
  morpheus.tween = tween
  morpheus.getStyle = getStyle
  morpheus.bezier = bezier
  morpheus.transform = transform
  morpheus.parseTransform = parseTransform
  morpheus.formatTransform = formatTransform
  morpheus.easings = {}

  return morpheus

});

},{}]},{},[])
;