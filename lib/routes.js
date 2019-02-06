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

const express    = require('express');
const {join}     = require('path');
const fs         = require('fs');
const url        = require('url');
const multer     = require('multer');
const tmp        = require('tmp');
const commons    = require('../lib/_commons').Commons();
const ProjectApi = require('../lib/project');
const ReportApi  = require('../lib/report');

const router  = express.Router({caseSensitive: true, strict: true});
const project = ProjectApi.Project();
const report  = ReportApi.Report();

console.log('appRoot=' + global.appRoot);

// ----------------------------------------------------------------------------
// report zip uploader
// ----------------------------------------------------------------------------
const zipFilter         = function (req, file, callback) {
    // accept zip file only
    if (!file.originalname.toLowerCase().match(/\.(zip)$/)) {
        return callback(new Error('Only zip files are allowed!'), false);
    }
    callback(null, true);
};
const uploadStorage     = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, join(global.appRoot, 'public', 'projects', req.params.project));
    },
    filename:    function (req, file, callback) { callback(null, file.originalname); }
});
const reportZipUploader = multer({storage: uploadStorage, fileFilter: zipFilter});

// ----------------------------------------------------------------------------
// image uploader
// ----------------------------------------------------------------------------
const imgFilter     = function (req, file, callback) {
    // accept zip file only
    if (!file.originalname.toLowerCase().match(/\.(png|jpg|jpeg|gif)$/)) {
        return callback(new Error('Only images are allowed!'), false);
    }
    callback(null, true);
};
const imageUploader = multer({storage: multer.memoryStorage(), fileFilter: imgFilter});

/**
 * GET home page.
 * @access guest/all
 */
router.get('/', function (req, res) {
    res.render('index', commons.commonData());
});

/**
 * list available projects.
 * @access guest/all
 */
router.get('/projects', function (req, res) { res.redirect('/projects/'); });
router.get('/projects/', function (req, res) {
    let projectData      = commons.commonData();
    projectData.projects = project.listProjects();
    res.render('projects', projectData);
});

/**
 * list available reports per a project.
 * @access guest/all
 */
router.get('/projects/:project', function (req, res) { res.redirect('/projects/' + req.params.project + '/'); });
router.get('/projects/:project/', function (req, res) {
    let reportData            = commons.commonData();
    reportData.project        = project.resolveProjectMeta(req.params.project);
    reportData.reports        = {jmeter: null, nexial: null};
    reportData.reports.jmeter = project.listJmeterReports(req.params.project);
    reportData.reports.nexial = project.listNexialReports(req.params.project);
    res.render('reports', reportData);
});

/**
 * create new project
 * @access admin
 */
router.post('/project', (req, res) => {
    let responseFunc = commons.resolveResponseCallback(req, res);

    commons.securityCheck(req, res, (err) => {
        if (err) {
            responseFunc(res, 400, err);
        } else {
            let requestJson = req.body;
            if (!requestJson) {
                responseFunc(res, 400, 'No payload found in request');
                return;
            }

            let project = requestJson.project;
            if (!project) {
                responseFunc(res, 400, 'No project specified');
                return;
            }

            project = project.trim();
            if (new RegExp(/[:;\/?\\\[\]{}+='"]/).test(project)) {
                responseFunc(res, 400, 'Project [' + project + '] contains invalid character. ' +
                                       'Please check your input and try again');
                return;
            }

            let targetDir = join(global.appRoot, 'public', 'projects', project);
            if (fs.existsSync(targetDir)) {
                responseFunc(res, 400, 'Project [' + project + '] already exist');
                return;
            }

            fs.mkdir(targetDir, function (err) {
                if (err) {
                    responseFunc(res, 400, 'Unable to create project directory: ' + err);
                } else {
                    let metaJson    = {name: requestJson.name, created: Date.now()};
                    let imageBase64 = requestJson.image;
                    if (imageBase64) {
                        console.log('found image to save');
                        let imageExtension = requestJson.imageExtension || 'png';
                        let imageFile      = join(targetDir, 'project.' + imageExtension);
                        fs.writeFileSync(imageFile, imageBase64, 'base64');
                        metaJson.icon = 'project.' + imageExtension;
                    }

                    fs.writeFile(join(targetDir, '.meta.json'), JSON.stringify(metaJson), function (err) {
                        if (err) {
                            responseFunc(res, 400, 'Unable to create project metadata: ' + err);
                        } else {
                            responseFunc(res, 200, {
                                message: 'Project [' + project + '] created successfully',
                                uri:     url.format({
                                    protocol: req.protocol,
                                    host:     req.get('host'),
                                    pathname: '/projects/' + project
                                })
                            });
                        }
                    });
                }
            });
        }
    });
});

/**
 * delete existing project
 * @access admin
 */
router.delete('/project/:project', (req, res) => {
    let responseFunc = commons.resolveResponseCallback(req, res);

    commons.securityCheck(req, res, (err) => {
        if (err) {
            responseFunc(res, 400, err);
        } else {
            project.removeProject(req.params.project, function (err, message) {
                if (err) {
                    responseFunc(res, 400, err);
                } else {
                    responseFunc(res, 200, message);
                }
            });
        }
    });
});

/**
 * upload test report as a zip file for a project
 * @access guest/all
 */
router.post('/projects/:project/:report', reportZipUploader.single('reportZip'), (req, res) => {
    let responseFunc = commons.respondAsJson;

    try {
        // console.log(require('util').inspect(req));

        let options = {
            target:     req.params.report,
            reportType: req.body.reportType || 'nexial',
            override:   req.body.override || 'false',
            baseUri:    req.protocol + '://' + req.hostname + ':' + global.appPort + '/projects/' + req.params.project
        };
        report.uploadReportZip(req.file, options, function (err, message) {
            if (err) {
                responseFunc(res, 400, err);
            } else {
                responseFunc(res, 200, message);
            }
        });
    } catch (err) {
        console.error(err);
        responseFunc(res, 400, err);
    }
});

/**
 * delete existing report
 * @access admin
 */
router.delete('/project/:project/:report', (req, res) => {
    let responseFunc = commons.resolveResponseCallback(req, res);

    commons.securityCheck(req, res, (err) => {
        if (err) {
            responseFunc(res, 400, err);
        } else {
            report.removeReport(req.params.project, req.params.report, function (err, message) {
                if (err) {
                    responseFunc(res, 400, err);
                } else {
                    responseFunc(res, 200, message);
                }
            });
        }
    });
});

/**
 * utility - decode image into base64
 * @type {Router|router}
 */
router.post('/util/base64', imageUploader.single('image'), (req, res) => {
    let responseFunc = commons.respondAsJson;
    commons.imageToBase64(req.file, (err, message) => {
        if (err) {
            responseFunc(res, 400, err);
        } else {
            responseFunc(res, 200, message);
        }
    });

});

module.exports = router;
