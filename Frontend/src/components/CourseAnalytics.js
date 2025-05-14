import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CourseAnalytics = () => {
  const courseStats = {
    totalCourses: 45,
    publishedCourses: 35,
    draftCourses: 10,
    popularCourses: [
      { name: 'Web Development', enrollments: 120 },
      { name: 'Data Science', enrollments: 95 },
      { name: 'Mobile App Development', enrollments: 80 }
    ],
    completionRates: {
      average: 75
    }
  };

  const barChartData = {
    labels: courseStats.popularCourses.map(course => course.name),
    datasets: [
      {
        label: 'Number of Students',
        data: courseStats.popularCourses.map(course => course.enrollments),
        backgroundColor: [
          'rgba(66, 153, 225, 0.8)',
          'rgba(72, 187, 120, 0.8)',
          'rgba(237, 137, 54, 0.8)'
        ],
        borderColor: [
          'rgba(66, 153, 225, 1)',
          'rgba(72, 187, 120, 1)',
          'rgba(237, 137, 54, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 40,
        maxBarThickness: 50,
        minBarLength: 20,
        fill: true
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Course Enrollment Analytics',
        font: {
          size: 20,
          weight: 'bold',
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        },
        padding: {
          bottom: 20
        },
        color: '#2d3748'
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#2d3748',
        bodyColor: '#4a5568',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} students enrolled`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
          },
          color: '#4a5568',
          padding: 10
        },
        title: {
          display: true,
          text: 'Number of Students',
          font: {
            size: 14,
            weight: 'bold',
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
          },
          color: '#4a5568',
          padding: {
            top: 10,
            bottom: 10
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
          },
          color: '#4a5568',
          padding: 10
        }
      }
    },
    barPercentage: 0.8,
    categoryPercentage: 0.9
  };

  return (
    <div className="course-analytics">
      <h2 className="section-title">Course Analytics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p className="stat-number">{courseStats.totalCourses}</p>
        </div>

        <div className="stat-card">
          <h3>Published Courses</h3>
          <p className="stat-number">{courseStats.publishedCourses}</p>
        </div>

        <div className="stat-card">
          <h3>Draft Courses</h3>
          <p className="stat-number">{courseStats.draftCourses}</p>
        </div>

        <div className="stat-card">
          <h3>Course Completion Rate</h3>
          <p className="stat-number">{courseStats.completionRates.average}%</p>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-wrapper">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default CourseAnalytics; 