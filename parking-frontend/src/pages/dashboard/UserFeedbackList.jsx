import React, { useState, useEffect } from 'react';
import { Layout, Typography, List, Card, Tag, Spin, message } from 'antd';
import { CustomerServiceOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Content } = Layout;
const { Title, Text } = Typography;

const BASE_URL = 'http://localhost:8080/api/user/feedbacks';

const UserFeedbackList = () => {
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await axios.get(BASE_URL, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setTickets(response.data);
        } catch (error) {
            console.error('Error fetching tickets', error);
            message.error('Failed to load your history.');
        } finally {
            setLoading(false);
        }
    };

    const renderStatusTag = (status) => {
        switch (status?.toUpperCase()) {
            case 'OPEN': return <Tag color="red">OPEN</Tag>;
            case 'IN_PROGRESS': return <Tag color="blue">IN PROGRESS</Tag>;
            case 'RESOLVED': return <Tag color="green">RESOLVED</Tag>;
            case 'CLOSED': return <Tag color="default">CLOSED</Tag>;
            default: return <Tag>{status}</Tag>;
        }
    };

    return (
        <Content style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
            <Title level={2}>Support History</Title>
            <Text type="secondary">Track the status of your reported issues and feedbacks.</Text>

            <Spin spinning={loading}>
                <List
                    style={{ marginTop: 24 }}
                    itemLayout="vertical"
                    dataSource={tickets}
                    locale={{ emptyText: "You haven't submitted any reports yet." }}
                    renderItem={item => (
                        <Card style={{ marginBottom: 16 }}>
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<CustomerServiceOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                    title={<>
                                        Ticket #{item.ticketId} - {item.issueCategory.replace('_', ' ')}
                                        <span style={{ float: 'right' }}>{renderStatusTag(item.status)}</span>
                                    </>}
                                    description={`Submitted on: ${moment(item.createdAt).format('YYYY-MM-DD HH:mm')}`}
                                />
                                <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', marginBottom: 12 }}>
                                    <Text strong>Your Report:</Text><br/>
                                    <Text>{item.description}</Text>
                                </div>
                                {item.resolutionNote && (
                                    <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '4px', borderLeft: '4px solid #1890ff' }}>
                                        <Text strong>Manager Reply:</Text><br/>
                                        <Text>{item.resolutionNote}</Text>
                                    </div>
                                )}
                            </List.Item>
                        </Card>
                    )}
                />
            </Spin>
        </Content>
    );
};

export default UserFeedbackList;
