import classNames from 'classnames'
import * as H from 'history'
import * as React from 'react'

import { LoaderInput } from '@sourcegraph/branded/src/components/LoaderInput'
import { deriveInputClassName, InputValidationState } from '@sourcegraph/shared/src/util/useInputValidation'

import { USERNAME_MAX_LENGTH, VALID_USERNAME_REGEXP } from '../user'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    inputRef?: React.Ref<HTMLInputElement>
}

interface SignupEmailField {
    emailState: InputValidationState
    loading: boolean
    label: string
    nextEmailFieldChange: (changeEvent: React.ChangeEvent<HTMLInputElement>) => void
    emailInputReference: React.Ref<HTMLInputElement>
}

export const PasswordInput: React.FunctionComponent<InputProps> = props => {
    const { inputRef, ...other } = props
    return (
        <input
            name="password"
            id="password"
            {...other}
            className={classNames('form-control', props.className)}
            placeholder={props.placeholder || 'Password'}
            type="password"
            required={true}
            ref={inputRef}
        />
    )
}

export const EmailInput: React.FunctionComponent<InputProps> = props => {
    const { inputRef, ...other } = props
    return (
        <input
            name="email"
            id="email"
            {...other}
            className={classNames('form-control', props.className)}
            type="email"
            placeholder={props.placeholder || 'Email'}
            spellCheck={false}
            autoComplete="email"
            ref={inputRef}
        />
    )
}

export const UsernameInput: React.FunctionComponent<InputProps> = props => {
    const { inputRef, ...other } = props
    return (
        <input
            name="username"
            id="username"
            {...other}
            className={classNames('form-control', props.className)}
            type="text"
            placeholder={props.placeholder || 'Username'}
            spellCheck={false}
            pattern={VALID_USERNAME_REGEXP}
            maxLength={USERNAME_MAX_LENGTH}
            autoCapitalize="off"
            autoComplete="username"
            ref={inputRef}
        />
    )
}

export const SignupEmailField: React.FunctionComponent<SignupEmailField> = ({
    emailState,
    loading,
    label,
    nextEmailFieldChange,
    emailInputReference,
}) => (
    <div className="form-group d-flex flex-column align-content-start">
        <label
            htmlFor="email"
            className={classNames('align-self-start', {
                'text-danger font-weight-bold': emailState.kind === 'INVALID',
            })}
        >
            {label}
        </label>
        <LoaderInput className={classNames(deriveInputClassName(emailState))} loading={emailState.kind === 'LOADING'}>
            <EmailInput
                className={deriveInputClassName(emailState)}
                onChange={nextEmailFieldChange}
                required={true}
                value={emailState.value}
                disabled={loading}
                autoFocus={true}
                placeholder=" "
                inputRef={emailInputReference}
            />
        </LoaderInput>
        {emailState.kind === 'INVALID' && <small className="invalid-feedback">{emailState.reason}</small>}
    </div>
)

/**
 * Returns the sanitized return-to relative URL (including only the path, search, and fragment).
 * This is the location that a user should be returned to after performing signin or signup to continue
 * to the page they intended to view as an authenticated user.
 *
 * 🚨 SECURITY: We must disallow open redirects (to arbitrary hosts).
 */
export function getReturnTo(location: H.Location): string {
    const searchParameters = new URLSearchParams(location.search)
    const returnTo = searchParameters.get('returnTo') || '/search'
    const newURL = new URL(returnTo, window.location.href)

    newURL.searchParams.append('toast', 'integrations')
    return newURL.pathname + newURL.search + newURL.hash
}
