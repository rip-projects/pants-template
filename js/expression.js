/**
 * pants.expression
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
        root.pants.expression = factory();
    }
} (this, function() {
    "use strict";

    var arrayFind = function(arr, callback) {
        var result;
        arr.some(function (value) {
            result = callback(value);
            return result;
        });

        return result;
    };

    var cache_ = {};

    var expression = function(text) {
        if (text instanceof Expression) {
            return text;
        }

        if (!cache_[text]) {
            cache_[text] = new Expression(text);
        }

        return cache_[text];
    };

    var Expression = expression.Expression = function(text) {
        this.text = text;
    };

    Expression.prototype.extract = function() {
        var extracted = {};
        this.parse(this.text).forEach(function(token) {
            if (token[0] === 'name') {
                extracted[token[1]] = token[1];
            }
        });

        return Object.keys(extracted);
    };

    Expression.prototype.resolve = function(context) {
        return arrayFind(this.extract(this.text), function(key) {
            return Path.get(key).getValueFrom(context);
        });
    };

    Expression.prototype.render = function(context) {
        return Mustache.render(this.text, context);
    };

    Expression.prototype.parse = function() {
        return Mustache.parse(this.text);
    };

    return expression;
}));