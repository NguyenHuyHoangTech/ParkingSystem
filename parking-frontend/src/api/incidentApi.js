import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/v1/incidents';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`
    };
};

export const getPendingIncidents = async (buildingId) => {
    const response = await axios.get(`${BASE_URL}/pending`, {
        params: { buildingId },
        headers: getAuthHeaders()
    });
    return response.data;
};

export const resolveIncident = async (incidentId, resolveData) => {
    const response = await axios.post(`${BASE_URL}/${incidentId}/resolve`, resolveData, {
        headers: getAuthHeaders()
    });
    return response.data;
};
