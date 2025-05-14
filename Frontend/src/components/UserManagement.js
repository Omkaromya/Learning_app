import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import '../styles/UserManagement.css';
import { getFetchOptions, fetchWithCorsHandling } from '../services/api';
import { fetchUsers, deleteUser, deleteUsers } from '../store/slices/userSlice';

ChartJS.register(ArcElement, Tooltip, Legend);

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, error, selectedUsers } = useSelector((state) => state.users);
  const [userStats, setUserStats] = useState({
    total_users: 0,
    active_users: 0,
    new_users_this_month: 0
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await fetchWithCorsHandling(
          'http://127.0.0.1:8000/auth/statistics',
          getFetchOptions('GET')
        );
        const data = await response.json();
        setUserStats(data);
      } catch (error) {
        console.error('Error fetching user statistics:', error);
      }
    };

    fetchUserStats();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        // Refresh the user list after successful deletion
        dispatch(fetchUsers({ skip: 0, limit: 20 }));
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const chartData = {
    labels: ['Active Users', 'Inactive Users'],
    datasets: [
      {
        data: [userStats.active_users, userStats.total_users - userStats.active_users],
        backgroundColor: ['#4CAF50', '#E0E0E0'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 14
          }
        }
      }
    },
    cutout: '70%'
  };

  return (
    <div className="user-management">
      <h2>User Management</h2>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-number">{userStats.total_users.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <div className="stat-number">{userStats.active_users.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>New Users (This Month)</h3>
          <div className="stat-number">{userStats.new_users_this_month.toLocaleString()}</div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-wrapper">
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 