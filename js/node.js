/**
 * pants.node
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
        root.pants.node = factory();
    }
} (this, function() {
    "use strict";

    var node = function(hnode) {
        throw "pants.node function unimplemented!";
    };

    var noop = function() {};

    Node.prototype.bind = function(context) {
        throw "Unimplemented binding for node!";
    };

    Node.prototype.unbind = function() {
        (this.observables_ || []).forEach(function(observable) {
            observable.disconnect();
        });
    };

    Node.prototype.observe_ = function(context, text, callback, mode) {
        mode = mode || 'render';

        this.observables_ = this.observables_ || [];
        var expression = pants.expression(text);
        expression.extract().forEach(function(token) {
            var observable = pants.observe(context, token, function() {
                callback(expression[mode](context));
            }.bind(this));
            this.observables_.push(observable);
        }.bind(this));
    };

    Comment.prototype.bind = Comment.prototype.unbind = noop;

    Text.prototype.bind = function(context) {
        // console.log(this.textContent, context);
        this.observe_(context, this.textContent, function(renderedText) {
            this.textContent = renderedText;
        }.bind(this));
    };

    HTMLElement.prototype.bind = function(context) {
        Array.prototype.forEach.call(this.attributes, function(attribute) {
            this.observe_(context, attribute.value, function(renderedText) {
                attribute.value = renderedText;
            }.bind(this));
        }.bind(this));

        if (this.childNodes.length) {
            for (var child = this.childNodes[0]; child; child = child.nextSibling) {

                child.parentTemplate_ = this.parentTemplate_;
                if (pants.template && child.parentTemplate_ && child instanceof HTMLTemplateElement) {
                    pants.template(child);
                }
                var lastNode_ = child.bind(context);
                if (lastNode_) {
                    child = lastNode_;
                }
            }
        }
    };

    HTMLInputElement.prototype.bind = function(context) {
        var valuePath = pants.expression(this.value).extract();
        if (valuePath) {
            valuePath = Path.get(valuePath[0]);

            var timeout, timeoutVal = 50;
            this.changedCallback_ = function(evt) {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    valuePath.setValueFrom(context, this.value);
                }.bind(this), timeoutVal);
            };

            this.addEventListener('input', this.changedCallback_);
            this.addEventListener('change', this.changedCallback_);
            this.addEventListener('paste', this.changedCallback_);
            this.addEventListener('keyup', this.changedCallback_);
            this.addEventListener('mouseup', this.changedCallback_);
        }

        HTMLElement.prototype.bind.apply(this, arguments);
    };

    HTMLInputElement.prototype.unbind = function() {
        HTMLElement.prototype.unbind.apply(this, arguments);

        if (this.changedCallback_) {
            this.removeEventListener('input', this.changedCallback_);
            this.removeEventListener('change', this.changedCallback_);
            this.removeEventListener('paste', this.changedCallback_);
            this.removeEventListener('keyup', this.changedCallback_);
            this.removeEventListener('mouseup', this.changedCallback_);
        }
    };

    // mutation observer tu remove object observables of node binding
    document.addEventListener('DOMContentLoaded', function() {
        window.observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // console.log('mutation', mutation);
                Array.prototype.forEach.call(mutation.removedNodes, function(htmlNode) {
                    htmlNode.unbind();
                });
            });
        });
        observer.observe(document.body, {childList: true, subtree: true});
    });

    return node;
}));