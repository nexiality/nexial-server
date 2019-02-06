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

const Service = require('node-windows').Service;

// Create a new service object
const svc = new Service({
    name:        'nexial-server',
    description: 'Nexial server and services',
    script:      'C:\\projects\\nexial-server\\bin\\www',
    nodeOptions: [],
    env:         {name: "PORT", value: 8080}
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () { svc.start(); });
svc.install();