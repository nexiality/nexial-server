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

const yauzl                           = require("yauzl");
const mkdirp                          = require('mkdirp');
const rimraf                          = require('rimraf');
const {join, dirname}                 = require('path');
const fs                              = require('fs');
const {existsSync, mkdirSync, rename} = require('fs');

function Report() {
    if (!(this instanceof Report)) {
        console.log('Warning: Report constructor called without "new" operator');
        return new Report();
    }

    this.onExtractZipEntry = function (/*Object*/zipFile, /*Object*/entry, /*String*/reportDir, /*Function*/callback) {
        zipFile.openReadStream(entry, function (err1, readStream) {
            if (err1) {
                console.error('ERROR open zip stream ' + entry.fileName + ': ' + err1);
                callback(err1, null);
                return;
            }

            const destination = join(reportDir, entry.fileName);
            mkdirp(dirname(destination), function (err2) {
                if (err2) {
                    console.error('mkdir ' + dirname(destination) + ': ' + err2);
                    callback(err2, null);
                    return;
                }

                // console.log('unzipping ' + destination);
                try {
                    readStream.on("end", () => { zipFile.readEntry(); });
                    readStream.pipe(fs.createWriteStream(destination));
                } catch (e) {
                    console.error(e);
                    callback(e, null);
                }
            });
        });
    };

    this.uploadReportZip = function (/*Object*/uploadedFile, /*Object*/options, /*Function*/callback) {
        const _this    = this;
        const uploaded = uploadedFile.path;
        console.log('new upload received: ' + uploaded);

        if (!fs.existsSync(uploaded)) {
            callback(new Error('Uploaded file ' + uploadedFile.path + ' is not accessible. Try uploading it again'),
                null);
            return;
        }

        const targetDir  = options.target;
        const reportType = options.reportType;
        const override   = options.override;

        const reportDir = join(uploadedFile.destination, targetDir);
        console.log('unzip ' + uploaded + ' to ' + reportDir);

        if (fs.existsSync(reportDir) && !override) {
            let error = 'report target directory ' + reportDir + ' already exists and "override" is not enabled';
            console.log(error);
            callback(error, null);
            return;
        }

        fs.access(reportDir, fs.constants.R_OK, function () {
            rimraf(reportDir, function (err) {
                // let's push on... probably ok
                if (err) { console.error(err); }

                mkdirp(reportDir, function (err) {
                    if (err) {
                        console.error('mkdir ' + reportDir + ': ' + err);
                        callback(err, null);
                        return;
                    }

                    yauzl.open(uploaded, {lazyEntries: true}, function (err, zipFile) {
                        if (err) {
                            callback(err, null);
                            return;
                        }

                        // create meta file here...
                        const meta       = {name: targetDir, reportType: reportType, created: Date.now()};
                        const indexFiles = [];

                        zipFile.on('close', function () {
                            var deepLink = null;
                            if (indexFiles && indexFiles.length > 0) {
                                let indexFile = indexFiles.sort((f1, f2) => f1.length > f2.length ? 1 : -1)[0];
                                meta.indexUri = indexFile.substringAfter(join(global.appRoot, 'public'));

                                deepLink = options.baseUri + '/#' + targetDir;
                            }

                            fs.writeFileSync(join(reportDir, '.meta.json'), JSON.stringify(meta), 'utf8');

                            // done unzipping, delete zip file
                            fs.unlinkSync(uploaded);

                            callback(null, {file: uploaded, link: deepLink});
                        });

                        zipFile.readEntry();

                        zipFile.on('entry', function (entry) {
                            if (/\/$/.test(entry.fileName)) {
                                // Directory file names end with '/'.
                                // Note that entries for directories themselves are optional.
                                // An entry's fileName implicitly requires its parent directories to exist.
                                zipFile.readEntry();
                            } else {
                                // file entry
                                _this.onExtractZipEntry(zipFile, entry, reportDir, callback);

                                const unzipped = join(reportDir, entry.fileName);
                                if (unzipped.endsWith('index.html')) { indexFiles.push(unzipped); }
                            }
                        });
                    });
                });
            });
        });
    };

    this.removeReport = function (/*String*/project, /*String*/report, /*Function*/callback) {
        if (!project) {
            callback('No project specified');
            return;
        }

        if (!report) {
            callback('No project specified');
            return;
        }

        project        = project.trim();
        let projectDir = join(global.appRoot, 'public', 'projects', project);
        if (!existsSync(projectDir)) {
            callback('Project [' + project + '] does not exist');
            return;
        }

        report        = report.trim();
        let reportDir = join(projectDir, report);
        if (!existsSync(reportDir)) {
            callback('Report [' + report + '] does not exist in Project [' + project + ']');
            return;
        }

        let lafBase = join(global.appRoot, '.lostandfound');
        if (!existsSync(lafBase)) { mkdirSync(lafBase); }

        let lafDir = join(lafBase, project, report + '.' + Date.now());
        mkdirp(lafDir, function (err) {
            if (err) {
                callback(err);
            } else {
                rename(reportDir, lafDir, function (err) {
                    if (err) {
                        callback('Unable to delete report: ' + err);
                    } else {
                        callback(null, 'Report [' + report + '] of Project [' + project + '] successfully removed');
                    }
                });
            }
        });
    };
}

module.exports.Report = Report;
