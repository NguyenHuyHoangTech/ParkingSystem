import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Typography, Table, Tag, Button, Space, message, Card } from 'antd';
import { getPendingIncidents } from '../../api/incidentApi';
import useSSE from '../../hooks/useSSE';
import ResolveIncidentModal from '../../components/incidents/ResolveIncidentModal';
import { useAuth } from '../../hooks/useAuth';

const { Content } = Layout;
const { Title, Text } = Typography;

const StaffExceptions = () => {
    const { user } = useAuth();
    const buildingId = user?.buildingId || 1;
    
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);

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
    const handleNewIncident = useCallback((dataStr) => {
        try {
            const newIncident = JSON.parse(dataStr);
            message.warning(`Có yêu cầu hỗ trợ mới: ${newIncident.exceptionType}`);
            setIncidents(prev => [newIncident, ...prev]);
        } catch (e) {
            console.error("Error parsing new incident SSE data", e);
        }
    }, []);

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

    const handleOpenModal = (incident) => {
        setSelectedIncident(incident);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedIncident(null);
    };

    const handleSuccess = () => {
        handleCloseModal();
        fetchPendingIncidents();
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'incidentId',
            key: 'incidentId',
            width: 80,
        },
        {
            title: 'Loại sự cố',
            dataIndex: 'exceptionType',
            key: 'exceptionType',
            render: (type) => {
                let color = 'volcano';
                if (type === 'LOST_TICKET') color = 'magenta';
                if (type === 'WRONG_PLATE') color = 'orange';
                if (type === 'OVERTIME') color = 'purple';
                if (type === 'UNPAID_VEHICLE') color = 'red';
                return <Tag color={color}>{type}</Tag>;
            }
        },
        {
            title: 'Người báo',
            dataIndex: 'reportedBy',
            key: 'reportedBy',
            render: (text) => text === 'USER_KIOSK' ? <Tag color="green">Khách hàng</Tag> : <Text>{text}</Text>
        },
        {
            title: 'Biển số',
            dataIndex: 'licensePlate',
            key: 'licensePlate',
            render: (text) => text || 'N/A'
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Button type="primary" size="small" onClick={() => handleOpenModal(record)}>
                    Xử Lý (Resolve)
                </Button>
            ),
        },
    ];

    return (
        <Content style={{ padding: '24px', minHeight: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Xử Lý Sự Cố</Title>
                    <Text type="secondary">Giải quyết các yêu cầu hỗ trợ từ khách hàng và mở khóa rào chắn</Text>
                </div>
                <Button onClick={fetchPendingIncidents} loading={loading}>Làm mới</Button>
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

            <ResolveIncidentModal 
                visible={modalVisible}
                incident={selectedIncident}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
            />
        </Content>
    );
};

export default StaffExceptions;
