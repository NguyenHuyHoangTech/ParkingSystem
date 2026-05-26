import React, { useState, useRef } from 'react';
import { Layout, Typography, Card, Form, Input, Button, message, Alert, Row, Col, Select, Divider } from 'antd';
import { QrcodeOutlined, CarOutlined, DollarOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import ParkingMap from '../../components/ParkingMap';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const BASE_URL = 'http://localhost:8080/api/staff';

const StaffCheckOut = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [form] = Form.useForm();
    const cardInputRef = useRef(null);
    
    const [loading, setLoading] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [mismatchError, setMismatchError] = useState(false);
    const [outImage, setOutImage] = useState(null);
    const [vnpayUrl, setVnpayUrl] = useState('');

    // Handle auto-navigated camera data
    useEffect(() => {
        if (location.state?.cameraExitData) {
            const data = location.state.cameraExitData;
            console.log("CAMERA EXIT (From Layout)", data);
            
            form.setFieldsValue({
                exitPlate: data.plate
            });
            
            if (data.imageUrl) {
                setOutImage(data.imageUrl);
            }
            
            // Automatically find session by plate
            handleFindSessionByPlate(data.plate);
        }
    }, [location.state?.cameraExitData]);

    // Map state
    const [floors, setFloors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [structures, setStructures] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(null);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [floorsRes, slotsRes, structuresRes] = await Promise.all([
                    axios.get(`${BASE_URL}/floors`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${BASE_URL}/slots`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${BASE_URL}/structures`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setFloors(floorsRes.data);
                if (floorsRes.data.length > 0) setSelectedFloor(floorsRes.data[0].floorId);
                setSlots(slotsRes.data);
                setStructures(structuresRes.data);
            } catch (error) {
                console.error('Failed to load map data', error);
            }
        };
        fetchMapData();
    }, []);

    // Step 1: Find Session by scanning card
    const handleFindSession = async () => {
        const cardCode = form.getFieldValue('cardCode');
        if (!cardCode) return;

        try {
            setLoading(true);
            setMismatchError(false);
            const response = await axios.get(`${BASE_URL}/check-out/find`, {
                params: { cardCode },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            // Auto-detect if it was prepaid
            if (response.data.totalFee === 0) {
                form.setFieldsValue({ paymentMethod: 'PREPAID' });
            } else {
                form.setFieldsValue({ paymentMethod: 'CASH' });
            }
            
            setSessionData(response.data);
        } catch (error) {
            console.error('Find session failed', error);
            message.error(error.response?.data?.message || 'Session not found for this card');
            setSessionData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleFindSessionByPlate = async (plate) => {
        try {
            setLoading(true);
            setMismatchError(false);
            const response = await axios.get(`${BASE_URL}/check-out/find`, {
                params: { plate },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (response.data.totalFee === 0) {
                form.setFieldsValue({ paymentMethod: 'PREPAID' });
            } else {
                form.setFieldsValue({ paymentMethod: 'CASH' });
            }
            
            setSessionData(response.data);
            message.success(`Session automatically loaded for plate: ${plate}`);
        } catch (error) {
            console.error('Find session by plate failed', error);
            message.error(error.response?.data?.message || 'Session not found for this plate. Please scan card manually.');
            setSessionData(null);
            if (cardInputRef.current) {
                cardInputRef.current.focus();
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Confirm Payment & Exit
    const handleConfirmCheckOut = async (values) => {
        if (!sessionData) return;

        try {
            setLoading(true);
            setMismatchError(false);

            const payload = {
                paymentMethod: values.paymentMethod,
                exitPlate: form.getFieldValue('exitPlate'), // Extract explicitly since disabled fields might be omitted
                gateId: 2, // Hardcoded OUT gate for MVP
                staffId: user?.accountId || 3, // Fallback to 3 if not present (Staff ID in DB)
                overrideFlag: false // Normally false, unless manager approves
            };

            if (values.paymentMethod === 'VNPAY' && !vnpayUrl) {
                // If VNPAY is selected but URL is not generated yet
                const amount = sessionData.totalFee;
                const orderInfo = `Pay for session ${sessionData.sessionId}`;
                const res = await axios.get(`http://localhost:8080/api/v1/payment/vnpay/create-url?amount=${amount}&orderInfo=${orderInfo}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setVnpayUrl(res.data.url);
                message.info('VNPay URL generated. Please complete payment.');
                setLoading(false);
                return;
            }

            await axios.post(`${BASE_URL}/check-out/${sessionData.sessionId}`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            message.success('Check-out successful! Barrier opening...');
            
            // Reset for next car
            form.resetFields();
            setSessionData(null);
            setVnpayUrl('');
            if (cardInputRef.current) {
                cardInputRef.current.focus();
            }

        } catch (error) {
            console.error('Check-out failed', error);
            const status = error.response?.status;
            
            if (status === 409) {
                // Conflict: License Plate Mismatch
                setMismatchError(true);
                message.error('CRITICAL: License Plate Mismatch! Please report to Manager.');
            } else {
                message.error(error.response?.data?.message || 'Check-out failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Content style={{ padding: '24px', minHeight: 280 }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Gate Check-out Station</Title>
                <Text type="secondary">Process vehicle exit and collect payment</Text>
            </div>

            <Row gutter={[24, 24]}>
                {/* Left Panel: Scan and Exit Info */}
                <Col span={12}>
                    <Card title="Vehicle Exit Information" bordered={false}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleConfirmCheckOut}
                            initialValues={{ paymentMethod: 'CASH' }}
                        >
                            <Form.Item
                                name="cardCode"
                                label="Scan Physical RFID Card"
                                rules={[{ required: true, message: 'Scan physical card' }]}
                            >
                                <Input 
                                    size="large" 
                                    prefix={<QrcodeOutlined />} 
                                    placeholder="Scan card to load session..." 
                                    ref={cardInputRef}
                                    onPressEnter={handleFindSession}
                                />
                            </Form.Item>
                            
                            <Button 
                                type="dashed" 
                                onClick={handleFindSession} 
                                style={{ marginBottom: 24, width: '100%' }}
                                loading={loading && !sessionData}
                            >
                                Load Session Data
                            </Button>

                            <Form.Item
                                name="exitPlate"
                                label="Exit License Plate (ALPR Camera)"
                                rules={[{ required: true, message: 'Camera must read exit plate' }]}
                            >
                                <Input 
                                    size="large" 
                                    prefix={<CarOutlined />} 
                                    placeholder="Simulated exit camera feed..." 
                                    disabled={!sessionData}
                                />
                            </Form.Item>

                            <Form.Item
                                name="paymentMethod"
                                label="Payment Method"
                            >
                                <Select size="large" disabled={!sessionData}>
                                    <Option value="CASH">Cash</Option>
                                    <Option value="MOMO">MoMo Wallet</Option>
                                    <Option value="VNPAY">VNPay</Option>
                                    <Option value="PREPAID">Pre-paid / Booking</Option>
                                </Select>
                            </Form.Item>

                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                size="large" 
                                block 
                                loading={loading && sessionData}
                                disabled={!sessionData || mismatchError}
                                icon={<DollarOutlined />}
                            >
                                {vnpayUrl ? 'Confirm VNPay Paid & Open Barrier' : 'Confirm Payment & Open Barrier'}
                            </Button>

                            {vnpayUrl && (
                                <div style={{ marginTop: 16, textAlign: 'center' }}>
                                    <Text type="secondary">Scan QR or Click Link to Pay:</Text>
                                    <br/>
                                    <a href={vnpayUrl} target="_blank" rel="noreferrer">Open VNPay Payment Gateway</a>
                                </div>
                            )}
                        </Form>
                    </Card>
                </Col>
                
                {/* Right Panel: Split-view Verification and Fee */}
                <Col span={12}>
                    <Card title="Verification & Billing" bordered={false} style={{ height: '100%' }}>
                        {!sessionData ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                                <QrcodeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                                <br />
                                Waiting for card scan...
                            </div>
                        ) : (
                            <div>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Card type="inner" title="Entry Record (System)">
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ background: '#f0f2f5', padding: '20px', marginBottom: 10, borderRadius: 4 }}>
                                                    [Entry Camera Image]
                                                </div>
                                                <Title level={4} style={{ margin: 0 }}>{sessionData.licensePlate}</Title>
                                                <Text type="secondary">{new Date(sessionData.timeIn).toLocaleString()}</Text>
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col span={12}>
                                        <Card type="inner" title="Exit Record (Live)">
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ background: '#e6f7ff', padding: outImage ? '0' : '20px', marginBottom: 10, borderRadius: 4, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                    {outImage ? (
                                                        <img src={outImage} alt="Exit Camera" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                    ) : (
                                                        <span>[Exit Camera Image]</span>
                                                    )}
                                                </div>
                                                <Title level={4} style={{ margin: 0, color: mismatchError ? 'red' : 'inherit' }}>
                                                    {form.getFieldValue('exitPlate') || 'Pending...'}
                                                </Title>
                                                <Text type="secondary">Live Feed</Text>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>

                                {mismatchError && (
                                    <Alert
                                        message="SECURITY ALERT: License Plate Mismatch"
                                        description="The vehicle exiting does not match the entry record. Payment is locked. Please request a Manager Override."
                                        type="error"
                                        showIcon
                                        icon={<WarningOutlined />}
                                        style={{ marginTop: 16 }}
                                    />
                                )}

                                <Divider />

                                <div style={{ textAlign: 'right' }}>
                                    <Text type="secondary" style={{ fontSize: 16 }}>Duration: {sessionData.durationMinutes} minutes</Text>
                                    <br/>
                                    <Text type="secondary" style={{ fontSize: 16 }}>Base Fee: {sessionData.totalFee - sessionData.penaltyFee} VNĐ</Text>
                                    <br/>
                                    <Text type="danger" style={{ fontSize: 16 }}>Penalty: {sessionData.penaltyFee} VNĐ</Text>
                                    <Title level={2} style={{ color: '#52c41a', marginTop: 8 }}>
                                        Total: {sessionData.totalFee} VNĐ
                                    </Title>
                                </div>
                            </div>
                        )}

                        <Divider />
                        
                        <div style={{ marginTop: 24 }}>
                            <Select 
                                style={{ width: 200, marginBottom: 16 }} 
                                value={selectedFloor}
                                onChange={(val) => setSelectedFloor(val)}
                                placeholder="Select Floor"
                            >
                                {floors.map(f => <Option key={f.floorId} value={f.floorId}>{f.floorName}</Option>)}
                            </Select>
                            
                            {selectedFloor && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', width: '100%', border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
                                    <ParkingMap 
                                        slots={slots.filter(s => s.floor?.floorId === selectedFloor)} 
                                        structures={structures.filter(st => st.floor?.floorId === selectedFloor)} 
                                        cols={floors.find(f => f.floorId === selectedFloor)?.mapCols || 15} 
                                        rows={floors.find(f => f.floorId === selectedFloor)?.mapRows || 10} 
                                        editable={false} 
                                    />
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </Content>
    );
};

export default StaffCheckOut;
