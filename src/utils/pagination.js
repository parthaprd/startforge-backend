const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

const parsePagination = (query = {}) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildPagination = (count, page, limit) => {
  const total = Math.max(Math.ceil(count / limit), count === 0 ? 0 : 1);
  return {
    current: page,
    total,
    count,
    limit,
    hasNext: page < total,
    hasPrev: page > 1,
  };
};

module.exports = {
  parsePagination,
  buildPagination,
  MAX_LIMIT,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
};
