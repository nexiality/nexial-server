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

const {readdirSync, readFileSync, statSync, existsSync, mkdirSync, rename} = require('fs');
const {join}                                                               = require('path');

function Project() {

    if (!(this instanceof Project)) {
        console.log('Warning: Project constructor called without "new" operator');
        return new Project();
    }

    this.projectBase = join(global.appRoot, 'public', 'projects');

    this.resolveProjectMeta = function (project) {
        const metaJson = join(this.projectBase, project, '.meta.json');
        const meta     = JSON.parse(readFileSync(metaJson, 'utf8'));
        const name     = meta && meta.name ? meta.name : project.name;
        const iconUri  = meta.icon ? '/projects/' + project + '/' + meta.icon : null;
        return {id: project, name: name, rel: project, icon: iconUri};
    };

    this.listProjects = function () {
        const _this    = this;
        const projects = readdirSync(_this.projectBase).filter(f => statSync(join(_this.projectBase, f)).isDirectory());
        let result     = [];

        if (!projects || projects.length < 1) { return result; }

        projects.forEach(p => result.push(_this.resolveProjectMeta(p)));

        // result.push({id: 'project1', name: 'project1', rel: 'project1', icon: '/projects/psg/project.png'});
        // result.push({id: 'project1', name: 'project1', rel: 'project1', icon: '/projects/psg/project.png'});
        // result.push({id: 'project1', name: 'project1', rel: 'project1', icon: '/projects/psg/project.png'});
        // result.push({id: 'project1', name: 'project1', rel: 'project1', icon: '/projects/psg/project.png'});
        // result.push({id: 'project1', name: 'project1', rel: 'project1', icon: '/projects/psg/project.png'});
        // result.push({id: 'project1', name: 'project1', rel: 'project1', icon: '/projects/psg/project.png'});
        // result.push({id: 'project1', name: 'project1', rel: 'project1', icon: '/projects/psg/project.png'});
        // result.push({id: 'project1', name: 'project1', rel: 'project1', icon: '/projects/psg/project.png'});
        // result.push({id: 'project1', name: 'project1', rel: 'project1', icon: '/projects/psg/project.png'});

        return result;
    };

    this.listJmeterReports = function (/*String*/project) { return this.listReports(project, 'jmeter'); };
    this.listNexialReports = function (/*String*/project) { return this.listReports(project, 'nexial'); };

    this.listReports = function (/*String*/project, /*String*/reportType) {
        const reportBase           = join(this.projectBase, project);
        const reportDirs           = readdirSync(reportBase).filter(f => statSync(join(reportBase, f)).isDirectory());
        const reportMetaCollection = [];

        if (reportDirs && reportDirs.length > 0) {
            reportDirs.sort().forEach(d => {
                let reportMetaFile = join(reportBase, d, '.meta.json');
                if (existsSync(reportMetaFile)) {
                    const reportMeta = JSON.parse(readFileSync(reportMetaFile, 'utf8'));
                    if (reportMeta.reportType === reportType) {
                        reportMetaCollection.push({name: d, rel: reportMeta.indexUri});
                    }
                }
            });
        }

        // reportMetaCollection.push({name: reportType + 'testing1', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing2', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing3', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing4', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing5', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing6', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing7', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing8', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing9', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing0', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing11', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing12', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing13', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing14', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing15', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing16', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing17', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing18', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testin1g9', rel: 'testin123.html'});
        // reportMetaCollection.push({name: reportType + 'testing10', rel: 'testin123.html'});

        return reportMetaCollection;
    };

    this.removeProject = function (/*String*/project, /*Function*/callback) {
        if (!project) {
            callback('No project specified');
            return;
        }

        project        = project.trim();
        let projectDir = join(global.appRoot, 'public', 'projects', project);
        if (!existsSync(projectDir)) {
            callback('Project [' + project + '] does not exist');
            return;
        }

        let lafBase = join(global.appRoot, '.lostandfound');
        if (!existsSync(lafBase)) { mkdirSync(lafBase); }

        let lafDir = join(lafBase, project + '.' + Date.now());
        mkdirSync(lafDir);

        rename(projectDir, lafDir, function (err) {
            if (err) {
                callback('Unable to delete project directory: ' + err);
            } else {
                callback(null, 'Project [' + project + '] successfully removed');
            }
        });
    };
}

module.exports.Project = Project;
