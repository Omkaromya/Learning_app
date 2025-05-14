import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchWithCorsHandling, getFetchOptions } from '../../services/api';

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ skip, limit }, { rejectWithValue }) => {
    try {
      const response = await fetchWithCorsHandling(
        `http://127.0.0.1:8000/auth/users?skip=${skip}&limit=${limit}`,
        getFetchOptions('GET')
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetchWithCorsHandling(
        `http://127.0.0.1:8000/auth/users/${userData.id}`,
        getFetchOptions('PUT', userData)
      );

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteUsers = createAsyncThunk(
  'users/deleteUsers',
  async (userIds, { rejectWithValue }) => {
    try {
      // Delete users one by one using the single user delete endpoint
      const deletePromises = userIds.map(userId => 
        fetchWithCorsHandling(
          `http://127.0.0.1:8000/auth/users/${userId}`,
          getFetchOptions('DELETE')
        )
      );

      const responses = await Promise.all(deletePromises);
      
      // Check if any deletion failed
      const failedDeletions = responses.filter(response => !response.ok);
      if (failedDeletions.length > 0) {
        throw new Error('Some users could not be deleted');
      }

      return userIds;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetchWithCorsHandling(
        `http://127.0.0.1:8000/auth/users/${userId}`,  // Single user delete endpoint
        getFetchOptions('DELETE')
      );

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      return userId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  users: [],
  selectedUsers: [],
  pagination: {
    total: 0,
    skip: 0,
    limit: 20
  },
  loading: false,
  error: null
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUsers: (state, action) => {
      state.selectedUsers = action.payload;
    },
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User
      .addCase(updateUser.fulfilled, (state, action) => {
        state.users = state.users.map(user => 
          user.id === action.payload.id ? action.payload : user
        );
      })
      // Delete Users
      .addCase(deleteUsers.fulfilled, (state, action) => {
        state.users = state.users.filter(user => !action.payload.includes(user.id));
        state.selectedUsers = [];
      })
      // Delete Single User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        // Also remove from selected users if present
        state.selectedUsers = state.selectedUsers.filter(id => id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setSelectedUsers, updatePagination, clearError } = userSlice.actions;
export default userSlice.reducer; 