import React, {ReactElement, useRef, useEffect, useState} from 'react'
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom'
import Autocomplete from '@mui/material/Autocomplete'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import {looksLikeLink, githubUrlOrPathToSharePath} from '../../net/github/utils'
import {disablePageReloadApprovalCheck} from '../../utils/event'
import {navWithSearchParamRemoved} from '../../utils/navigate'
import CloseIcon from '@mui/icons-material/Close'


/**
 * The search bar doubles as an input for search queries and also open
 * file paths
 *
 * @property {string} placeholder Text to display when search bar is inactive
 * @property {string} helperText Text to display under the TextField
 * @return {ReactElement}
 */
export default function SearchBar({placeholder, helperText, id, setIsDialogDisplayed}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputText, setInputText] = useState('')
  const [gitHubSearchText, setGitHubSearchText] = useState('')
  const [error, setError] = useState('')
  const searchInputRef = useRef(null)


  useEffect(() => {
    if (location.search) {
      if (id !== 'githubsearch') {
        if (validSearchQuery(searchParams)) {
          const newInputText = searchParams.get(QUERY_PARAM)
          if (inputText !== newInputText) {
            setInputText(newInputText)
          }
        } else {
          disablePageReloadApprovalCheck()
          navWithSearchParamRemoved(navigate, location.pathname, QUERY_PARAM)
        }
      }
    } else {
      setInputText('')
      navWithSearchParamRemoved(navigate, location.pathname, QUERY_PARAM)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])


  const onSubmit = (event) => {
    // Prevent form event bubbling and causing page reload.
    event.preventDefault()
    if (error.length > 0) {
      setError('')
    }

    // if url is typed into the search bar open the model
    if (looksLikeLink(inputText)) {
      try {
        const modelPath = githubUrlOrPathToSharePath(inputText)
        disablePageReloadApprovalCheck()
        navigate(modelPath, {replace: true})
        if (setIsDialogDisplayed) {
          setIsDialogDisplayed(false)
        }
      } catch (e) {
        setError(`Please enter a valid url. Click on the LINK icon to learn more.`)
      }
      return
    }

    // Searches from SearchBar clear current URL's IFC path.
    if (containsIfcPath(location)) {
      const newPath = stripIfcPathFromLocation(location)
      disablePageReloadApprovalCheck()
      navigate({
        pathname: newPath,
        search: `?q=${inputText}`,
      })
    } else {
      setSearchParams({q: inputText})
      setIsDialogDisplayed(true)
    }
    searchInputRef.current.blur()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit(event)
    }
  }


  // The container and paper are set to 100% width to fill the
  // container SearchBar shares with NavTreePanel.  This is an easier
  // way to have them share the same width, which is now set in the
  // parent container (CadView).
  return (
    <form onSubmit={onSubmit}>
      <Autocomplete
        freeSolo
        options={[]}
        value={(id === 'githubsearch') ? gitHubSearchText : inputText}
        onChange={(_, newValue) =>
          (id === 'githubsearch') ? setGitHubSearchText(newValue || '') : setInputText(newValue || '')}
        onInputChange={(_, newInputValue) =>
          (id === 'githubsearch') ? setGitHubSearchText(newInputValue || '') : setInputText(newInputValue || '')}
        clearIcon={<CloseIcon className='icon-share'/>}
        inputValue={(id === 'githubsearch') ? gitHubSearchText : inputText}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={searchInputRef}
            size='small'
            error={!!error.length}
            placeholder={placeholder}
            variant='outlined'
            helperText={helperText}
            sx={{
              width: '100%',
            }}
            multiline
            onKeyDown={handleKeyDown}
            data-testid='textfield-search-query'
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear search"
                    onClick={() => (id === 'githubsearch') ? setGitHubSearchText('') : setInputText('')}
                    sx={{height: '2em', width: '2em'}}
                  >
                    <CloseIcon
                      className="icon-share"
                      color='primary'
                      fontSize="small"
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      />
    </form>
  )
}


/** @type {string} */
export const QUERY_PARAM = 'q'


/**
 * Return true for paths like
 *
 *   /share/v/p/index.ifc/1
 *   /share/v/p/index.ifc/1/2
 *   /share/v/p/index.ifc/1/2/...
 *
 * and false for:
 *
 *   /share/v/p/index.ifc
 *
 * @param {object} location React router location object.
 * @return {boolean}
 */
export function containsIfcPath(location) {
  return location.pathname.match(/.*\.ifc(?:\/[0-9])+(?:.*)/) !== null
}


/**
 * Returns true iff searchParams query is defined with a string value.
 *
 * @param {object} searchParams Object with a QUERY_PARAM(default='q') parameter
 * present and optional string value.
 * @return {boolean}
 */
export function validSearchQuery(searchParams) {
  const value = searchParams.get(QUERY_PARAM)
  return value !== null && value.length > 0
}


/**
 * Converts a path like:
 *
 *   /share/v/p/index.ifc/84/103?q=foo
 *
 * to:
 *
 *   /share/v/p/index.ifc?q=foo
 *
 * @param {object} location React router location object.
 * @param {string} fileExtension defaults to '.ifc' for now.
 * @return {string}
 */
export function stripIfcPathFromLocation(location, fileExtension = '.ifc') {
  const baseAndPathquery = location.pathname.split(fileExtension)
  const expectedPartsCount = 2
  if (baseAndPathquery.length === expectedPartsCount) {
    const base = baseAndPathquery[0]
    let newPath = base + fileExtension
    const pathAndQuery = baseAndPathquery[1].split('?')
    if (pathAndQuery.length === expectedPartsCount) {
      const query = pathAndQuery[1]
      newPath += `?${ query}`
    }
    return newPath
  }
  throw new Error('Expected URL of the form <base>/file.ifc<path>[?query]')
}
