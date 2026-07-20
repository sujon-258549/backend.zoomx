/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import config from '../config';
import handleCastError from '../errors/handleCastError';
import handleDuplicateError from '../errors/handleDuplicateError';
import handleValidationError from '../errors/handleValidationError';
import handleZodError from '../errors/handleZodError';
import { TErrorSources } from '../interface/error';
import AppError from '../errors/appError';
import { ErrorLogServices } from '../modules/errorLog/errorLog.service';

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    //setting default values
    let statusCode = 500;
    let message = 'Something went wrong!';
    let errorSources: TErrorSources = [
        {
            path: '',
            message: 'Something went wrong',
        },
    ];

    if (err instanceof ZodError) {
        const simplifiedError = handleZodError(err);
        statusCode = simplifiedError?.statusCode;
        message = simplifiedError?.message;
        errorSources = simplifiedError?.errorSources;
    } else if (err?.name === 'ValidationError') {
        const simplifiedError = handleValidationError(err);
        statusCode = simplifiedError?.statusCode;
        message = simplifiedError?.message;
        errorSources = simplifiedError?.errorSources;
    } else if (err?.name === 'CastError') {
        const simplifiedError = handleCastError(err);
        statusCode = simplifiedError?.statusCode;
        message = simplifiedError?.message;
        errorSources = simplifiedError?.errorSources;
    } else if (err?.code === 11000) {
        const simplifiedError = handleDuplicateError(err);
        statusCode = simplifiedError?.statusCode;
        message = simplifiedError?.message;
        errorSources = simplifiedError?.errorSources;
    } else if (err instanceof AppError) {
        statusCode = err?.statusCode;
        message = err.message;
        errorSources = [
            {
                path: '',
                message: err?.message,
            },
        ];
    } else if (err instanceof Error) {
        message = err.message;
        errorSources = [
            {
                path: '',
                message: err?.message,
            },
        ];
    }

    // Persist a copy of the error to the ErrorLog collection so it shows up
    // under Logs → Error Logs in the admin. Don't await — never block the
    // response on logging. Failures inside recordError are swallowed.
    const reqUser = (req as any).user as
        | { userId?: string; email?: string; role?: string }
        | undefined;
    void ErrorLogServices.recordError({
        message,
        statusCode,
        method: req.method,
        route: req.originalUrl,
        errorName: err?.name,
        errorSources,
        stack: err?.stack,
        userId: reqUser?.userId,
        email: reqUser?.email,
        role: reqUser?.role,
        body: req.body,
        query: req.query as Record<string, unknown>,
        params: req.params,
        clientDetails: {
            ipAddress:
                (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                req.socket?.remoteAddress,
            userAgent: req.headers['user-agent'] as string,
            browserUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        },
    });

    // Handle the error response
    res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        err,
        stack: config.NODE_ENV === 'development' ? err?.stack : null,
    });

    // Do not return anything (ensure this handler does not return a value)
    return;
};

export default globalErrorHandler;
