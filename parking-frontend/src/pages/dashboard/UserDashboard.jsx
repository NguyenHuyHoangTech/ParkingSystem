import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Spin, Badge, Drawer, Table, Button, Space, Result, Alert } from 'antd';
import { EnvironmentOutlined, InfoCircleOutlined, CarOutlined, DollarOutlined, StopOutlined } from '@ant-design/icons';
import axios from 'axios';
import useSSE from '../../hooks/useSSE';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const BASE_URL = 'http://localhost:8080/api/user/buildings';

const UserDashboard = () => {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Detail Drawer state
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [buildingDetails, setBuildingDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // SSE for real-time capacity updates
    useSSE(['SLOTS_UPDATED'], [
        () => {
            // Silently refresh the capacity data if drawer is open
            if (selectedBuilding && buildingDetails) {
                refreshCapacityOnly(selectedBuilding.buildingId);
            }
        }
    ]);

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(BASE_URL, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setBuildings(response.data);
        } catch (error) {
            console.error('Error fetching buildings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBuildingDetails = async (buildingId) => {
        try {
            setDetailsLoading(true);
            const response = await axios.get(`${BASE_URL}/${buildingId}/details`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setBuildingDetails(response.data);
            setDrawerVisible(true);
        } catch (error) {
            console.error('Error fetching building details:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    // Silently fetch just to update capacities without showing a spinner
    const refreshCapacityOnly = async (buildingId) => {
        try {
            const response = await axios.get(`${BASE_URL}/${buildingId}/details`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Update only the capacities portion to prevent screen flickering
            setBuildingDetails(prev => ({
                ...prev,
                capacities: response.data.capacities
            }));
        } catch (error) {
            console.error('Silent refresh failed:', error);
        }
    };

    const handleBuildingClick = (building) => {
        setSelectedBuilding(building);
        fetchBuildingDetails(building.buildingId);
    };

    const isAvailable = (capacities) => {
        if (!capacities || capacities.length === 0) return false;
        return capacities.some(c => c.availableSlots > 0);
    };

    const priceColumns = [
        { title: 'Vehicle Type', dataIndex: ['vehicleType', 'typeName'], key: 'type' },
        { title: 'Block', dataIndex: 'blockType', key: 'block' },
        { title: 'Duration (hrs)', dataIndex: 'durationHours', key: 'duration' },
        { title: 'Price (VNĐ)', dataIndex: 'priceAmount', key: 'price', render: val => <strong>{val.toLocaleString()}</strong> }
    ];

    return (
        <Content style={{ padding: '24px', minHeight: 280, position: 'relative' }}>
            <Title level={2}>Find Parking Near You</Title>
            <Text type="secondary">Real-time availability and dynamic pricing</Text>

            <Spin spinning={loading}>
                <div style={{ marginTop: 24, padding: 20, background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff', minHeight: 400 }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <Title level={4}>Interactive Map (Simulated)</Title>
                        <Text>Click on a pin to view live details</Text>
                    </div>

                    <Row gutter={[24, 24]} justify="center">
                        {buildings.map(b => {
                            const isMaintenance = b.status === 'MAINTENANCE' || b.status === 'CLOSED';
                            return (
                                <Col xs={24} sm={12} md={8} key={b.buildingId}>
                                    <Card 
                                        hoverable 
                                        onClick={() => handleBuildingClick(b)}
                                        style={{ border: isMaintenance ? '1px solid red' : '1px solid #d9d9d9' }}
                                    >
                                        <Card.Meta
                                            avatar={<EnvironmentOutlined style={{ fontSize: 32, color: isMaintenance ? 'red' : '#1890ff' }} />}
                                            title={b.name}
                                            description={
                                                <div>
                                                    <div>{b.address}</div>
                                                    {isMaintenance && <Badge status="error" text="Maintenance / Closed" />}
                                                    {!isMaintenance && <Badge status="processing" text="Active" />}
                                                </div>
                                            }
                                        />
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </div>
            </Spin>

            <Drawer
                title={<Space><InfoCircleOutlined /> Building Information</Space>}
                width={600}
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                destroyOnClose
            >
                <Spin spinning={detailsLoading}>
                    {buildingDetails && (
                        <div>
                            <Title level={3}>{buildingDetails.name}</Title>
                            <Paragraph type="secondary"><EnvironmentOutlined /> {buildingDetails.address}</Paragraph>
                            <Paragraph><strong>Hours:</strong> {buildingDetails.openTime} - {buildingDetails.closeTime}</Paragraph>
                            
                            {(buildingDetails.status === 'MAINTENANCE' || buildingDetails.status === 'CLOSED') && (
                                <Result
                                    status="error"
                                    icon={<StopOutlined />}
                                    title="Facility Currently Unavailable"
                                    subTitle="This building is closed for maintenance. Please select another location."
                                    style={{ padding: '20px 0' }}
                                />
                            )}

                            <Card title="Live Capacity" bordered={false} style={{ background: '#fafafa', marginBottom: 24 }}>
                                <Row gutter={[16, 16]}>
                                    {buildingDetails.capacities?.map(cap => {
                                        const isFull = cap.availableSlots === 0;
                                        return (
                                            <Col span={12} key={cap.vehicleTypeId}>
                                                <Card 
                                                    type="inner" 
                                                    title={<Space><CarOutlined /> {cap.vehicleTypeName}</Space>}
                                                    style={{ borderColor: isFull ? '#ff4d4f' : '#b7eb8f' }}
                                                >
                                                    <div style={{ textAlign: 'center' }}>
                                                        <Text type="secondary">Available Slots</Text>
                                                        <br />
                                                        <Title level={2} style={{ color: isFull ? '#ff4d4f' : '#52c41a', margin: 0 }}>
                                                            {cap.availableSlots} <span style={{fontSize: 16, color: '#888'}}>/ {cap.totalCapacity}</span>
                                                        </Title>
                                                    </div>
                                                </Card>
                                            </Col>
                                        )
                                    })}
                                </Row>
                                {!isAvailable(buildingDetails.capacities) && buildingDetails.status === 'OPEN' && (
                                    <Alert message="Facility is full. We recommend checking nearby locations." type="warning" showIcon style={{ marginTop: 16 }} />
                                )}
                            </Card>

                            <Card title="Rules & Regulations" bordered={false} style={{ marginBottom: 24 }}>
                                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                    {buildingDetails.rulesDescription || "Standard parking rules apply."}
                                </Paragraph>
                            </Card>

                            <Card title="Pricing Policy" bordered={false} style={{ marginBottom: 24 }}>
                                <Table 
                                    dataSource={buildingDetails.pricingPolicies} 
                                    columns={priceColumns} 
                                    rowKey="priceId"
                                    pagination={false}
                                    size="small"
                                />
                            </Card>

                            <Button 
                                type="primary" 
                                size="large" 
                                block 
                                disabled={buildingDetails.status === 'MAINTENANCE' || buildingDetails.status === 'CLOSED' || !isAvailable(buildingDetails.capacities)}
                                icon={<EnvironmentOutlined />}
                            >
                                Get Directions (Google Maps)
                            </Button>
                        </div>
                    )}
                </Spin>
            </Drawer>
        </Content>
    );
};

export default UserDashboard;
