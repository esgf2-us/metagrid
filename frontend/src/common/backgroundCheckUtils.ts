import { fetchSearchResults, generateSearchURLQuery } from '../api';
import { UserSearchQueries, UserSearchQuery } from '../components/Cart/types';

export const shouldRunBackgroundCheck = (lastAppLoadTime: number | null): boolean => {
  if (!lastAppLoadTime) return true; // First time loading

  const now = Date.now();
  const eightHoursInMs = 8 * 60 * 60 * 1000;
  return now - lastAppLoadTime >= eightHoursInMs;
};

export const checkSearchForChanges = async (
  searchQuery: UserSearchQuery,
): Promise<{ count: number; checkedSince: number }> => {
  if (!searchQuery.lastCheckedTime) {
    return { count: 0, checkedSince: Date.now() };
  }

  const checkedSince = searchQuery.lastCheckedTime;
  const filterTimestamp = new Date(checkedSince).toISOString();
  const checkUrl = generateSearchURLQuery(
    { ...searchQuery, filterCreatedSince: filterTimestamp },
    { page: 0, pageSize: 0 },
  );

  const response = await fetchSearchResults([checkUrl]);
  const searchData = (response as { search?: { numMatched?: number; numberMatched?: number } })
    .search;
  const count = searchData?.numMatched || searchData?.numberMatched || 0;

  return { count, checkedSince };
};

export const runBackgroundChecks = async (
  userSearchQueries: UserSearchQueries,
): Promise<Record<string, { count: number; checkedSince: number }>> => {
  // Filter for subscribed STAC searches only
  const subscribedSearches = userSearchQueries.filter(
    (query) => query.isSubscribed && query.project.isSTAC && query.lastCheckedTime,
  );

  if (subscribedSearches.length === 0) {
    return {};
  }

  const changesMap: Record<string, { count: number; checkedSince: number }> = {};

  // Run checks in parallel with Promise.all
  await Promise.all(
    subscribedSearches.map(async (search) => {
      try {
        const result = await checkSearchForChanges(search);
        if (result.count > 0) {
          changesMap[search.uuid] = result;
        }
      } catch (error) {
        console.error(`Failed to check search ${search.uuid}:`, error);
      }
    }),
  );

  return changesMap;
};
