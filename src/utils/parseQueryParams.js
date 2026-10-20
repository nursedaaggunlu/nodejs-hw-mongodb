const parseNumber = (value, defaultValue) => {
  if (typeof value !== 'string') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const parseQueryParams = (query) => {
  const { page, perPage, sortBy, sortOrder, type, isFavourite } = query;

  const parsedPage = parseNumber(page, 1);
  const parsedPerPage = parseNumber(perPage, 10);

  const parsedSortBy = typeof sortBy === 'string' ? sortBy : 'name';
  const parsedSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

  const filter = {};
  if (typeof type === 'string' && ['work', 'home', 'personal'].includes(type)) {
    filter.contactType = type;
  }
  if (isFavourite === 'true') {
    filter.isFavourite = true;
  } else if (isFavourite === 'false') {
    filter.isFavourite = false;
  }

  return {
    page: parsedPage,
    perPage: parsedPerPage,
    sortBy: parsedSortBy,
    sortOrder: parsedSortOrder,
    filter,
  };
};
