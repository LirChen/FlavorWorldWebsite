import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  PieChart,
  Heart,
  BookOpen,
  Star,
  Loader2
} from 'lucide-react';
import './UserStatisticsScreen.css';
import { statisticsService } from '../../services/statisticsService';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const COLORS = {
  primary: '#F5A623',
  secondary: '#4ECDC4',
  accent: '#1F3A93',
  success: '#27AE60',
  danger: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  purple: '#9B59B6',
  pink: '#E91E63'
};

const UserStatisticsScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  
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
  }, [userId]);

  const loadStatisticsData = async () => {
    setLoading(true);
    
    try {
      // Load user posts
      const postsResult = await statisticsService.getUserPosts(userId);
      const userPosts = postsResult.success ? postsResult.data : [];
      
      const realUserData = statisticsService.processRealUserData(userPosts, userId);
      
      try {
        const followersResult = await statisticsService.getFollowersGrowth(userId);
        if (followersResult.success && followersResult.data) {
          realUserData.followersGrowth = followersResult.data;
          realUserData.totalFollowers = followersResult.currentFollowersCount || 0;
        } else {
          realUserData.followersGrowth = [];
          realUserData.totalFollowers = 0;
        }
      } catch (followersError) {
        realUserData.followersGrowth = [];
        realUserData.totalFollowers = 0;
      }
      
      setStatsData(realUserData);
      
    } catch (error) {
      console.error('Statistics loading failed:', error);
      
      const fallbackData = {
        totalLikes: 0,
        totalFollowers: 0,
        totalPosts: 0,
        averageLikes: 0,
        likesProgression: [],
        followersGrowth: [],
        categoriesDistribution: []
      };
      setStatsData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const getLikesChartData = () => {
    if (!statsData.likesProgression || statsData.likesProgression.length === 0) {
      return null;
    }

    return {
      labels: statsData.likesProgression.map(d => `Recipe ${d.postIndex}`),
      datasets: [
        {
          label: 'Likes per Recipe',
          data: statsData.likesProgression.map(d => d.likes),
          borderColor: COLORS.primary,
          backgroundColor: `${COLORS.primary}33`,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: COLORS.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };
  };

  const getFollowersChartData = () => {
    if (!statsData.followersGrowth || statsData.followersGrowth.length === 0) {
      return null;
    }

    return {
      labels: statsData.followersGrowth.map(d => d.month),
      datasets: [
        {
          label: 'Followers',
          data: statsData.followersGrowth.map(d => d.followers),
          backgroundColor: COLORS.secondary,
          borderRadius: 8
        }
      ]
    };
  };

  const getCategoriesChartData = () => {
    if (!statsData.categoriesDistribution || statsData.categoriesDistribution.length === 0) {
      return null;
    }

    const colors = [
      COLORS.primary,
      COLORS.secondary,
      COLORS.accent,
      COLORS.success,
      COLORS.warning,
      COLORS.info,
      COLORS.purple,
      COLORS.pink
    ];

    return {
      labels: statsData.categoriesDistribution.map(d => d.category),
      datasets: [
        {
          data: statsData.categoriesDistribution.map(d => d.count),
          backgroundColor: colors.slice(0, statsData.categoriesDistribution.length),
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    }
  };

  const renderStatsCards = () => (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="stat-icon" style={{ color: COLORS.danger }}>
          <Heart size={24} />
        </div>
        <div className="stat-info">
          <h3>{statsData.totalLikes}</h3>
          <p>Total Likes</p>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon" style={{ color: COLORS.secondary }}>
          <Users size={24} />
        </div>
        <div className="stat-info">
          <h3>{statsData.totalFollowers}</h3>
          <p>Followers</p>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon" style={{ color: COLORS.primary }}>
          <BookOpen size={24} />
        </div>
        <div className="stat-info">
          <h3>{statsData.totalPosts}</h3>
          <p>Recipes</p>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon" style={{ color: COLORS.warning }}>
          <Star size={24} />
        </div>
        <div className="stat-info">
          <h3>{statsData.averageLikes}</h3>
          <p>Avg Likes</p>
        </div>
      </div>
    </div>
  );

  const renderLikesChart = () => {
    const chartData = getLikesChartData();

    if (!chartData) {
      return (
        <div className="empty-chart">
          <TrendingUp size={60} />
          <h3>No recipes yet</h3>
          <p>Start sharing recipes to see your likes progress!</p>
        </div>
      );
    }

    return (
      <div className="chart-container">
        <h3>Likes Progress per Recipe</h3>
        <div className="chart-wrapper">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    );
  };

  const renderFollowersChart = () => {
    const chartData = getFollowersChartData();

    if (!chartData) {
      return (
        <div className="empty-chart">
          <Users size={60} />
          <h3>No followers data yet</h3>
          <p>Followers growth data will appear here</p>
        </div>
      );
    }

    return (
      <div className="chart-container">
        <h3>Followers Growth Over Time</h3>
        <div className="chart-wrapper">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    );
  };

  const renderCategoriesChart = () => {
    const chartData = getCategoriesChartData();

    if (!chartData) {
      return (
        <div className="empty-chart">
          <PieChart size={60} />
          <h3>No categories yet</h3>
          <p>Share recipes with different categories to see distribution</p>
        </div>
      );
    }

    return (
      <div className="chart-container">
        <h3>Recipe Categories Distribution</h3>
        <div className="chart-wrapper doughnut">
          <Doughnut data={chartData} options={doughnutOptions} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="statistics-screen">
        <header className="stats-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>My Statistics</h1>
          <div className="header-placeholder" />
        </header>
        
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-screen">
      {/* Header */}
      <header className="stats-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>My Statistics</h1>
        <div className="header-placeholder" />
      </header>

      <div className="stats-content">
        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Tabs */}
        <div className="stats-tabs">
          <button
            className={selectedTab === 'likes' ? 'active' : ''}
            onClick={() => setSelectedTab('likes')}
          >
            <TrendingUp size={20} />
            <span>Likes Progress</span>
          </button>
          <button
            className={selectedTab === 'followers' ? 'active' : ''}
            onClick={() => setSelectedTab('followers')}
          >
            <Users size={20} />
            <span>Followers Growth</span>
          </button>
          <button
            className={selectedTab === 'categories' ? 'active' : ''}
            onClick={() => setSelectedTab('categories')}
          >
            <PieChart size={20} />
            <span>Categories</span>
          </button>
        </div>

        {/* Charts */}
        <div className="charts-section">
          {selectedTab === 'likes' && renderLikesChart()}
          {selectedTab === 'followers' && renderFollowersChart()}
          {selectedTab === 'categories' && renderCategoriesChart()}
        </div>
      </div>
    </div>
  );
};

export default UserStatisticsScreen;