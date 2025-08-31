import React, { useState, useEffect } from 'react';
import { ChevronLeft, Heart, Users, ChefHat, Star, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import * as d3 from 'd3';

const FLAVORWORLD_COLORS = {
  primary: '#F5A623',
  secondary: '#4ECDC4',
  accent: '#1F3A93',
  background: '#FFF8F0',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E8E8E8',
  success: '#27AE60',
  danger: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  purple: '#9B59B6',
  pink: '#E91E63'
};

// Mock statistics service for demo
const statisticsService = {
  processRealUserData: (userPosts, userId) => ({
    totalLikes: 156,
    totalFollowers: 0,
    totalPosts: userPosts?.length || 8,
    averageLikes: 19,
    likesProgression: [
      { postIndex: 1, likes: 5 },
      { postIndex: 2, likes: 12 },
      { postIndex: 3, likes: 8 },
      { postIndex: 4, likes: 25 },
      { postIndex: 5, likes: 18 },
      { postIndex: 6, likes: 32 },
      { postIndex: 7, likes: 28 },
      { postIndex: 8, likes: 28 }
    ],
    followersGrowth: [],
    categoriesDistribution: [
      { category: 'Italian', count: 3 },
      { category: 'Asian', count: 2 },
      { category: 'Mediterranean', count: 2 },
      { category: 'Desserts', count: 1 }
    ]
  }),
  getFollowersGrowth: async (userId) => ({
    success: true,
    data: [
      { month: 'Jan', followers: 15 },
      { month: 'Feb', followers: 28 },
      { month: 'Mar', followers: 42 },
      { month: 'Apr', followers: 67 },
      { month: 'May', followers: 89 },
      { month: 'Jun', followers: 124 }
    ],
    currentFollowersCount: 124
  })
};

const UserStatisticsScreen = ({ 
  currentUser = { name: 'John Doe' }, 
  userPosts = [],
  userId = '123',
  onBack = () => console.log('Back pressed')
}) => {
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('likes');
  const [statsData, setStatsData] = useState({
    totalLikes: 0,
    totalFollowers: 0,
    totalPosts: 0,
    averageLikes: 0,
    likesProgression: [],
    followersGrowth: [],
    categoriesDistribution: []
  });

  useEffect(() => {
    loadStatisticsData();
  }, [userId, userPosts]);

  const loadStatisticsData = async () => {
    setLoading(true);
    
    try {
      console.log('Loading statistics data');
      
      const realUserData = statisticsService.processRealUserData(userPosts, userId);
      
      try {
        const followersResult = await statisticsService.getFollowersGrowth(userId);
        if (followersResult.success && followersResult.data) {
          realUserData.followersGrowth = followersResult.data;
          realUserData.totalFollowers = followersResult.currentFollowersCount || 0;
          console.log('Followers data retrieved successfully');
        } else {
          console.log('No followers data available');
          realUserData.followersGrowth = [];
          realUserData.totalFollowers = 0;
        }
      } catch (followersError) {
        console.log('Could not fetch followers data');
        realUserData.followersGrowth = [];
        realUserData.totalFollowers = 0;
      }
      
      setStatsData(realUserData);
      console.log('Statistics loaded successfully');
      
    } catch (error) {
      console.error('Statistics loading failed');
      
      const fallbackData = statisticsService.processRealUserData(userPosts, userId);
      setStatsData(fallbackData);
      console.log('Using fallback data');
    } finally {
      setLoading(false);
    }
  };

  const renderLikesChart = () => {
    if (!statsData.likesProgression || statsData.likesProgression.length === 0) {
      return (
        <div className="chart-container">
          <h3 className="chart-title">Likes Progress per Recipe</h3>
          <div className="empty-chart-container">
            <TrendingUp size={60} color={FLAVORWORLD_COLORS.textLight} />
            <p className="empty-chart-text">No recipes yet</p>
            <p className="empty-chart-subtext">Start sharing recipes to see your likes progress!</p>
          </div>
        </div>
      );
    }

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
      .domain([1, statsData.likesProgression.length])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(statsData.likesProgression, d => d.likes) || 10])
      .range([height, 0]);

    const line = d3.line()
      .x(d => xScale(d.postIndex))
      .y(d => yScale(d.likes))
      .curve(d3.curveMonotoneX);

    const pathData = line(statsData.likesProgression);

    return (
      <div className="chart-container">
        <h3 className="chart-title">Likes Progress per Recipe</h3>
        <svg width={600} height={200}>
          <defs>
            <linearGradient id="likesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={FLAVORWORLD_COLORS.primary} stopOpacity="0.8" />
              <stop offset="100%" stopColor={FLAVORWORLD_COLORS.primary} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid lines */}
            {yScale.ticks(5).map((tick, index) => (
              <line
                key={index}
                x1={0}
                y1={yScale(tick)}
                x2={width}
                y2={yScale(tick)}
                stroke={FLAVORWORLD_COLORS.border}
                strokeWidth="1"
                opacity="0.3"
              />
            ))}
            
            {/* Line path */}
            <path
              d={pathData}
              fill="none"
              stroke={FLAVORWORLD_COLORS.primary}
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Data points */}
            {statsData.likesProgression.map((point, index) => (
              <circle
                key={index}
                cx={xScale(point.postIndex)}
                cy={yScale(point.likes)}
                r="4"
                fill={FLAVORWORLD_COLORS.primary}
                stroke={FLAVORWORLD_COLORS.white}
                strokeWidth="2"
              />
            ))}
            
            {/* Y-axis labels */}
            {yScale.ticks(5).map((tick, index) => (
              <text
                key={index}
                x="-10"
                y={yScale(tick)}
                fontSize="12"
                fill={FLAVORWORLD_COLORS.textLight}
                textAnchor="end"
                alignmentBaseline="middle"
              >
                {tick}
              </text>
            ))}
            
            {/* X-axis labels */}
            {statsData.likesProgression.filter((_, i) => i % 2 === 0).map((point, index) => (
              <text
                key={index}
                x={xScale(point.postIndex)}
                y={height + 25}
                fontSize="10"
                fill={FLAVORWORLD_COLORS.textLight}
                textAnchor="middle"
              >
                Recipe {point.postIndex}
              </text>
            ))}
          </g>
        </svg>
      </div>
    );
  };

  const renderFollowersChart = () => {
    if (!statsData.followersGrowth || statsData.followersGrowth.length === 0) {
      return (
        <div className="chart-container">
          <h3 className="chart-title">Followers Growth Over Time</h3>
          <div className="empty-chart-container">
            <Users size={60} color={FLAVORWORLD_COLORS.textLight} />
            <p className="empty-chart-text">No followers data yet</p>
            <p className="empty-chart-subtext">Followers growth data will appear here</p>
          </div>
        </div>
      );
    }

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const xScale = d3.scaleBand()
      .domain(statsData.followersGrowth.map(d => d.month))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(statsData.followersGrowth, d => d.followers) || 10])
      .range([height, 0]);

    return (
      <div className="chart-container">
        <h3 className="chart-title">Followers Growth Over Time</h3>
        <svg width={600} height={200}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid lines */}
            {yScale.ticks(5).map((tick, index) => (
              <line
                key={index}
                x1={0}
                y1={yScale(tick)}
                x2={width}
                y2={yScale(tick)}
                stroke={FLAVORWORLD_COLORS.border}
                strokeWidth="1"
                opacity="0.3"
              />
            ))}
            
            {/* Bars */}
            {statsData.followersGrowth.map((point, index) => (
              <rect
                key={index}
                x={xScale(point.month)}
                y={yScale(point.followers)}
                width={xScale.bandwidth()}
                height={height - yScale(point.followers)}
                fill={FLAVORWORLD_COLORS.secondary}
                rx="4"
              />
            ))}
            
            {/* Y-axis labels */}
            {yScale.ticks(5).map((tick, index) => (
              <text
                key={index}
                x="-10"
                y={yScale(tick)}
                fontSize="12"
                fill={FLAVORWORLD_COLORS.textLight}
                textAnchor="end"
                alignmentBaseline="middle"
              >
                {tick}
              </text>
            ))}
            
            {/* X-axis labels */}
            {statsData.followersGrowth.map((point, index) => (
              <text
                key={index}
                x={xScale(point.month) + xScale.bandwidth() / 2}
                y={height + 25}
                fontSize="12"
                fill={FLAVORWORLD_COLORS.textLight}
                textAnchor="middle"
              >
                {point.month}
              </text>
            ))}
          </g>
        </svg>
      </div>
    );
  };

  const renderCategoriesChart = () => {
    if (!statsData.categoriesDistribution || statsData.categoriesDistribution.length === 0) {
      return (
        <div className="chart-container">
          <h3 className="chart-title">Recipe Categories Distribution</h3>
          <div className="empty-chart-container">
            <PieChart size={60} color={FLAVORWORLD_COLORS.textLight} />
            <p className="empty-chart-text">No categories yet</p>
            <p className="empty-chart-subtext">Share recipes with different categories to see distribution</p>
          </div>
        </div>
      );
    }

    const width = 600;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 40;
    const centerX = width / 2;
    const centerY = height / 2;

    const colors = [
      FLAVORWORLD_COLORS.primary,
      FLAVORWORLD_COLORS.secondary,
      FLAVORWORLD_COLORS.accent,
      FLAVORWORLD_COLORS.success,
      FLAVORWORLD_COLORS.warning,
      FLAVORWORLD_COLORS.info,
      FLAVORWORLD_COLORS.purple,
      FLAVORWORLD_COLORS.pink
    ];

    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    const pieData = pie(statsData.categoriesDistribution);

    return (
      <div className="chart-container">
        <h3 className="chart-title">Recipe Categories Distribution</h3>
        <svg width={width} height={height}>
          <g transform={`translate(${centerX},${centerY})`}>
            {pieData.map((slice, index) => {
              const pathData = arc(slice);
              const labelPos = arc.centroid(slice);
              
              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill={colors[index % colors.length]}
                    stroke={FLAVORWORLD_COLORS.white}
                    strokeWidth="2"
                  />
                  <text
                    x={labelPos[0]}
                    y={labelPos[1]}
                    fontSize="12"
                    fill={FLAVORWORLD_COLORS.white}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontWeight="bold"
                  >
                    {slice.data.count}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        
        {/* Legend */}
        <div className="legend">
          {statsData.categoriesDistribution.map((item, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="legend-text">
                {item.category} ({item.count})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStatsCards = () => (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="stat-icon">
          <Heart size={24} color={FLAVORWORLD_COLORS.danger} />
        </div>
        <div className="stat-number">{statsData.totalLikes}</div>
        <div className="stat-label">Total Likes</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon">
          <Users size={24} color={FLAVORWORLD_COLORS.secondary} />
        </div>
        <div className="stat-number">{statsData.totalFollowers}</div>
        <div className="stat-label">Followers</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon">
          <ChefHat size={24} color={FLAVORWORLD_COLORS.primary} />
        </div>
        <div className="stat-number">{statsData.totalPosts}</div>
        <div className="stat-label">Recipes</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon">
          <Star size={24} color={FLAVORWORLD_COLORS.warning} />
        </div>
        <div className="stat-number">{statsData.averageLikes}</div>
        <div className="stat-label">Avg Likes</div>
      </div>
    </div>
  );

  const renderTabBar = () => (
    <div className="tab-container">
      {[
        { key: 'likes', label: 'Likes Progress', icon: TrendingUp },
        { key: 'followers', label: 'Followers Growth', icon: Users },
        { key: 'categories', label: 'Categories', icon: PieChart }
      ].map(tab => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.key}
            className={`tab ${selectedTab === tab.key ? 'active-tab' : ''}`}
            onClick={() => setSelectedTab(tab.key)}
          >
            <IconComponent 
              size={20} 
              color={selectedTab === tab.key ? FLAVORWORLD_COLORS.white : FLAVORWORLD_COLORS.textLight}
            />
            <span className={`tab-text ${selectedTab === tab.key ? 'active-tab-text' : ''}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderCurrentChart = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading statistics...</p>
        </div>
      );
    }

    switch (selectedTab) {
      case 'likes':
        return renderLikesChart();
      case 'followers':
        return renderFollowersChart();
      case 'categories':
        return renderCategoriesChart();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="header">
          <button className="back-button" onClick={onBack}>
            <ChevronLeft size={24} color={FLAVORWORLD_COLORS.accent} />
          </button>
          <h1 className="header-title">My Statistics</h1>
          <div className="placeholder" />
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your cooking statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <button className="back-button" onClick={onBack}>
          <ChevronLeft size={24} color={FLAVORWORLD_COLORS.accent} />
        </button>
        <h1 className="header-title">My Statistics</h1>
        <div className="placeholder" />
      </div>
      
      <div className="content">
        {renderStatsCards()}
        {renderTabBar()}
        {renderCurrentChart()}
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background-color: ${FLAVORWORLD_COLORS.background};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: ${FLAVORWORLD_COLORS.white};
          border-bottom: 1px solid ${FLAVORWORLD_COLORS.border};
        }
        
        .back-button {
          padding: 8px;
          background-color: ${FLAVORWORLD_COLORS.background};
          border: none;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .back-button:hover {
          background-color: ${FLAVORWORLD_COLORS.border};
        }
        
        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: ${FLAVORWORLD_COLORS.text};
          flex: 1;
          text-align: center;
          margin: 0;
        }
        
        .placeholder {
          width: 40px;
        }
        
        .content {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .stat-card {
          background-color: ${FLAVORWORLD_COLORS.white};
          border-radius: 15px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
        }
        
        .stat-icon {
          margin-bottom: 10px;
          display: flex;
          justify-content: center;
        }
        
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: ${FLAVORWORLD_COLORS.text};
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 14px;
          color: ${FLAVORWORLD_COLORS.textLight};
          font-weight: 500;
        }
        
        .tab-container {
          display: flex;
          background-color: ${FLAVORWORLD_COLORS.white};
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          gap: 4px;
        }
        
        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 8px;
          border: none;
          border-radius: 8px;
          gap: 6px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .tab:hover {
          background-color: ${FLAVORWORLD_COLORS.background};
        }
        
        .active-tab {
          background-color: ${FLAVORWORLD_COLORS.primary} !important;
        }
        
        .tab-text {
          font-size: 12px;
          font-weight: 600;
          color: ${FLAVORWORLD_COLORS.textLight};
          transition: color 0.2s ease;
        }
        
        .active-tab-text {
          color: ${FLAVORWORLD_COLORS.white};
        }
        
        .chart-container {
          background-color: ${FLAVORWORLD_COLORS.white};
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
        }
        
        .chart-title {
          font-size: 16px;
          font-weight: bold;
          color: ${FLAVORWORLD_COLORS.text};
          margin-bottom: 15px;
          text-align: center;
          margin-top: 0;
        }
        
        .legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 15px;
          gap: 10px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          margin: 0 5px 2px;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 6px;
          margin-right: 6px;
        }
        
        .legend-text {
          font-size: 12px;
          color: ${FLAVORWORLD_COLORS.textLight};
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 0;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid ${FLAVORWORLD_COLORS.border};
          border-top: 4px solid ${FLAVORWORLD_COLORS.primary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-text {
          font-size: 16px;
          color: ${FLAVORWORLD_COLORS.textLight};
          text-align: center;
          margin-top: 15px;
          margin-bottom: 0;
        }

        .empty-chart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .empty-chart-text {
          font-size: 18px;
          font-weight: 600;
          color: ${FLAVORWORLD_COLORS.text};
          margin: 15px 0 8px;
        }

        .empty-chart-subtext {
          font-size: 14px;
          color: ${FLAVORWORLD_COLORS.textLight};
          text-align: center;
          line-height: 1.4;
          margin: 0;
        }

        @media (max-width: 768px) {
          .content {
            padding: 15px;
          }
          
          .stats-cards {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
          }
          
          .stat-card {
            padding: 15px;
          }
          
          .tab-text {
            display: none;
          }
          
          .chart-container svg {
            width: 100%;
            height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default UserStatisticsScreen;