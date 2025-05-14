import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-links">
        <Link 
          to="/dashboard" 
          className={location.pathname === '/dashboard' ? 'active' : ''} 
          role="menuitem"
        >
          <div className="menu-item">
            <img 
              className="menu-image" 
              src="/icons/dashboard.svg" 
              alt="Dashboard"
            />
            <span className="menu-text">Dashboard</span>
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
      </div>
    </nav>
  );
};

export default Navigation; 