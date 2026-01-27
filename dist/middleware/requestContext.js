import { v4 as uuid } from "uuid";
export const requestContext = (req, _res, next) => {
    req.requestId = uuid();
    next();
};
