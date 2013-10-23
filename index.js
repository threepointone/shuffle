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
                        var out = options.out ? options.out(clone) : {
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
                
                glass(clone);
                glass(node);
                el.appendChild(clone);
                el.appendChild(node);

                

                queue.push(function() {
                    setTimeout(function() {
                        var _in = options._in ? options._in(node) : {
                            top: (-500 + Math.random() * 1500),
                            left: (-500 + Math.random() * 1500)
                        };

                        _.extend(clone.style, {
                            top: _in.top + 'px',
                            left: _in.left + 'px'
                        });                
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