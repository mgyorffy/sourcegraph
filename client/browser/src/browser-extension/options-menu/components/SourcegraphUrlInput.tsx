import classNames from 'classnames'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Observable } from 'rxjs'

import { LoaderInput } from '@sourcegraph/branded/src/components/LoaderInput'
import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import { useInputValidation, deriveInputClassName } from '@sourcegraph/shared/src/util/useInputValidation'

import { CLOUD_SOURCEGRAPH_URL } from '../../../shared/platform/sourcegraphUrl'
import { LINK_PROPS, URL_AUTH_ERROR, URL_FETCH_ERROR } from '../constants'

import { InfoText } from './InfoText'

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" className={className} height="16" viewBox="0 0 8 8">
        <path
            fill="#37b24d"
            d="M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z"
        />
    </svg>
)

export interface SourcegraphURLInputProps {
    label: string
    description: JSX.Element | string
    initialValue: string
    className?: string
    validate: (url: string) => Observable<string | undefined>
    editable?: boolean
    onChange?: (value: string) => void
}
export const SourcegraphURLInput: React.FC<SourcegraphURLInputProps> = ({
    label,
    description,
    className,
    editable = true,
    initialValue,
    onChange,
    validate,
}) => {
    const urlInputReference = useRef<HTMLInputElement | null>(null)
    const [urlState, nextUrlFieldChange, nextUrlInputElement] = useInputValidation(
        useMemo(
            () => ({
                initialValue,
                synchronousValidators: [],
                asynchronousValidators: [validate],
            }),
            [initialValue, validate]
        )
    )
    const urlInputElements = useCallback(
        (urlInputElement: HTMLInputElement | null) => {
            urlInputReference.current = urlInputElement
            nextUrlInputElement(urlInputElement)
        },
        [nextUrlInputElement]
    )
    useEffect(() => {
        if (urlState.kind === 'VALID') {
            onChange?.(urlState.value)
        }
    }, [onChange, urlState])
    const isLoading = urlState.kind === 'LOADING' && !!urlState.value
    return (
        <div className={classNames('position-relative', className)}>
            <label htmlFor="sourcegraph-url">{label}</label>
            <div
                className={classNames({
                    'options-page__input-disabled': !editable,
                })}
            >
                <LoaderInput loading={isLoading} className={classNames(deriveInputClassName(urlState))}>
                    <input
                        className={classNames(
                            'form-control',
                            'mb-2',
                            urlState.value ? deriveInputClassName(urlState) : '',
                            'test-sourcegraph-url'
                        )}
                        id="sourcegraph-url"
                        type="url"
                        pattern="^https://.*"
                        placeholder="https://sourcegraph.example.com"
                        value={urlState.value}
                        onChange={nextUrlFieldChange}
                        ref={urlInputElements}
                        spellCheck={false}
                        disabled={!editable}
                    />
                </LoaderInput>
                {urlState.value ? (
                    <>
                        {urlState.kind === 'LOADING' && <small className="text-muted d-block mt-1">Checking...</small>}
                        {urlState.kind === 'INVALID' && (
                            <small className="invalid-feedback">
                                {urlState.reason === URL_FETCH_ERROR ? (
                                    'Incorrect Sourcegraph instance address'
                                ) : urlState.reason === URL_AUTH_ERROR ? (
                                    <>
                                        Authentication to Sourcegraph failed.{' '}
                                        <a href={urlState.value} {...LINK_PROPS}>
                                            Sign in to your instance
                                        </a>{' '}
                                        to continue
                                    </>
                                ) : urlInputReference.current?.validity.typeMismatch ? (
                                    'Please enter a valid URL, including the protocol prefix (e.g. https://sourcegraph.example.com).'
                                ) : urlInputReference.current?.validity.patternMismatch ? (
                                    'The browser extension can only work over HTTPS in modern browsers.'
                                ) : (
                                    urlState.reason
                                )}
                            </small>
                        )}
                        {urlState.kind === 'VALID' && (
                            <small className="valid-feedback test-valid-sourcegraph-url-feedback">Looks good!</small>
                        )}
                    </>
                ) : (
                    <InfoText>{description}</InfoText>
                )}
            </div>
            <div className="options-page__icon-container position-absolute d-flex justify-content-center align-items-center">
                {!editable &&
                    (urlState.kind === 'LOADING' ? (
                        <LoadingSpinner className="options-page__icon-loading" />
                    ) : urlState.kind === 'VALID' ? (
                        <CheckIcon className="options-page__icon-check" />
                    ) : (
                        <small className="options-page__text-error">{CLOUD_SOURCEGRAPH_URL} is down</small>
                    ))}
            </div>
            {!editable && <InfoText>{description}</InfoText>}
        </div>
    )
}