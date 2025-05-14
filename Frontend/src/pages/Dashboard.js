import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import UserManagement from '../components/UserManagement';
import CourseAnalytics from '../components/CourseAnalytics';
import Courses from '../components/Courses';
import TextEditor from '../components/TextEditor';
import Exam from '../components/Exam';
import Support from '../components/Support';
import { getCurrentUser } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Try to get user from storage first
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Only store username, not the full user object
      setUser({ username: parsedUser.username });
    } else {
      // If not in storage, fetch from API
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
          // Only store username from the API response
          setUser({ username: userData.username });
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry_time');
    localStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token_expiry_time');
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const renderContent = () => {
    const path = location.pathname;
    if (path === '/dashboard') {
        return (
          <>
            <UserManagement />
            <CourseAnalytics />
          </>
        );
    } else if (path === '/courses') {
        return <Courses />;
    } else if (path === '/profile') {
        return <TextEditor />;
    } else if (path === '/exam') {
        return <Exam />;
    } else if (path === '/support') {
      return <Support />;
    } else {
        return (
          <>
            <UserManagement />
            <CourseAnalytics />
          </>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="app-menu-links" role="menubar">
          <Link 
            to="/dashboard" 
            className={location.pathname === '/dashboard' ? 'active' : ''} 
            role="menuitem"
          >
            <div className="menu-item">
              <img 
                className="menu-image" 
                src="/icons/home.svg" 
                alt="Home"
              />
              <span className="menu-text">Home</span>
            </div>
          </Link>

          <Link 
            to="/courses" 
            className={location.pathname === '/courses' ? 'active' : ''} 
            role="menuitem"
          >
            <div className="menu-item">
              <img 
                className="menu-image" 
                src="/icons/course.svg" 
                alt="Courses"
              />
              <span className="menu-text">Courses</span>
            </div>
          </Link>

          <Link 
            to="/profile" 
            className={location.pathname === '/profile' ? 'active' : ''} 
            role="menuitem"
          >
            <div className="menu-item">
              <img 
                className="menu-image" 
                src="/icons/book.svg" 
                alt="Text Management"
              />
              <span className="menu-text">Text Management</span>
            </div>
          </Link>

          <Link 
            to="/exam" 
            className={location.pathname === '/exam' ? 'active' : ''} 
            role="menuitem"
          >
            <div className="menu-item">
              <img 
                className="menu-image" 
                src="/icons/exam.svg" 
                alt="Exam"
              />
              <span className="menu-text">Exam</span>
            </div>
          </Link>

          <Link 
            to="/support" 
            className={location.pathname === '/support' ? 'active' : ''} 
            role="menuitem"
          >
            <div className="menu-item">
              <img 
                className="menu-image" 
                src="/icons/support.svg" 
                alt="Support"
              />
              <span className="menu-text">Support</span>
            </div>
          </Link>
        </div>

        <div className="user-profile">
          <div className="user-info">
            <img 
              className="user-avatar" 
              src="/icons/user.svg" 
              alt="User"
            />
            <span className="username">{user?.username || 'User'}</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <img 
              className="logout-icon" 
              src="/icons/logout.svg" 
              alt="Logout"
            />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard; 