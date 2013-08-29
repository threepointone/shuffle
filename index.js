"use strict";
var _ = require('underscore'),
    morpheus = require('morpheus'),
    easing = require('./easings.js').sinusoidal;


var zero = 0;
var one = 1;

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

    _.extend(clone.style, {
        position: 'absolute',
        top: (el.offsetTop - m.top) + 'px',
        left: (el.offsetLeft - m.left) + 'px'
    });

    clone.className += ' clone';
    clone.__clone__ = true; // a little hint for anyone else to ignore this. 

    return clone;
}

module.exports = function(el, options) {
    options = options || {};


    var compare = options.compare || _.identity;
    var sort = options.sort;
    var union = options.union || false;
    var duration = options.duration || function(){ return (Math.random()*800) + 200;};
    var selector = options.selector;

    return {
        add: function(nodes) {
            var children = _(selector? el.querySelectorAll(selector) : el.childNodes).filter(function(el) {
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

            if (!union) {
                _(toLeave).each(function(child) {
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
                            duration: duration(),
                            complete: function() {
                                clone.parentNode.removeChild(clone);
                            }
                        });
                    }, Math.random() * 200);
                });
            }

            _(toMove).each(function(child) {

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

                replace(child, node);

                queue.push(function() {
                    setTimeout(function() {
                        var m = margin(node);

                        var opts = {
                            top: node.offsetTop - m.top,
                            left: node.offsetLeft - m.left,
                            easing: easing,
                            duration: duration()
                        };

                        childClone.animation = morpheus(childClone, _.extend({}, opts, {
                            opacity: zero,
                            complete: function() {
                                childClone.parentNode.removeChild(childClone);
                            }
                        }));

                        nodeClone.animation = morpheus(nodeClone, _.extend({}, opts, {
                            opacity: one,
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

                _.extend(clone.style, {
                    top: (-500 + Math.random() * 1500) + 'px',
                    left: (-500 + Math.random() * 1500) + 'px'
                });

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
            _(selector? el.querySelectorAll(selector) : el.childNodes).chain().filter(function(el) {
                return !el.__clone__;
            }).sortBy(sort || function(el) {
                return _(nodes).indexOf(el);
            }).each(function(ele) {
                el.appendChild(ele);
            });
            // run the stuff in queue
            _.each(queue, function(f) {
                f();
            });
            // then reassign filtered el.childNodes to children
            children = _(selector? el.querySelectorAll(selector) : el.childNodes).filter(function(el) {
                return !el.__clone__;
            });
        }
    };
};