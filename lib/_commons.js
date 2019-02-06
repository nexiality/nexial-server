/*
 * Copyright 2012-2018 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

function Commons() {

    if (!(this instanceof Commons)) {
        console.log('Warning: Commons constructor called without "new" operator');
        return new Commons();
    }

    let _commonData = {
        siteName:    'Test Report Hub',
        company:     'Entertainment Partners',
        companyLogo: '/images/ep-logo.png'
    };

    this.commonData = function () { return _commonData; };

    this.respondAsPlainText = function (/*Object*/res, /*Number*/statusCode, /*String*/message) {
        console.log('respond as plain text, ' + statusCode + ':' + message);
        res.status(statusCode);
        res.send(message);
    };

    this.respondAsJson = function (/*Object*/res, /*Number*/statusCode, /*String|JSON*/message) {
        console.log('respond as json, ' + statusCode + ':' + message);
        res.status(statusCode);
        let responseJson = {status: statusCode};
        if (typeof message === 'string') {
            responseJson.message = message;
        } else {
            responseJson.details = message;
        }
        res.send(responseJson);
    };

    this.respondAsHtml = function (/*Object*/res, /*Number*/statusCode, /*String*/message) {
        console.log('respond as HTML, ' + statusCode + ':' + message);

        let responseData = _commonData;

        if (statusCode >= 200 && statusCode < 300) {
            responseData.result = message;
            res.render('reports', responseData);
        } else {
            responseData.error = message;
            res.render('error', responseData);
        }
    };

    this.resolveResponseCallback = function (req, res) {
        let responseFunc = null;

        const contentType = req.headers['content-type'];
        console.log('Content-Type=' + contentType);
        if (!contentType || contentType === '' || contentType.indexOf('text/html') > -1) {
            responseFunc = this.respondAsHtml;
        } else if (contentType.indexOf('application/json') > -1 || contentType.indexOf('text/json') > -1) {
            responseFunc = this.respondAsJson;
        } else {
            responseFunc = this.respondAsPlainText;
        }

        if (contentType) { res.header['content-type'] = contentType; }

        return responseFunc;
    };

    this.imageToBase64 = function (image, callback) {
        const filename = image.originalname;
        callback(null, {
            filename:  filename,
            extension: filename.substringAfterLast('.'),
            size:      image.size,
            base64:    image.buffer.toString('base64')
        });
    };

    this.securityCheck = function (req, res, callback) {
        // todo: currently only check that the request is made from localhost. We need to improve this!
        if (req.hostname !== 'localhost') {
            callback('Access denied');
        } else {
            callback(null);
        }
    };
}

String.prototype.startsWith = function (prefix) { return this.indexOf(prefix, 0) === 0; };

String.prototype.endsWith = function (suffix) { return this.indexOf(suffix, this.length - suffix.length) !== -1; };

String.prototype.contains = function (str) { return this.indexOf(str) !== -1; };

String.prototype.substringBefore = function (str) {
    let idx = this.indexOf(str);
    return idx !== -1 ? this.substr(0, idx) : this;
};

String.prototype.substringBeforeLast = function (str) {
    let idx = this.lastIndexOf(str);
    return idx !== -1 ? this.substr(0, idx) : this;
};

String.prototype.substringAfter = function (str) {
    let idx = this.indexOf(str);
    return idx !== -1 ? this.substr(idx + str.length) : this;
};

String.prototype.substringAfterLast = function (str) {
    let idx = this.lastIndexOf(str);
    return idx !== -1 ? this.substr(idx + str.length) : this;
};

// left pad with spaces (or the specified character) to this length
String.prototype.leftPad = function (length, c) {
    c = c || " ";
    return length <= this.length ? this : new Array(length - this.length + 1).join(c) + this;
};

// right pad with spaces (or the specified character) to this length
String.prototype.rightPad = function (length, c) {
    c = c || " ";
    return length <= this.length ? this : this + new Array(length - this.length + 1).join(c);
};

module.exports.Commons = Commons;
module.exports.String  = String;
