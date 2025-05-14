import React, { useState, useEffect } from 'react';
import { CustomAlert } from './Alert';
import { fetchWithCorsHandling, getFetchOptions } from '../services/api';
import '../styles/Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    skip: 0,
    limit: 20
  });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [pagination.skip]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetchWithCorsHandling(
        `http://127.0.0.1:8000/courses/?skip=${pagination.skip}&limit=${pagination.limit}`,
        getFetchOptions('GET')
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.courses);
      setPagination(prev => ({
        ...prev,
        total: data.total
      }));
    } catch (error) {
      setError(error.message);
      showAlert('error', 'Error', 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (severity, title, message) => {
    setAlert({ severity, title, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await fetchWithCorsHandling(
          `http://127.0.0.1:8000/courses/${courseId}`,
          getFetchOptions('DELETE')
        );

        if (!response.ok) {
          throw new Error('Failed to delete course');
        }

      setCourses(courses.filter(course => course.id !== courseId));
      showAlert('success', 'Success', 'Course deleted successfully');
      } catch (error) {
        showAlert('error', 'Error', 'Failed to delete course');
      }
    }
  };

  const handlePageChange = (newSkip) => {
    setPagination(prev => ({
      ...prev,
      skip: newSkip
    }));
  };

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    duration_weeks: 1,
    level: 'BEGINNER',
    category: '',
    status: 'DRAFT'
  });

  const togglePublishStatus = async (courseId) => {
    try {
      const response = await fetchWithCorsHandling(
        `http://127.0.0.1:8000/courses/${courseId}/publish`,
        getFetchOptions('PUT')
      );

      if (!response.ok) {
        throw new Error('Failed to update course status');
      }

      const updatedCourse = await response.json();
      setCourses(courses.map(course => 
        course.id === courseId ? updatedCourse : course
      ));
      showAlert('success', 'Success', `Course ${updatedCourse.status.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Publish status error:', error);
      showAlert('error', 'Error', 'Failed to update course status');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditing) {
      setEditingCourse(prev => ({ ...prev, [name]: value }));
    } else {
      setNewCourse(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const courseData = isEditing ? editingCourse : newCourse;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `http://127.0.0.1:8000/courses/${editingCourse.id}`
        : 'http://127.0.0.1:8000/courses/';

      const response = await fetchWithCorsHandling(
        url,
        getFetchOptions(method, courseData)
      );

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} course`);
      }

      const data = await response.json();
    if (isEditing) {
      setCourses(courses.map(course => 
          course.id === editingCourse.id ? data : course
      ));
      showAlert('success', 'Success', 'Course updated successfully');
    } else {
        setCourses([data, ...courses]);
      showAlert('success', 'Success', 'Course added successfully');
    }
    handleCloseModal();
    } catch (error) {
      showAlert('error', 'Error', `Failed to ${isEditing ? 'update' : 'create'} course`);
    }
  };

  const handleEditCourse = (course) => {
    setIsEditing(true);
    setEditingCourse(course);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingCourse(null);
    setNewCourse({
      title: '',
      description: '',
      duration_weeks: 1,
      level: 'BEGINNER',
      category: '',
      status: 'DRAFT'
    });
  };

  if (loading) {
    return <div className="loading">Loading courses...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="courses-container">
      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="courses-header">
        <h2>Courses</h2>
        <button className="add-course-button" onClick={() => setShowModal(true)}>
          Add Course
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Course' : 'Add New Course'}</h3>
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Course Title</label>
                <input 
                  type="text" 
                  name="title" 
                  value={isEditing ? editingCourse.title : newCourse.title} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  name="description" 
                  value={isEditing ? editingCourse.description : newCourse.description} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Duration (weeks)</label>
                <input 
                  type="number" 
                  name="duration_weeks" 
                  value={isEditing ? editingCourse.duration_weeks : newCourse.duration_weeks} 
                  onChange={handleInputChange} 
                  min="1"
                  required 
                />
              </div>

              <div className="form-group">
                <label>Level</label>
                <select 
                  name="level" 
                  value={isEditing ? editingCourse.level : newCourse.level} 
                  onChange={handleInputChange}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <input 
                  type="text" 
                  name="category" 
                  value={isEditing ? editingCourse.category : newCourse.category} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  {isEditing ? 'Update Course' : 'Add Course'}
                </button>
                <button type="button" className="cancel-button" onClick={handleCloseModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="courses-grid">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <div className="course-header">
              <h3>{course.title}</h3>
              <span className={`status-badge ${course.status.toLowerCase()}`}>
                {course.status}
              </span>
            </div>
            
            <div className="course-info">
              <div className="info-item">
                <span className="label">Instructor ID:</span>
                <span className="value">{course.instructor_id}</span>
              </div>
              <div className="info-item">
                <span className="label">Duration:</span>
                <span className="value">{course.duration_weeks} weeks</span>
              </div>
              <div className="info-item">
                <span className="label">Level:</span>
                <span className="value">{course.level}</span>
              </div>
              <div className="info-item">
                <span className="label">Category:</span>
                <span className="value">{course.category}</span>
              </div>
              <div className="info-item">
                <span className="label">Created:</span>
                <span className="value">{new Date(course.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="course-actions">
              <button 
                className={`action-button ${course.status === 'PUBLISHED' ? 'unpublish' : 'publish'}`}
                onClick={() => togglePublishStatus(course.id)}
              >
                {course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
              </button>
              <button 
                className="action-button edit" 
                onClick={() => handleEditCourse(course)}
              >
                Edit Course
              </button>
              <button 
                className="action-button delete" 
                onClick={() => handleDeleteCourse(course.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button 
          onClick={() => handlePageChange(Math.max(0, pagination.skip - pagination.limit))}
          disabled={pagination.skip === 0}
        >
          Previous
        </button>
        <span>
          Page {Math.floor(pagination.skip / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
        </span>
        <button 
          onClick={() => handlePageChange(pagination.skip + pagination.limit)}
          disabled={pagination.skip + pagination.limit >= pagination.total}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Courses; 