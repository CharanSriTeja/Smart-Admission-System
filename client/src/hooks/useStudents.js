import { useState, useEffect, useCallback } from 'react';
import { getStudents } from '../services/studentService';
import { useSocket } from '../context/SocketContext';

export function useStudents(initialParams = {}) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const { socket } = useSocket();

  const fetchStudents = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStudents({
        page: pagination.page,
        limit: pagination.limit,
        ...initialParams,
        ...params,
      });
      const data = response.data;
      setStudents(data.students || data.data || []);
      if (data.pagination) {
        setPagination(prev => ({ ...prev, ...data.pagination }));
      } else if (data.total !== undefined) {
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: Math.ceil(data.total / (params.limit || prev.limit)),
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [initialParams, pagination.page, pagination.limit]);

  const refetch = useCallback(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Listen for real-time student updates
  useEffect(() => {
    if (!socket) return;

    const handleStudentUpdated = (updatedStudent) => {
      setStudents(prev =>
        prev.map(s =>
          (s._id === updatedStudent._id || s.id === updatedStudent.id)
            ? { ...s, ...updatedStudent }
            : s
        )
      );
    };

    socket.on('student:updated', handleStudentUpdated);
    return () => socket.off('student:updated', handleStudentUpdated);
  }, [socket]);

  return { students, loading, error, pagination, setPagination, fetchStudents, refetch };
}

export default useStudents;
