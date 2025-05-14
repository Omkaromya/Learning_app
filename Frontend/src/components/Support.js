import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CustomAlert } from './Alert';
import LoadingSpinner from './LoadingSpinner';
import { 
  fetchUsers, 
  updateUser, 
  deleteUsers, 
  setSelectedUsers, 
  updatePagination, 
  clearError 
} from '../store/slices/userSlice';
import '../styles/Support.css';

const Support = () => {
  const dispatch = useDispatch();
  const { 
    users, 
    selectedUsers, 
    pagination, 
    loading, 
    error 
  } = useSelector((state) => state.users);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers({ skip: pagination.skip, limit: pagination.limit }));
  }, [dispatch, pagination.skip]);

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleInputChange = (field, value) => {
    setSelectedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      await dispatch(updateUser(selectedUser)).unwrap();
      setIsModalOpen(false);
      setSelectedUser(null);
      showAlert('User updated successfully', 'success');
    } catch (error) {
      showAlert('Failed to update user', 'error');
    }
  };

  const handlePageChange = (newSkip) => {
    dispatch(updatePagination({ skip: newSkip }));
  };

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCheckboxChange = (userId, event) => {
    event.stopPropagation();
    const newSelectedUsers = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    dispatch(setSelectedUsers(newSelectedUsers));
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) {
      showAlert('Please select users to delete', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} selected users?`)) {
      try {
        await dispatch(deleteUsers(selectedUsers)).unwrap();
        showAlert('Users deleted successfully', 'success');
      } catch (error) {
        showAlert(error.message || 'Failed to delete users', 'error');
      }
    }
  };

  if (loading) return (
    <div className="loading-container">
      <LoadingSpinner size="large" color="#1976d2" />
    </div>
  );
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="support-container">
      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      <h2>User Support Dashboard</h2>
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th><input 
                type="checkbox" 
                onChange={(e) => {
                  if (e.target.checked) {
                    dispatch(setSelectedUsers(users.map(user => user.id)));
                  } else {
                    dispatch(setSelectedUsers([]));
                  }
                }}
                checked={selectedUsers.length === users.length && users.length > 0}
              /></th>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Email Verified</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr 
                key={user.id} 
                onClick={() => handleRowClick(user)}
                className="clickable-row"
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => handleCheckboxChange(user.id, e)}
                  />
                </td>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.email_verified ? 'verified' : 'unverified'}`}>
                    {user.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <button 
            className="action-button delete"
            onClick={handleDeleteSelected}
          >
            Delete({selectedUsers.length})
          </button>
        </div>
      )}

      {isModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit User</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Username:</label>
                <input 
                  type="text" 
                  value={selectedUser.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input 
                  type="email" 
                  value={selectedUser.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select 
                  value={selectedUser.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status:</label>
                <select 
                  value={selectedUser.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-button cancel"
                onClick={handleModalClose}
              >
                Cancel
              </button>
              <button 
                className="modal-button save"
                onClick={handleSaveChanges}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support; 