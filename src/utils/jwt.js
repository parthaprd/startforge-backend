
const deprecated = () => {
  throw new Error(
    'jwt utility is removed. Authentication is handled by Better Auth.'
  );
};

module.exports = {
  signToken: deprecated,
  verifyToken: deprecated,
};
