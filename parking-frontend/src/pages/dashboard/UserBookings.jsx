import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, List, Tag, Button, Spin, message, QRCode, Modal } from 'antd';
import { CalendarOutlined, CarOutlined, QrcodeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const { Content } = Layout;
const { Title, Text } = Typography;

const BASE_URL = 'http://localhost:8080/api/user/bookings';

const UserBookings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [selectedQr, setSelectedQr] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(BASE_URL, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Sort by start time descending
            const sortedData = response.data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            setBookings(sortedData);
        } catch (error) {
            console.error('Error fetching bookings', error);
            message.error('Failed to load your tickets.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        try {
            await axios.delete(`${BASE_URL}/${bookingId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            message.success('Booking cancelled successfully.');
            fetchBookings();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to cancel booking.');
        }
    };

    const showQrCode = (qrValue) => {
        setSelectedQr(qrValue);
        setQrModalVisible(true);
    };

    const renderStatusTag = (status) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED': return <Tag color="green">CONFIRMED</Tag>;
            case 'PENDING': return <Tag color="orange">PENDING PAYMENT</Tag>;
            case 'CANCELLED': return <Tag color="red">CANCELLED</Tag>;
            case 'CHECKED_IN': return <Tag color="blue">CHECKED IN</Tag>;
            case 'COMPLETED': return <Tag color="default">COMPLETED</Tag>;
            default: return <Tag>{status}</Tag>;
        }
    };

    return (
        <Content style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
            <Title level={2}>My Tickets</Title>
            <Text type="secondary">View and manage your advance parking reservations.</Text>

            <Spin spinning={loading}>
                <List
                    style={{ marginTop: 24 }}
                    grid={{ gutter: 16, xs: 1, sm: 1, md: 2 }}
                    dataSource={bookings}
                    renderItem={item => (
                        <List.Item>
                            <Card 
                                hoverable 
                                title={<><CarOutlined /> {item.licensePlate}</>}
                                extra={renderStatusTag(item.status)}
                                actions={[
                                    <Button 
                                        type="link" 
                                        danger 
                                        disabled={!['PENDING', 'CONFIRMED'].includes(item.status?.toUpperCase())}
                                        onClick={() => handleCancel(item.bookingId)}
                                    >
                                        Cancel
                                    </Button>,
                                    <Button 
                                        type="primary" 
                                        icon={<QrcodeOutlined />} 
                                        disabled={item.status?.toUpperCase() !== 'CONFIRMED'}
                                        onClick={() => showQrCode(item.qrCodeValue)}
                                    >
                                        Show QR
                                    </Button>,
                                    <Button 
                                        type="dashed" 
                                        danger
                                        icon={<ExclamationCircleOutlined />} 
                                        onClick={() => navigate(`/user/feedback-form?bookingId=${item.bookingId}&buildingId=${item.floor?.parkingBuilding?.buildingId}`)}
                                    >
                                        Report Issue
                                    </Button>
                                ]}
                            >
                                <p><strong>Location:</strong> {item.floor?.parkingBuilding?.name} - Floor {item.floor?.floorName}</p>
                                <p><CalendarOutlined /> <strong>From:</strong> {moment(item.startTime).format('YYYY-MM-DD HH:mm')}</p>
                                <p><CalendarOutlined /> <strong>To:</strong> {moment(item.endTime).format('YYYY-MM-DD HH:mm')}</p>
                                <p><strong>Fee:</strong> {item.totalFee?.toLocaleString()} VNĐ</p>
                            </Card>
                        </List.Item>
                    )}
                />
            </Spin>

            <Modal
                title="Your Entry Ticket"
                open={qrModalVisible}
                onCancel={() => setQrModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setQrModalVisible(false)}>
                        Close
                    </Button>
                ]}
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    {selectedQr ? (
                        <>
                            <QRCode value={selectedQr} size={256} style={{ margin: '0 auto' }} />
                            <div style={{ marginTop: 16 }}>
                                <Text type="secondary">Present this QR Code at the entrance gate.</Text>
                            </div>
                        </>
                    ) : (
                        <Text type="danger">QR Code not available. Please ensure your payment is confirmed.</Text>
                    )}
                </div>
            </Modal>
        </Content>
    );
};

export default UserBookings;
