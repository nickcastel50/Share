import {isNumeric} from './strings'
import {assertObject, assertString} from './assert'
import debug from './debug'


// Init
/** @type {Object<string, Function>} */
const hashListeners = {}
window.onhashchange = () => {
  // console.log('HASH CHANGE: ', window.location.hash)
  // TODO(pablo)
  /*
  Object.values(hashListeners).forEach((listener) => {
    listener()
  })*/
}


// TODO(pablo): Ideally this would be handled by react-router
// location, but doesn't seem to be supported yet in v6.
// See also https://stackoverflow.com/a/71210781/3630172
/**
 * @param {string} name Name of listener.  Can be used to later remove
 * listener. TODO: add remove method
 * @param {Function} onHashCb Called when window.location.hash changes
 */
export function addHashListener(name, onHashCb) {
  hashListeners[name] = onHashCb
}


/**
 * Passhtru to addHashParams, with window.location
 *
 * @param {string} name A unique name for the params
 * @param {Object<string, any>} params The parameters to encode
 * @param {boolean} includeNames Whether or not to include the
 *   parameter names in the encoding, default is false.
 */
export function addParams(name, params, includeNames = false) {
  addHashParams(window.location, name, params, includeNames)
}


/**
 * Serialize the given paramObj and add it to the current
 * location.hash
 *
 * @param {Location} location The window.location object
 * @param {string} name A unique name for the params
 * @param {Object<string, any>} params The parameters to encode
 * @param {boolean} includeNames Whether or not to include the
 *   parameter names in the encoding, default is false.
 */
export function addHashParams(location, name, params, includeNames = false) {
  debug().error('cur location hash:', window.location.hash, ', new params:', params)
  const hashGlobalParams = getHashParams(location, name)
  let objectGlobalParams = {}
  if (hashGlobalParams) {
    objectGlobalParams = getObjectParams(hashGlobalParams)
  }

  for (const paramName in params) {
    if (!Object.prototype.hasOwnProperty.call(params, paramName)) {
      continue
    }
    // @ts-ignore
    objectGlobalParams[paramName] = params[paramName]
  }

  const encodedParams = getEncodedParam(objectGlobalParams, includeNames)
  const sets = location.hash.substring(1).split(FEATURE_SEP)
  /** @type {Object<string, string>} */
  const setMap = {}

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i]
    if (set === '') {
      continue
    }
    const setParts = set.split(':')
    const setName = setParts[0]
    const setValue = setParts[1]
    setMap[setName] = setValue
  }

  setMap[name] = encodedParams
  let newHash = ''

  for (const setKey in setMap) {
    if (Object.prototype.hasOwnProperty.call(setMap, setKey)) {
      const setValue = setMap[setKey]
      newHash += `${newHash.length === 0 ? '' : FEATURE_SEP}${setKey}:${setValue}`
    }
  }

  location.hash = newHash
}


// don't export
const FEATURE_SEP = ';'


/**
 * @param {object} objectParams
 * @return {string}
 */
export function getEncodedParam(objectParams, includeNames = false) {
  const objectKeys = Object.keys(objectParams)
  /**
   * @type {string[]}
   */
  const encodedParams = []

  objectKeys.forEach((objectKey) => {
    if (includeNames) {
      // @ts-ignore
      const objectValue = objectParams[objectKey]
      encodedParams.push(objectValue ? `${objectKey}=${objectValue}` : objectKey)
    } else {
      // @ts-ignore
      encodedParams.push(`${objectParams[objectKey]}`)
    }
  })

  const encodedParam = encodedParams.join(',')
  return encodedParam
}


/**
 * @param {string} hashParams
 * @return {object}
 */
export function getObjectParams(hashParams) {
  if (!hashParams) {
    return {}
  }
  const parts = hashParams.split(':')
  if (!parts[0] || !parts[1]) {
    return {}
  }
  const params = parts[1].split(',')
  const objectGlobalParams = {}

  params.forEach((param, index) => {
    if (!param) {
      return
    }
    const paramParts = param.split('=')
    if (paramParts.length < 2) {
      if (isNumeric(paramParts[0])) {
        // @ts-ignore
        objectGlobalParams[index] = paramParts[0]
      } else {
        // @ts-ignore
        objectGlobalParams[paramParts[0]] = 0
      }
    } else {
      // @ts-ignore
      objectGlobalParams[paramParts[0]] = paramParts[1]
    }
  })

  return objectGlobalParams
}


/**
 * Passthru to getHashParams, with window.location
 *
 * @param {string} name prefix of the params to fetch
 * @return {string|undefined} The encoded params (e.g. p:x=0,y=0)
 */
export function getParams(name) {
  return getHashParams(window.location, name)
}


/**
 * @param {Location} location
 * @param {string} name prefix of the params to fetch
 * @return {string|undefined} The encoded params (e.g. p:x=0,y=0)
 */
export function getHashParams(location, name) {
  return getHashParamsFromHashStr(location.hash.substring(1), name)
}


/**
 * @param {string} url
 * @param {string} name prefix of the params to fetch
 * @return {string|undefined} The encoded params (e.g. p:x=0,y=0)
 */
