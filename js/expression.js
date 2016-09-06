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
        return this.parse().identifiers;
    };

    Expression.prototype.resolve = function(context) {
        var parsed = this.parse(),
            re = /{{\s*([^}]*)\s*}}/g,
            matches = re.exec(this.text);
        return resolve_(matches[1], context, parsed);
    };

    Expression.prototype.render = function(context) {
        var parsed = this.parse(),
            re = /{{\s*([^}]*)\s*}}/g;

        return this.text.replace(re, function(toReplace, toEvaluate) {
            return resolve_(toEvaluate, context, parsed);
        });
    };

    Expression.prototype.parse = function() {

        var re = /{{\s*([^}]*)\s*}}/g,
            matches,
            idMap = {},
            result = {
            'expressions': [],
        };

        while ((matches = re.exec(this.text))) {
            result.expressions.push(matches[0]);

            if (matches[1].trim() === '') {
                idMap[''] = '';
            } else {
                var stokens = esprima.tokenize(matches[1]);
                var ids = {};

                populateIdentifiers_(stokens, ids);

                for(var i in ids) {
                    idMap[i] = i;
                }
            }
        }

        result.identifiers = Object.keys(idMap);

        return result;
    };

    var populateIdentifiers_ = function(stokens, ids) {
        var id = '',
            accept = 'i';

        stokens.forEach(function(t) {
            switch(accept) {
                case 'i':
                    if (t.type === 'Identifier') {
                        id += t.value;
                        accept = '.[';
                    }
                    break;
                case '.[':
                    if (t.type === 'Punctuator' && t.value === '.') {
                        id += t.value;
                        accept = 'i';
                    } else if (t.type === 'Punctuator' && t.value === '[') {
                        id += t.value;
                        accept = 'sn';
                    } else {
                        ids[id] = id.trim();
                        id = '';
                        accept = 'i';
                    }
                    break;
                case 'sn':
                    if (t.type === 'String' || t.type === 'Numeric') {
                        id += t.value;
                        accept = ']';
                    } else {
                        throw Error('Error parsing expression!');
                    }
                    break;
                case ']':
                    if (t.type === 'Punctuator' && t.value === ']') {
                        id += t.value;
                        accept = '.[';
                    }
                    break;
            }
        });

        if (id) {
            ids[id] = id.trim();
        }
    };

    var resolve_ = function(text, context, parsed) {
        text = (text || '').trim();
        if (text === '' || text === '_') {
            return context;
        }

        if (typeof context === 'undefined') {
            return undefined;
        }

        var str = '\n';
        var tokenMap = {};
        parsed.identifiers.forEach(function(identifier) {
            var token = pants.path.get(identifier)[0];
            if (!tokenMap[token]) {
                tokenMap[token] = token;
                str += 'var ' + token + ' = this["' + token + '"]; // type ' + (typeof context[token]) + '\n';
            }
        });
        str += '\nreturn ' + text + ';\n\n';

        var f = new Function(str);
        var result = f.call(context);

        return result;
    };

    return expression;
}));