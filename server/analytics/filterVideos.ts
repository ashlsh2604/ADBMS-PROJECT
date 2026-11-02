import type { FilterState, Video } from '../../src/types/database.js';

const DAY_MS = 86400000;
const RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

export function filterVideos(videos: Video[], filter: Partial<FilterState> = {}, now = new Date()): Video[] {
  let list = [...videos];
  if (filter.category && filter.category !== 'all') list = list.filter((v) => v.category === filter.category);
  if (filter.bikeFilter) {
    const q = filter.bikeFilter.toLowerCase();
    list = list.filter((v) => v.bike_model.toLowerCase().includes(q));
  }
  if (filter.searchQuery?.trim()) {
    const q = filter.searchQuery.toLowerCase().trim();
    list = list.filter((v) =>
      v.title.toLowerCase().includes(q) ||
      v.bike_model.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }
  if (filter.dateRange && filter.dateRange !== 'all') {
    const days = RANGE_DAYS[filter.dateRange];
    if (days) {
      const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      list = list.filter((v) => {
        const upload = new Date(`${v.upload_date}T00:00:00Z`).getTime();
        const age = (today - upload) / DAY_MS;
        return age >= 0 && age <= days;
      });
    }
  }
  const sortBy = filter.sortBy || 'views';
  const direction = filter.sortOrder === 'asc' ? 1 : -1;
  list.sort((a, b) => {
    const av = sortBy === 'upload_date' ? new Date(a.upload_date).getTime() : Number(a[sortBy]);
    const bv = sortBy === 'upload_date' ? new Date(b.upload_date).getTime() : Number(b[sortBy]);
    return (av - bv) * direction;
  });
  return list;
}
