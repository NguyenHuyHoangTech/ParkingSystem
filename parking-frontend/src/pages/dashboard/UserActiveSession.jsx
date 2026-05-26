import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Statistic, Button, Row, Col, Spin, message, Modal, QRCode, Space, Alert, Checkbox, Divider, List } from 'antd';
import { CarOutlined, DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, QrcodeOutlined, PlusCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;

const BASE_URL = 'http://localhost:8080/api/user/my-sessions';

const UserActiveSession = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [sessionData, setSessionData] = useState(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [prepayLoading, setPrepayLoading] = useState(false);
    const [gracePeriodEnd, setGracePeriodEnd] = useState(null);
    const [countdown, setCountdown] = useState('');
    const [additionalServices, setAdditionalServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);

    useEffect(() => {
        fetchActiveSession();
        fetchAdditionalServices();
        // Poll every 1 minute to update the accrued fee
        const interval = setInterval(fetchActiveSession, 60000);
        return () => clearInterval(interval);
    }, []);

    // Countdown Timer logic
    useEffect(() => {
        let timer;
        if (gracePeriodEnd) {
            timer = setInterval(() => {
                const now = new Date().getTime();
                const end = new Date(gracePeriodEnd).getTime();
                const distance = end - now;

                if (distance < 0) {
                    clearInterval(timer);
                    setCountdown('GRACE PERIOD EXPIRED');
                    // Reset to normal billing mode
                    setGracePeriodEnd(null);
                    fetchActiveSession(); 
                } else {
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setCountdown(`${minutes}m ${seconds}s`);
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gracePeriodEnd]);

    const fetchActiveSession = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/active/preview`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSessionData(response.data);
            
            // If totalFee is 0 and duration > 0, it means they might have prepaid and are in grace period
            // In a real app, we would fetch the PaymentTransactions to get the exact payment time to build the timer.
            // For MVP, if totalFee === 0 after a prepay, we just trust our local gracePeriodEnd state.
        } catch (error) {
            // It's normal to have 404 or 500 if no active session exists
            setSessionData(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdditionalServices = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/user/services`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setAdditionalServices(response.data);
        } catch (error) {
            console.error("Failed to load services", error);
        }
    };

    const toggleService = (serviceId) => {
        setSelectedServices(prev => 
            prev.includes(serviceId) 
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const calculateClientTotal = () => {
        let total = sessionData?.totalFee || 0;
        selectedServices.forEach(id => {
            const svc = additionalServices.find(s => s.serviceId === id);
            if (svc) total += svc.unitPrice;
        });
        return total;
    };

    const handleCheckout = async (paymentMethod) => {
        try {
            setPrepayLoading(true);
            const response = await axios.post(`http://localhost:8080/api/user/payments/create`, {
                sessionId: sessionData.sessionId,
                serviceIds: selectedServices,
                paymentMethod: paymentMethod
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            setPaymentModalVisible(false);
            
            // Redirect to Mock Gateway
            if (response.data.paymentUrl) {
                window.location.href = response.data.paymentUrl;
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to initialize checkout');
            setPrepayLoading(false);
        }
    };

    if (loading) {
        return (
            <Content style={{ padding: '50px', textAlign: 'center' }}>
                <Spin size="large" />
            </Content>
        );
    }

    if (!sessionData) {
        return (
            <Content style={{ padding: '50px', textAlign: 'center' }}>
                <Title level={3}>No Active Parking Session</Title>
                <Text type="secondary">When you enter the parking lot, your session details will appear here.</Text>
            </Content>
        );
    }

    return (
        <Content style={{ padding: '24px', maxWidth: 600, margin: '0 auto' }}>
            <Title level={2}>Active Session</Title>

            {sessionData.isFlagged && (
                <Alert
                    message="INCIDENT REPORTED"
                    description={
                        <div>
                            <Text strong>Your vehicle has been flagged by parking staff.</Text>
                            <br />
                            Reasons: {sessionData.incidentDetails?.length > 0 ? sessionData.incidentDetails.join(', ') : 'Violation detected'}
                            <br />
                            Please return to your vehicle immediately to resolve this with the staff.
                            {sessionData.penaltyFee > 0 && (
                                <Text type="danger" style={{ display: 'block', marginTop: 8 }}>
                                    Estimated Penalty Fee: {sessionData.penaltyFee.toLocaleString()} VNĐ
                                </Text>
                            )}
                        </div>
                    }
                    type="error"
                    showIcon
                    banner
                    style={{ marginBottom: 24, borderRadius: 8 }}
                />
            )}
            
            {gracePeriodEnd ? (
                <Card style={{ background: '#f6ffed', borderColor: '#b7eb8f', marginBottom: 24, textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                    <Title level={3} style={{ color: '#52c41a' }}>Payment Successful</Title>
                    <Text>You have a grace period to exit the parking lot.</Text>
                    <div style={{ marginTop: 16 }}>
                        <Statistic title="Time Remaining to Exit" value={countdown} valueStyle={{ color: '#cf1322', fontWeight: 'bold' }} />
                    </div>
                    <div style={{ marginTop: 24 }}>
                        <Text type="secondary">Scan this QR at the exit gate</Text>
                        <br />
                        <QRCode value={`SESSION:${sessionData.sessionId}:PREPAID`} style={{ margin: '16px auto' }} />
                    </div>
                </Card>
            ) : (
                <Card style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 24]}>
                        <Col span={12}>
                            <Statistic title="License Plate" value={sessionData.licensePlate} prefix={<CarOutlined />} />
                        </Col>
                        <Col span={12}>
                            <Statistic title="Duration" value={`${sessionData.durationMinutes} mins`} prefix={<ClockCircleOutlined />} />
                        </Col>
                        <Col span={24}>
                            <Card type="inner" style={{ background: '#fafafa' }}>
                                <Statistic 
                                    title="Current Accrued Fee" 
                                    value={sessionData.totalFee} 
                                    suffix="VNĐ" 
                                    prefix={<DollarOutlined />}
                                    valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
                                />
                                {sessionData.penaltyFee > 0 && (
                                    <Text type="danger" style={{ fontSize: 12 }}>
                                        Includes {sessionData.penaltyFee.toLocaleString()} VNĐ penalty.
                                    </Text>
                                )}
                            </Card>
                        </Col>
                    </Row>
                    
                    <div style={{ marginTop: 24 }}>
                        <Divider orientation="left"><PlusCircleOutlined /> Add-on Services</Divider>
                        <List
                            dataSource={additionalServices}
                            renderItem={item => (
                                <List.Item>
                                    <Checkbox 
                                        checked={selectedServices.includes(item.serviceId)}
                                        onChange={() => toggleService(item.serviceId)}
                                    >
                                        <Text strong>{item.serviceName}</Text> - <Text type="success">{item.serviceUnitPrice || item.unitPrice} VNĐ</Text>
                                    </Checkbox>
                                </List.Item>
                            )}
                        />
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <Button 
                            type="primary" 
                            size="large" 
                            block 
                            disabled={calculateClientTotal() <= 0}
                            onClick={() => setPaymentModalVisible(true)}
                        >
                            Checkout ({calculateClientTotal().toLocaleString()} VNĐ)
                        </Button>
                        <Button 
                            danger
                            type="dashed"
                            size="large" 
                            block 
                            style={{ marginTop: 12 }}
                            icon={<ExclamationCircleOutlined />}
                            onClick={() => navigate(`/user/feedback-form?sessionId=${sessionData.sessionId}&buildingId=${sessionData.buildingId}`)}
                        >
                            Report an Issue
                        </Button>
                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                            You will have 15 minutes to leave after payment.
                        </Text>
                    </div>
                </Card>
            )}

            <Card title="Parking Location Details" size="small">
                <p><strong>Floor:</strong> {sessionData.floorName}</p>
                <p><strong>Slot:</strong> {sessionData.slotName}</p>
                <p><strong>Time In:</strong> {new Date(sessionData.timeIn).toLocaleString()}</p>
            </Card>

            <Modal
                title="Select Payment Method"
                open={paymentModalVisible}
                onCancel={() => setPaymentModalVisible(false)}
                footer={null}
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Title level={4}>Total to pay: {calculateClientTotal().toLocaleString()} VNĐ</Title>
                    <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
                        <Button size="large" block onClick={() => handleCheckout('MOMO')} loading={prepayLoading} style={{ background: '#a50064', color: 'white' }}>
                            Pay with MoMo
                        </Button>
                        <Button size="large" block onClick={() => handleCheckout('ZALOPAY')} loading={prepayLoading} style={{ background: '#0068ff', color: 'white', marginTop: 10 }}>
                            Pay with ZaloPay
                        </Button>
                        <Button size="large" block onClick={() => handleCheckout('CREDIT_CARD')} loading={prepayLoading} style={{ marginTop: 10 }}>
                            Credit / Debit Card
                        </Button>
                    </Space>
                </div>
            </Modal>
        </Content>
    );
};

export default UserActiveSession;
