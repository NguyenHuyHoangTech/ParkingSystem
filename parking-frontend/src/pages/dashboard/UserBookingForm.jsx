import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Form, DatePicker, Select, Button, Row, Col, Spin, message, Modal, Radio, Space, Input } from 'antd';
import { EnvironmentOutlined, CarOutlined, CreditCardOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const { Content } = Layout;
const { Title, Text } = Typography;

const BASE_URL = 'http://localhost:8080/api/user';

const UserBookingForm = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [availableFloors, setAvailableFloors] = useState([]);
    const [floorsLoading, setFloorsLoading] = useState(false);

    const [selectedFloor, setSelectedFloor] = useState(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [pendingBookingId, setPendingBookingId] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const [bldgRes, typesRes] = await Promise.all([
                axios.get(`${BASE_URL}/buildings`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:8080/api/public/vehicle-types`)
            ]);
            setBuildings(bldgRes.data);
            setVehicleTypes(typesRes.data);
        } catch (error) {
            console.error(error);
            message.error('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAvailability = async (values) => {
        const { buildingId, typeId, timeRange } = values;
        const [start, end] = timeRange;
        
        const startTime = start.format('YYYY-MM-DDTHH:mm:ss');
        const endTime = end.format('YYYY-MM-DDTHH:mm:ss');

        try {
            setFloorsLoading(true);
            setSelectedFloor(null);
            const response = await axios.get(`${BASE_URL}/buildings/${buildingId}/availability`, {
                params: { typeId, startTime, endTime },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setAvailableFloors(response.data);
            if (response.data.length === 0) {
                message.warning('No available floors for the selected time and vehicle type.');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to check availability');
        } finally {
            setFloorsLoading(false);
        }
    };

    const handleBookFloor = async () => {
        if (!selectedFloor) {
            message.error("Please select a floor first.");
            return;
        }

        const values = form.getFieldsValue();
        const { typeId, licensePlate, timeRange } = values;
        const [start, end] = timeRange;

        try {
            setBookingLoading(true);
            const response = await axios.post(`${BASE_URL}/bookings`, null, {
                params: {
                    typeId,
                    floorId: selectedFloor.floorId,
                    licensePlate,
                    startTime: start.format('YYYY-MM-DDTHH:mm:ss'),
                    endTime: end.format('YYYY-MM-DDTHH:mm:ss')
                },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            setPendingBookingId(response.data.bookingId);
            setPaymentModalVisible(true);
        } catch (error) {
            message.error(error.response?.data?.message || 'Booking failed. The floor might have just been fully booked.');
            // Refresh availability
            handleCheckAvailability(form.getFieldsValue());
        } finally {
            setBookingLoading(false);
        }
    };

    const handlePayment = async (paymentMethod) => {
        try {
            setBookingLoading(true);
            await axios.post(`${BASE_URL}/bookings/${pendingBookingId}/confirm-payment`, null, {
                params: { paymentMethod },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            message.success('Payment successful! Your booking is confirmed.');
            setPaymentModalVisible(false);
            navigate('/user/bookings'); // redirect to my tickets
        } catch (error) {
            message.error(error.response?.data?.message || 'Payment failed.');
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <Content style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
            <Title level={2}>Advance Booking</Title>
            <Text type="secondary">Reserve your parking spot ahead of time.</Text>

            <Spin spinning={loading}>
                <Card style={{ marginTop: 24 }}>
                    <Form 
                        form={form} 
                        layout="vertical" 
                        onFinish={handleCheckAvailability}
                        initialValues={{ timeRange: [moment().add(1, 'hours'), moment().add(3, 'hours')] }}
                    >
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="buildingId" label="Select Building" rules={[{ required: true }]}>
                                    <Select placeholder="Choose a location" prefix={<EnvironmentOutlined />}>
                                        {buildings.map(b => (
                                            <Select.Option key={b.buildingId} value={b.buildingId} disabled={!['OPEN', 'Active', 'ACTIVE'].includes(b.status?.toUpperCase() || '')}>
                                                {b.name} {!['OPEN', 'Active', 'ACTIVE'].includes(b.status?.toUpperCase() || '') ? `(${b.status})` : ''}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="typeId" label="Vehicle Type" rules={[{ required: true }]}>
                                    <Select placeholder="Select vehicle type">
                                        {vehicleTypes.map(t => (
                                            <Select.Option key={t.typeId} value={t.typeId}>{t.typeName}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item name="licensePlate" label="License Plate" rules={[{ required: true, message: 'Please enter license plate' }]}>
                                    <Input placeholder="e.g. 51F-123.45" />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item 
                                    name="timeRange" 
                                    label="Time Range" 
                                    rules={[{ required: true, message: 'Please select time range' }]}
                                >
                                    <DatePicker.RangePicker 
                                        showTime 
                                        format="YYYY-MM-DD HH:mm" 
                                        style={{ width: '100%' }} 
                                        disabledDate={(current) => current && current < moment().endOf('day').subtract(1, 'days')}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Button type="primary" htmlType="submit" icon={<CalendarOutlined />} block loading={floorsLoading}>
                            Check Availability
                        </Button>
                    </Form>
                </Card>

                {availableFloors.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                        <Title level={4}>Available Floors</Title>
                        <Row gutter={[16, 16]}>
                            {availableFloors.map(floor => (
                                <Col xs={24} sm={12} key={floor.floorId}>
                                    <Card 
                                        hoverable 
                                        onClick={() => setSelectedFloor(floor)}
                                        style={{ 
                                            borderColor: selectedFloor?.floorId === floor.floorId ? '#1890ff' : '#d9d9d9',
                                            borderWidth: selectedFloor?.floorId === floor.floorId ? 2 : 1
                                        }}
                                    >
                                        <Card.Meta 
                                            title={floor.floorName} 
                                        />
                                        <div style={{ marginTop: 16 }}>
                                            <Text type="secondary">Available Spots:</Text>
                                            <Title level={3} style={{ color: floor.availableCapacity > 5 ? '#52c41a' : '#faad14', margin: 0 }}>
                                                {floor.availableCapacity}
                                            </Title>
                                            <div style={{ marginTop: 8 }}>
                                                <Text strong>Estimated Fee: </Text>
                                                <Text type="danger">{floor.estimatedFee.toLocaleString()} VNĐ</Text>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                        
                        <Button 
                            type="primary" 
                            size="large" 
                            style={{ marginTop: 24 }} 
                            block 
                            disabled={!selectedFloor}
                            onClick={handleBookFloor}
                            loading={bookingLoading}
                            icon={<CreditCardOutlined />}
                        >
                            Proceed to Payment
                        </Button>
                    </div>
                )}
            </Spin>

            <Modal
                title="Complete Your Payment"
                open={paymentModalVisible}
                onCancel={() => {
                    // Do not cancel the booking automatically on modal close in this MVP, 
                    // or call DELETE /api/user/bookings/{pendingBookingId}
                    setPaymentModalVisible(false);
                }}
                footer={null}
                closable={false}
                maskClosable={false}
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Title level={4}>Total to pay: {selectedFloor?.estimatedFee?.toLocaleString()} VNĐ</Title>
                    <Text type="secondary">Your reservation will be held for 5 minutes pending payment.</Text>
                    
                    <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
                        <Button size="large" block onClick={() => handlePayment('MOMO')} loading={bookingLoading} style={{ background: '#a50064', color: 'white' }}>
                            Pay with MoMo
                        </Button>
                        <Button size="large" block onClick={() => handlePayment('ZALOPAY')} loading={bookingLoading} style={{ background: '#0068ff', color: 'white', marginTop: 10 }}>
                            Pay with ZaloPay
                        </Button>
                        <Button size="large" block onClick={() => handlePayment('CREDIT_CARD')} loading={bookingLoading} style={{ marginTop: 10 }}>
                            Credit / Debit Card
                        </Button>
                        <Button type="link" onClick={() => {
                            setPaymentModalVisible(false);
                            message.info('Booking saved as PENDING. You can pay later in My Tickets or pay at the gate.');
                            navigate('/user/bookings');
                        }} block>
                            Pay Later
                        </Button>
                    </Space>
                </div>
            </Modal>
        </Content>
    );
};

export default UserBookingForm;
