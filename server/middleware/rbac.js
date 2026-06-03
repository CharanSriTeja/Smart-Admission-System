/**
 * @fileoverview Role-Based Access Control middleware.
 * Returns a middleware that restricts access to users whose role is
 * included in the provided allow-list.
 */

/**
 * Create an authorization middleware that checks the user's role.
 * @param {...string} roles - One or more allowed roles (e.g. 'HOD', 'Volunteer').
 * @returns {import('express').RequestHandler} Express middleware.
 *
 * @example
 *   router.get('/admin', auth, authorize('HOD'), adminHandler);
 */
const authorize = (...roles) => {
  const allowedRoles = roles.map((r) => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization.',
      });
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
      });
    }

    next();
  };
};

export default authorize;
