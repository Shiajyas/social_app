import React, { useState, useEffect } from 'react';
import { useAdminOverview } from '@/hooks/admin/useAdminOverview';
import { socket } from '@/utils/Socket';
import { useReportStore } from '@/appStore/useReportStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

const dateRanges = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last Month', value: '1m' },
  { label: 'Last Year', value: '1y' },
];

const Main = () => {
  const [range, setRange] = useState<'7d' | '1m' | '1y'>('7d');
  const [likeRange, setLikeRange] = useState({ min: 0, max: 100 });
  const [onlineUserCount, setOnlineUserCount] = useState<number>(0);
  const { reportCount } = useReportStore();
  const { data, isLoading, refetch } = useAdminOverview(range, likeRange);

  useEffect(() => {
    socket.on('admin:updateOnlineCount', (count: number) => {
      setOnlineUserCount(count);
    });
    return () => {
      socket.off('admin:updateOnlineCount');
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="text-gray-500 dark:text-gray-300 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-red-600 dark:text-red-400">Failed to load data</div>;
  }

  const handleLikeFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLikeRange((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRange(e.target.value as '7d' | '1m' | '1y');
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header and Actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <button
          onClick={() => refetch()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Date Range
          </label>
          <select
            className="mt-1 border dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded px-3 py-1"
            value={range}
            onChange={handleRangeChange}
          >
            {dateRanges.map(({ label, value }) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Min Likes
          </label>
          <input
            type="number"
            name="min"
            className="mt-1 border dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded px-3 py-1 w-24"
            value={likeRange.min}
            onChange={handleLikeFilterChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Max Likes
          </label>
          <input
            type="number"
            name="max"
            className="mt-1 border dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded px-3 py-1 w-24"
            value={likeRange.max}
            onChange={handleLikeFilterChange}
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Users"
          data={[
            `Total: ${data.users.total}`,
            `New (last period): ${data.users.new}`,
            `Online now: ${onlineUserCount}`,
          ]}
        />

        <StatsCard
          title="Posts"
          data={[`Total: ${data.posts.total}`, `Reported: ${reportCount}`]}
        />
        <StatsCard title="Comments" data={[`Total: ${data.comments.total}`]} />
        <StatsCard
          title="Subscriptions"
          data={[`Active: ${data.subscriptions.active}`, `New: ${data.subscriptions.new}`]}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="User Growth">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.users.weeklyGrowth}>
              <XAxis dataKey="_id" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most Liked Posts">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data.posts.mostLiked.map((post: any) => ({
                ...post,
                displayTitle: `${post.title} (${post?.owner?.username || 'Unknown'})`,
              }))}
            >
              <XAxis dataKey="displayTitle" tick={{ fontSize: 10 }} angle={-30} interval={0} />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`${value} likes`, 'Likes']}
                labelFormatter={(label) => `Post: ${label}`}
              />
              <CartesianGrid strokeDasharray="3 3" />
              <Bar dataKey="likes" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Posting Activity">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.users.postingActivity}>
              <XAxis dataKey="username" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" />
              <Bar dataKey="posts" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

const StatsCard = ({ title, data }: { title: string; data: string[] }) => (
  <div className="bg-white dark:bg-gray-800 dark:text-white shadow rounded p-5">
    <h2 className="text-lg font-semibold mb-2">{title}</h2>
    {data.map((text, i) => (
      <p key={i}>{text}</p>
    ))}
  </div>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 dark:text-white shadow rounded p-5">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

export default Main;
