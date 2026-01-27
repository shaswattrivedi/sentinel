export const success = (req, data) => ({
    status: "success",
    data,
    metadata: {
        timestamp: new Date().toISOString(),
        request_id: req.requestId ?? ""
    }
});
export const failure = (req, code, message, details) => ({
    status: "error",
    error: { code, message, details }
});
