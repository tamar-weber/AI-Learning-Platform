// Wraps an async Express handler so thrown errors / rejected promises are
// automatically forwarded to next(error), instead of every controller
// repeating the same try { ... } catch (error) { next(error); } boilerplate.
//
// Usage:
//   const asyncHandler = require('../utils/asyncHandler');
//   router.get('/x', asyncHandler(async (req, res) => { ... }));
function asyncHandler(fn) {
    return function wrappedHandler(req, res, next) {
        return Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;
