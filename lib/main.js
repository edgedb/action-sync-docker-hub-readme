"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
const fetch = __importStar(require("node-fetch"));
async function run() {
    try {
        const username = core.getInput('docker_hub_username', { required: true });
        const password = core.getInput('docker_hub_password', { required: true });
        const dockerRepo = core.getInput('docker_hub_repository', { required: true });
        let readmePath = core.getInput('readme_path');
        if (!readmePath) {
            readmePath = 'README.md';
        }
        const readmeContent = fs.readFileSync(readmePath).toString('utf-8');
        const authToken = (await api('users/login', { username, password }, undefined))['token'];
        await api(`repositories/${dockerRepo}`, { full_description: readmeContent }, authToken, 'patch');
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
async function api(method, data, authToken, verb = 'post') {
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authToken ? `Bearer ${authToken}` : ''
    };
    const response = await fetch.default(`https://hub.docker.com/v2/${method}/`, {
        method: verb,
        body: JSON.stringify(data),
        headers,
    });
    checkStatus(response);
    return await response.json();
}
class HTTPResponseError extends Error {
    constructor(response) {
        super(`Docker Hub Error Response: ${response.status} ${response.statusText}`);
        this.response = response;
    }
}
function checkStatus(response) {
    if (response.ok) {
        return response;
    }
    else {
        throw new HTTPResponseError(response);
    }
}
if (require.main === module) {
    run();
}
