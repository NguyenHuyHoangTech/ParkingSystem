import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/v1/reports';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`
    };
};

export const getDashboardSummary = async (buildingId) => {
    const response = await axios.get(`${BASE_URL}/dashboard-summary`, {
        params: { buildingId },
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getTrafficTrend = async (buildingId, startDate, endDate, vehicleTypeId) => {
    const response = await axios.get(`${BASE_URL}/traffic-trend`, {
        params: { buildingId, startDate, endDate, vehicleTypeId },
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getRevenueDistribution = async (buildingId, startDate, endDate) => {
    const response = await axios.get(`${BASE_URL}/revenue-distribution`, {
        params: { buildingId, startDate, endDate },
        headers: getAuthHeaders()
    });
    return response.data;
};

export const triggerAggregation = async () => {
    const response = await axios.post(`${BASE_URL}/trigger-aggregation`, {}, {
        headers: getAuthHeaders()
    });
    return response.data;
};
