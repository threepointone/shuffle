var _ = require('underscore'),
    morpheus = require('morpheus'),
    easing = require('./easings.js').easeOut;


var zero = 0;
var one = 1;


function show(el) {
    el.style.display = el.__display || '';
    return el;
}

function hide(el) {
    el.__display = el.style.display !== 'none' ? el.style.display : '';
    el.style.display = 'none';
    return el;
}

function replace(older, newer) {
    var parent = older.parentNode;
    parent.insertBefore(newer, older);
    parent.removeChild(older);
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
        top: parseInt(style.marginTop, 10) | 0,
        left: parseInt(style.marginLeft, 10) | 0
    };
}

function absclone(el) {
    var clone = el.cloneNode(true);
    var m = margin(el);

    clone.style.position = 'absolute';
    clone.style.top = (el.offsetTop - m.top) + 'px';
    clone.style.left = (el.offsetLeft - m.left) + 'px'

    clone.className += ' clone';

    clone.__clone__ = true; // a little hint for anyone else to ignore this. 

    return clone;
}

module.exports = function(el, options) {
    options || (options || {});


    var compare = options.compare || _.identity;
    var sort = options.sort;
    var union = options.union || false;

    return {
        add: function(nodes) {
            var children = _(el.childNodes).filter(function(el) {
                return !el.__clone__;
            });
            var toAdd = _(nodes).filter(function(node) {
                var match = _(children).find(function(child) {
                    return compare(child) === compare(node);
                });
                return !match;
            });

            var toLeave = _(children).filter(function(child) {
                var match = _(nodes).find(function(node) {
                    return compare(child) === compare(node);
                });
                return !match;
            });

            var toMove = _(children).filter(function(child) {
                var match = _(nodes).find(function(node) {
                    return compare(child) === compare(node);
                });
                return !!match;
            });

            // and, let's do the insert
            var queue = [];

            (!union) && _(toLeave).each(function(child) {
                var clone = absclone(child);
                child.parentNode.appendChild(clone);
                glass(child);
                queue.push(function() {
                    child.parentNode.removeChild(child);
                });

                setTimeout(function() {
                    clone.animation = morpheus(clone, {
                        top: -500 + Math.random() * 1500,
                        left: -500 + Math.random() * 1500,
                        opacity: zero,
                        easing: easing,
                        duration: 200 + (Math.random() * 800),
                        complete: function() {
                            clone.parentNode.removeChild(clone);
                        }
                    })
                }, Math.random() * 200);

            });

            _(toMove).each(function(child) {

                var m = margin(child);

                var node = _.find(nodes, function(node) {
                    return compare(node) === compare(child);
                });

                var nodeClone = absclone(node);
                var childClone = absclone(child);

                nodeClone.style.opacity = 0;
                nodeClone.style.top = (child.offsetTop - m.top) + 'px';
                nodeClone.style.left = (child.offsetLeft - m.left) + 'px';

                glass(node);
                glass(child);

                el.appendChild(node);
                el.appendChild(childClone);
                el.appendChild(nodeClone);

                replace(child, node);

                queue.push(function() {
                    setTimeout(function() {

                        var m = margin(node);

                        var opts = {
                            top: node.offsetTop - m.top,
                            left: node.offsetLeft - m.left,
                            easing: easing,
                            duration: 200 + (Math.random() * 800)
                        };

                        childClone.animation = morpheus(childClone, _.extend({}, opts, {
                            opacity: 0,
                            complete: function() {
                                childClone.parentNode.removeChild(childClone);
                            }
                        }));

                        nodeClone.animation = morpheus(nodeClone, _.extend({}, opts, {
                            opacity: 1,
                            complete: function() {
                                nodeClone.parentNode.removeChild(nodeClone);
                                wood(node);
                            }
                        }));

                    }, Math.random() * 200);

                });

            });

            _(toAdd).each(function(node) {
                var clone = absclone(node);

                clone.style.top = (-500 + Math.random() * 1500) + 'px';
                clone.style.left = (-500 + Math.random() * 1500) + 'px'


                glass(clone);
                glass(node);
                el.appendChild(clone);
                el.appendChild(node);

                queue.push(function() {
                    setTimeout(function() {
                        var m = margin(node);
                        clone.animation = morpheus(clone, {
                            opacity: one,
                            top: node.offsetTop - m.top,
                            left: node.offsetLeft - m.left,
                            easing: easing,
                            duration: 200 + (Math.random() * 800),
                            complete: function() {
                                clone.parentNode.removeChild(clone);
                                wood(node);
                            }
                        });
                    }, Math.random() * 200)

                });
            });

            // sort
            _(el.childNodes).chain().filter(function(el) {
                return !el.__clone__;
            }).sortBy(sort|| function(el){
                return _(nodes).indexOf(el);
            }).each(function(ele) {
                el.appendChild(ele);
            });
            // run the stuff in queue
            _.each(queue, function(f) {
                f();
            });
            // then reassign filtered el.childNodes to children
            children = _(el.childNodes).filter(function(el) {
                return !el.__clone__;
            });
        }
    };
};