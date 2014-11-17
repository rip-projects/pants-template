/**
 * pants.template
 *
 * MIT LICENSE
 *
 * Copyright (c) 2014 PT Sagara Xinix Solusitama - Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @author     Ganesha <reekoheek@gmail.com>
 * @copyright  2014 PT Sagara Xinix Solusitama
 */
(function(root, factory) {
    "use strict";

    if( typeof define === 'function' && define.amd ){
        define([], factory );
    }else if( typeof exports === 'object' ){
        module.exports = factory();
    }else{
        root.pants = root.pants || {};
        root.pants.template = factory();
    }
} (this, function() {
    "use strict";

    var root = window || global;

    var template = function(t) {
        if (t.wearPants_) {
            return t;
        }

        for(var i in templateProto) {
            if (templateProto.hasOwnProperty(i)) {
                t[i] = t[i] || templateProto[i];
            }
        }
        t.bind = templateProto.bind;
        t.unbind = templateProto.unbind;

        // slow on firefox to mutate node if below applied
        // Object.setPrototypeOf(t, templateProto);
        // t.__proto__ = templateProto;
        t.createdCallback();
        return t;
    };

    /**
     * Instance
     */

    var Instance = template.Instance = function(htmlTemplate, fragment, context) {
        this.template = htmlTemplate;
        this.context = context;
        this.fragment = fragment;

        var firstNode, lastNode;

        firstNode = fragment.firstChild;
        if (firstNode) {
            for (var child = fragment.firstChild; child; child = child.nextSibling) {
                if (!child.nextSibling) {
                    lastNode = child;
                }

                child.parentTemplate_ = this.template;
                if (pants.template && child.parentTemplate_ && child instanceof HTMLTemplateElement) {
                    pants.template(child);
                }

                var lastNode_ = child.bind(context);
                if (lastNode_) {
                    child = lastNode_;
                }
            }

            this.firstNode = firstNode;
            this.lastNode = lastNode;
        } else {
            this.firstNode = null;
            this.lastNode = null;
        }
    };

    /**
     * Template
     */
    var templateProto = Object.create(HTMLTemplateElement.prototype);

    templateProto.wearPants_ = true;

    templateProto.isVisible_ = true;

    templateProto.createInstance = function(context) {
        var fragment = this.content.cloneNode(true),
            instance = new Instance(this, fragment, context),
            lastNode;

        if (this.instances.length) {
            var lastInstance = this.instances[this.instances.length - 1];
            lastNode = lastInstance.lastNode;
        } else {
            lastNode = this;
        }

        if (this.shadow_) {
            this.getShadowRoot().appendChild(fragment);
        } else {
            this.parentNode.insertBefore(fragment, lastNode.nextSibling);
        }

        this.instances.push(instance);

        return instance;
    };

    // templateProto.getParent = function(node) {
    //     node = node || this;
    //     var p = node.parentNode;
    //     while (p) {
    //       node = p;
    //       p = node.parentNode;
    //     }

    //     return node;
    // };

    templateProto.isSubTemplate = function() {
        if (this.parentTemplate_) {
            return true;
        }
        return false;
    };

    templateProto.render = function(context) {
        var newContext;

        this.clearInstances();

        // console.trace('render>>', this, context);

        if (this.isVisible_) {
            if (this.bind_) {
                if (this.isSubTemplate()) {
                    newContext = pants.expression(this.bind_).resolve(context);
                    context = newContext;
                }
            } else if (this.each_) {
                if (this.isSubTemplate()) {
                    newContext = pants.expression(this.each_).resolve(context);
                    context = newContext;
                    var instance;
                    for(var i in context) {
                        instance = this.createInstance(context[i]);
                    }
                    return instance.lastNode;
                } else {
                    throw "Cannot use template[each] for sub template!";
                }
            }

            return this.createInstance(context).lastNode;
        }
    };

    templateProto.bind = function(context) {
        // console.log('t>>', this);

        if (this.if_) {
            this.isVisible_ = pants.expression(this.if_).resolve(context);

            this.observe_(context, this.if_, function(isVisible) {
                this.isVisible_ = isVisible;
                this.render(context);
            }.bind(this), 'resolve');
        }

        var instance = this.render(context),
            lastNode = instance ? instance.lastNode : this;

        if (this.isSubTemplate()) {
            var evalPath = this.bind_ || this.each_;
            if (evalPath) {
                this.observe_(context, evalPath, function() {
                    this.render(context);
                }.bind(this));
            }
        }

        return lastNode;
    };

    templateProto.unbind = function() {
        this.clearInstances();
    };

    templateProto.clearInstances = function() {
        this.instances.forEach(function(instance) {
            var children = [];
            var child;
            do {
                if (child) {
                    child = child.nextSibling;
                } else {
                    child = instance.firstNode;
                }

                if (child) {
                    children.push(child);
                }
            } while(child && child !== instance.lastNode);

            children.forEach(function(child) {
                child.unbind();
                child.parentNode.removeChild(child);
                child.remove();
            });
        });

        this.instances = [];
    };

    templateProto.getShadowRoot = function() {
        if (!this.shadowRoot_) {
            this.shadowRoot_ = this.shadow_.createShadowRoot();
        }
        return this.shadowRoot_;
    };

    templateProto.createdCallback = function() {
        this.instances = [];

        this.if_ = this.getAttribute('if');
        this.each_ = this.getAttribute('each');
        this.bind_ = this.getAttribute('bind');
        switch (this.getAttribute('shadow')) {
            case '':
            case '1':
            case 'yes':
            case 'true':
                this.shadow_ = this.parentNode;
                break;
            default:
                this.shadow_ = null;
        }

        var bindAttr = this.getAttribute('bind');
        if (!this.parentTemplate_ && bindAttr) {
            var bindContext = pants.expression(bindAttr).resolve(root);
            if (bindContext) {
                this.bind(bindContext);
            }
        }

        // FIXME use deferred render for optimization
        // var renderTimeout_, RENDER_T = 50;
        // this.render = function(context) {
        //     clearTimeout(renderTimeout_);
        //     renderTimeout_ = setTimeout(this.render_.bind(this), RENDER_T);
        // }.bind(this);
    };

    templateProto.attributeChangedCallback = function(attrName, oldValue, newValue) {
        if (attrName === 'bind') {
            this.bind(newValue);
        }
    };

    if (document.registerElement) {
        document.registerElement('pants-template', {
            'prototype': templateProto,
            'extends': 'template',
        });
    }

    return template;
}));