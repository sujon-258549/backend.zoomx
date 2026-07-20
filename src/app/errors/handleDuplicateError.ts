/* eslint-disable @typescript-eslint/no-explicit-any */
import { TErrorSources, TGenericErrorResponse } from '../interface/error';

const handleDuplicateError = (err: any): TGenericErrorResponse => {
    // Extract field and value from err.keyValue if available (modern MongoDB)
    let field = '';
    let value = '';
    
    if (err.keyValue) {
        field = Object.keys(err.keyValue)[0];
        value = err.keyValue[field];
    } else {
        // Fallback to regex extraction for older MongoDB formats
        const match = err.message.match(/"([^"]*)"/);
        value = match && match[1] ? match[1] : 'Value';
    }

    const errorMessage = field 
        ? `${field} '${value}' already exists` 
        : `${value} already exists`;

    const errorSources: TErrorSources = [
        {
            path: field,
            message: errorMessage,
        },
    ];

    const statusCode = 400;

    return {
        statusCode,
        message: errorMessage,
        errorSources,
    };
};

export default handleDuplicateError;