export function getHashParamsFromUrl(url, name) {
  assertString(url)
  const splitUrl = url.split('#')
  if (!splitUrl[1]) {
    return undefined
  }
  return getHashParamsFromHashStr(splitUrl[1], name)
}


/**
 * @param {string} hashStr
 * @param {string} name prefix of the params to fetch
 * @return {string|undefined} The encoded params (e.g. p:x=0,y=0)
 */
export function getHashParamsFromHashStr(hashStr, name) {
  assertString(hashStr)
  const sets = hashStr.split(FEATURE_SEP)
  const prefix = `${name}:`
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i]
    if (set.startsWith(prefix)) {
      return set
    }
  }
  return undefined
}


/**
 * Passthru to hasHashParams, with window.location
 *
 * @param {string} name prefix of the params to fetch
 * @return {boolean} True if and only if getHashParams(location, name) !== undefined
 */
export function hasParams(name) {
  return hasHashParams(window.location, name)
}


/**
 * @param {Location} location
 * @param {string} name prefix of the params to fetch
 * @return {boolean} True if and only if getHashParams(location, name) !== undefined
 */
export function hasHashParams(location, name) {
  return getHashParams(location, name) !== undefined
}


/**
 * Passthru to removeHashParams, with window.location
 *
 * @param {string} name prefix of the params to fetch
 * @param {Array<string>} paramKeys param keys to remove from hash
 *     params. if empty, then remove all params
 */
export function removeParams(name, paramKeys = []) {
  removeHashParams(window.location, name, paramKeys)
}


/**
 * Removes the given named hash param
 *
 * @param {Location} location
 * @param {string} name prefix of the params to fetch
 * @param {Array<string>} paramKeys param keys to remove from hash
 *     params. if empty, then remove all params
 */
export function removeHashParams(location, name, paramKeys = []) {
  assertObject(location)
  const sets = location.hash.substring(1).split(FEATURE_SEP)
  const prefix = `${name}:`
  let newParamsEncoded = ''

  for (let i = 0; i < sets.length; i++) {
    let set = sets[i]

    if (set.startsWith(prefix)) {
      if (!paramKeys.length) {
        continue
      }
      const objectSet = getObjectParams(set)
      paramKeys.forEach((paramKey) => {
        // @ts-ignore
        delete objectSet[paramKey]
      })
      /**
       * @type {string[]}
       */
      const subSets = []
      Object.entries(objectSet).forEach((entry) => {
        const [key, value] = entry
        subSets.push(value ? `${key}=${value}` : key)
      })
      set = `${prefix}${subSets.join(',')}`
    }

    const separator = newParamsEncoded.length === 0 ? '' : FEATURE_SEP
    newParamsEncoded += separator + set
  }

  location.hash = newParamsEncoded
  if (location.hash === '') {
    history.pushState(
        '', document.title, window.location.pathname + window.location.search)
  }
}


/**
 * Passthru to setHashParams, with window.location
 *
 * @param {string} name A unique name for the params
 * @param {Object<string, any>} params The parameters to encode
 * @param {boolean} includeNames Whether or not to include the
 *   parameter names in the encoding, default is false.
 */
export function setParams(name, params, includeNames = false) {
  setHashParams(window.location, name, params, includeNames)
}


/**
 * Equivalent to remove of the named param, then add params to name.
 *
 * @param {Location} location The window.location object
 * @param {string} name A unique name for the params
 * @param {Object<string, any>} params The parameters to encode
 * @param {boolean} includeNames Whether or not to include the
 *   parameter names in the encoding, default is false.
 */
export function setHashParams(location, name, params, includeNames = false) {
  assertObject(location)
  removeHashParams(location, name)
  addHashParams(location, name, params, includeNames)
}


/**
 * Removes the given named hash param.
 *
 * @param {string} org
 * @param {string} repo
 * @param {string} branchName
 * @param {string} filePath
 * @return {string} path to the model
 */
export function navigateBaseOnModelPath(org, repo, branchName, filePath) {
  // TODO(oleg):remove leading slash from filepath requirement
  return `/share/v/gh/${org}/${repo}/${branchName}${filePath}`
}


/**
 * @param {string} url
 * @return {string|undefined}
 */
export function getAllHashParams(url) {
  const splitHref = url ? url.split('#') : window.location.href.split('#')
  const allHashParams = splitHref[1]
  return allHashParams
}


/**
 * @param {string} path the pathname part of a url, e.g. `/the/path/to/file.ifc`
 * @return {object} owner, repo, branch, filePath, commitHash
 */
export function parseGitHubPath(path) {
  const decodedPath = decodeURIComponent(path)
  const parts = decodedPath.split('/').filter((component) => component.length > 0)
  let owner = null
  let repo = null
  let branch = null
  let filePath = null
  let isPublic = null
  if (parts[0] === 'r') {
    // Extract the owner, repo, and filePath
    owner = parts[1]
    repo = parts[2]
    branch = parts[3]
    // Join the remaining parts to form the filePath
    filePath = parts.slice(4).join('/')
    // get commit hash
    isPublic = true
  } else {
    // Extract the owner, repo, and filePath
    owner = parts[0]
    repo = parts[1]
    branch = parts[2]
    // Join the remaining parts to form the filePath
    filePath = parts.slice(3).join('/')
    isPublic = false
  }
  return {isPublic, owner, repo, branch, filePath}
}
