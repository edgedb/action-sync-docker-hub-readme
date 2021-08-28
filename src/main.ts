import * as fs from 'fs'
import * as core from '@actions/core'
import * as fetch from 'node-fetch'

async function run(): Promise<void> {
  try {
    const username = core.getInput('docker_hub_username', {required: true})
    const password = core.getInput('docker_hub_password', {required: true})
    const dockerRepo = core.getInput('docker_hub_repository', {required: true})
    let readmePath = core.getInput('readme_path')

    if (!readmePath) {
      readmePath = 'README.md'
    }

    const readmeContent = fs.readFileSync(readmePath).toString('utf-8')
    const authToken = (
      await api('users/login', {username, password}, undefined)
    )['token']

    await api(
      `repositories/${dockerRepo}`,
      {full_description: readmeContent},
      authToken,
      'patch'
    )
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

async function api(
  method: string,
  data: object,
  authToken?: string,
  verb = 'post'
): Promise<any> {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: authToken ? `Bearer ${authToken}` : ''
  }
  const response = await fetch.default(`https://hub.docker.com/v2/${method}/`, {
    method: verb,
    body: JSON.stringify(data),
    headers
  })
  checkStatus(response)
  return await response.json()
}

class HTTPResponseError extends Error {
  response: fetch.Response

  constructor(response: fetch.Response) {
    super(
      `Docker Hub Error Response: ${response.status} ${response.statusText}`
    )
    this.response = response
  }
}

function checkStatus(response: fetch.Response): fetch.Response {
  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response
  } else {
    throw new HTTPResponseError(response)
  }
}

if (require.main === module) {
  run()
}
