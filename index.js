var _ = require('underscore'),
    morpheus = require('morpheus'),
    easing = require('./easings.js').easeOut;

function show(el) {
    el.style.display = el.__display || '';
    return el;
}

function hide(el) {
    el.__display = el.style.display !== 'none' ? el.style.display : '';
    el.style.display = 'none';
    return el;
}

var zero = 0;
var one = 1;

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

function aclone(el) {
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

module.exports = function(el) {
    var children = _(el.childNodes).filter(function(el) {
        return !el.__clone__;
    });

    return {
        add: function(nodes, compare, sort, union) {
            var toAdd = _(nodes).filter(function(node) {
                var match = _(children).find(function(child) {
                    return compare(child) === compare(node);
                });
                return !match;
            });
            var toRemove = [];
            if (!union) {
                toRemove = _(children).filter(function(child) {
                    var match = _(nodes).find(function(node) {
                        return compare(child) === compare(node);
                    });
                    return !match;
                });
            }

            var toMove = _(children).filter(function(child) {
                return _(nodes).find(function(node) {
                    return compare(child) === compare(node);
                });
            })

            // and, let's do the insert
            var queue = [];

            _(toRemove).each(function(child) {
                var clone = aclone(child);
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
                        duration: 100 + (Math.random() * 900),
                        complete: function() {
                            clone.parentNode.removeChild(clone);
                        }
                    })
                }, Math.random() * 200);

            });

            _(toMove).each(function(child) {
                var clone = aclone(child);
                glass(child);
                el.appendChild(clone);
                queue.push(function() {
                    setTimeout(function() {
                        var m = margin(child);
                        clone.animation = morpheus(clone, {
                            top: child.offsetTop - m.top,
                            left: child.offsetLeft - m.left,
                            easing: easing,
                            duration: 100 + (Math.random() * 900),
                            complete: function() {
                                clone.parentNode.removeChild(clone);
                                wood(child);
                            }
                        });
                    }, Math.random() * 200);

                });

            });

            _(toAdd).each(function(node) {
                var clone = aclone(node);

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
                            duration: 100 + (Math.random() * 900),
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
            }).sortBy(sort).each(function(ele) {
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


// shuffle(el).add(nodes, compare, sort, union)