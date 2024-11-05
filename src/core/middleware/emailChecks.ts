import { Request, Response, NextFunction } from "express";
import { isValidEmail } from "../../routes/auth/register";

// middleware functions may be defined elsewhere!
export const emailMiddlewareCheck = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if (isValidEmail(request.body.email)) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing email  - please refer to documentation',
        });
    }
};