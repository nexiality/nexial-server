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

const cookieParser = require('cookie-parser');
const cors         = require('cors');
const express      = require('express');
const createError  = require('http-errors');
const logger       = require('morgan');
const {join}       = require('path');
const hbs          = require('hbs');

// globals
global.appRoot = require('path').resolve(__dirname);

// router
const router = require('./lib/routes');

const app      = express();

// view engine setup
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));
app.use(cors());
app.use('/', router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    console.log('NOT FOUND: ' + req.url);
    next(createError(404));
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error   = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// handlebars
hbs.localsAsTemplateData(app);
hbs.registerHelper('json', function (context) { return JSON.stringify(context); });

module.exports = app;
