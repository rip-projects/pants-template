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

        Array.prototype.forEach.call(fragment.querySelectorAll('template'), function(t) {
            var node = t;
            var count = 0;
            while((node = node.parentNode) && count++ <= 10) {
                if (node === fragment) {
                    template(t);
                    break;
                } else if (node instanceof HTMLTemplateElement) {
                    break;
                }
            }
        });

        firstNode = fragment.firstChild;
        if (firstNode) {
            for (var child = fragment.firstChild; child; child = child.nextSibling) {
                if (!child.nextSibling) {
                    lastNode = child;
                }
                var last = child.bind(context);
                if (last) {
                    child = last.lastNode;
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

    templateProto.createInstance = function(context) {
        var fragment = this.content.cloneNode(true),
            instance = new Instance(this, fragment, context);

        var lastNode = this.instances.length ? this.instances[this.instances.length - 1].lastNode.nextSibling : this;
        // if (!lastNode) {
        //     lastNode = this;
        // }

        if (this.shadow_) {
            this.getShadowRoot().appendChild(fragment);
        } else {
            this.parentNode.insertBefore(fragment, lastNode.nextSibling);
        }

        this.instances.push(instance);

        return instance;
    };

    templateProto.bind = function(context) {
        if (this.if_) {
            this.observe_(context, this.if_, function(ok) {
                this.clearInstances();
                if (ok) {
                    this.createInstance(context);
                }
            }.bind(this), 'resolve');
        }
        return this.createInstance(context);
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
                child.parentNode.removeChild(child);
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
        if (bindAttr) {
            var bindContext = pants.expression(bindAttr).resolve(root);
            if (bindContext) {
                this.bind(bindContext);
            }
        }
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