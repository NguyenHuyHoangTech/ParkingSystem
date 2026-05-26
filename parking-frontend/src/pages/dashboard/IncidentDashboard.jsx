import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Typography, Table, Tag, Button, Space, message, Card } from 'antd';
import { getPendingIncidents } from '../../api/incidentApi';
import useSSE from '../../hooks/useSSE';
import { useAuth } from '../../hooks/useAuth';

const { Content } = Layout;
const { Title, Text } = Typography;

const IncidentDashboard = () => {
    const { user } = useAuth();
    const buildingId = user?.buildingId || 1;
    
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPendingIncidents = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getPendingIncidents(buildingId);
            setIncidents(data);
        } catch (error) {
            console.error('Failed to fetch incidents', error);
            message.error('Failed to load pending incidents');
        } finally {
            setLoading(false);
        }
    }, [buildingId]);

    useEffect(() => {
        fetchPendingIncidents();
    }, [fetchPendingIncidents]);

    // SSE Integration
    // When a new incident arrives, prepend it to the list
    const handleNewIncident = useCallback((dataStr) => {
        try {
            const newIncident = JSON.parse(dataStr);
            message.warning(`New Incident Alert: ${newIncident.exceptionType}`);
            setIncidents(prev => [newIncident, ...prev]);
        } catch (e) {
            console.error("Error parsing new incident SSE data", e);
        }
    }, []);

    // When an incident is resolved, remove it from the list
    const handleIncidentResolved = useCallback((dataStr) => {
        try {
            const resolvedIncident = JSON.parse(dataStr);
            setIncidents(prev => prev.filter(inc => inc.incidentId !== resolvedIncident.incidentId));
        } catch (e) {
            console.error("Error parsing resolved incident SSE data", e);
        }
    }, []);

    useSSE(
        ['new_incident', 'incident_resolved'], 
        [handleNewIncident, handleIncidentResolved]
    );



    const columns = [
        {
            title: 'ID',
            dataIndex: 'incidentId',
            key: 'incidentId',
            width: 80,
        },
        {
            title: 'Type',
            dataIndex: 'exceptionType',
            key: 'exceptionType',
            render: (type) => {
                let color = 'volcano';
                if (type === 'LOST_TICKET') color = 'magenta';
                if (type === 'WRONG_PLATE') color = 'orange';
                if (type === 'OVERTIME') color = 'purple';
                return <Tag color={color}>{type}</Tag>;
            }
        },
        {
            title: 'Reported By',
            dataIndex: 'reportedBy',
            key: 'reportedBy',
            render: (text) => text === 'SYSTEM' ? <Tag color="blue">{text}</Tag> : <Text>{text}</Text>
        },
        {
            title: 'License Plate',
            dataIndex: 'licensePlate',
            key: 'licensePlate',
            render: (text) => text || 'N/A'
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString()
        }
    ];
    return (
        <Content style={{ padding: '24px', minHeight: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Exception Management</Title>
                    <Text type="secondary">Real-time incident response center</Text>
                </div>
                <Button onClick={fetchPendingIncidents} loading={loading}>Refresh List</Button>
            </div>

            <Card>
                <Table 
                    columns={columns} 
                    dataSource={incidents} 
                    rowKey="incidentId"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>


        </Content>
    );
};

export default IncidentDashboard;
