export const authorizeSelf = (paramName = "id") => (req, res, next) => {
  const authenticatedUserId = req.user?._id?.toString();
  const requestedUserId = req.params[paramName];

  if (!authenticatedUserId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (authenticatedUserId !== requestedUserId) {
    return res.status(403).json({
      message: "You can only access your own profile",
    });
  }

  next();
};

export const authorizeOwner = (getOwnerId) => (req, res, next) => {
  const authenticatedUserId = req.user?._id?.toString();
  const ownerId = getOwnerId(req)?.toString();

  if (!authenticatedUserId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!ownerId || authenticatedUserId !== ownerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

export default authorizeSelf;