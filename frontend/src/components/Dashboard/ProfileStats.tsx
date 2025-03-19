import React from 'react';

interface StatsItem {
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
}

const ProfileStats: React.FC = () => {
  // Mock stats data - would be replaced with actual data fetch
  const stats: StatsItem[] = [
    {
      label: 'Total Profiles',
      value: 5,
      change: {
        value: 20,
        isPositive: true
      }
    },
    {
      label: 'Total Documents',
      value: 23,
      change: {
        value: 12,
        isPositive: true
      }
    },
    {
      label: 'Queries This Month',
      value: 342,
      change: {
        value: 5,
        isPositive: true
      }
    },
    {
      label: 'Avg. Response Time',
      value: '1.2s',
      change: {
        value: 10,
        isPositive: false
      }
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Usage Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow p-5 border border-gray-200"
          >
            <div className="text-gray-500 text-sm mb-1">{stat.label}</div>
            <div className="flex items-end">
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              {stat.change && (
                <div className={`ml-2 text-sm flex items-center ${
                  stat.change.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span>
                    {stat.change.isPositive ? '↑' : '↓'} {stat.change.value}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileStats; 