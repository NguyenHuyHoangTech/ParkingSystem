import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Card, Form, Input, Button, message, Select, Space, Alert, Row, Col } from 'antd';
import { CarOutlined, QrcodeOutlined, SelectOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import ParkingMap from '../../components/ParkingMap';
import { useLocation } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const BASE_URL = 'http://localhost:8080/api/staff';

const StaffCheckIn = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [form] = Form.useForm();
    const cardInputRef = useRef(null);
    
    const [loading, setLoading] = useState(false);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [checkResult, setCheckResult] = useState(null);
    const [inImage, setInImage] = useState(null);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [qrScannerVisible, setQrScannerVisible] = useState(false);

    // Handle auto-navigated camera data
    useEffect(() => {
        if (location.state?.cameraEntryData) {
            const data = location.state.cameraEntryData;
            console.log("CAMERA ENTRY (From Layout)", data);
            
            form.setFieldsValue({
                licensePlate: data.plate,
                typeId: data.typeId || 3 // Default to Car if missing
            });
            
            if (data.imageUrl) {
                setInImage(data.imageUrl);
            }
            
            // Auto check-entry conditions based on received plate
            checkEntry(data.plate, data.typeId || 3);
            
        }
    }, [location.state?.cameraEntryData]);

    // Map state
    const [floors, setFloors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [structures, setStructures] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(null);

    useEffect(() => {
        // Fetch vehicle types for dropdown
        const fetchVehicleTypes = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/public/vehicle-types');
                setVehicleTypes(response.data);
            } catch (error) {
                console.error('Failed to load vehicle types', error);
            }
        };
        
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
        
        fetchVehicleTypes();
        fetchMapData();
    }, []);

    const handleQRScan = async (qrValue) => {
        if (!qrValue || !qrValue.startsWith('QR:BOOKING:')) {
            message.error('Invalid QR Code. Please scan a valid Booking QR.');
            return;
        }

        const parts = qrValue.split(':');
        const bookingId = parts[2];
        if (!bookingId) {
            message.error('Booking ID not found in QR.');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${BASE_URL}/bookings/${bookingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const bookingData = res.data;
            
            form.setFieldsValue({
                licensePlate: bookingData.licensePlate,
                typeId: bookingData.vehicleType?.typeId || 1,
                bookingId: bookingData.bookingId
            });
            message.success('Booking recognized successfully!');
            
            // Auto check entry
            checkEntry(bookingData.licensePlate, bookingData.vehicleType?.typeId || 1);

        } catch (error) {
            console.error(error);
            message.error('Failed to retrieve Booking details. The QR might be invalid.');
        } finally {
            setLoading(false);
            setQrScannerVisible(false); // Hide the input after scan
        }
    };

    const checkEntry = async (plate, typeId) => {
        if (!plate || !typeId) return;
        setLoading(true);
        setCheckResult(null);
        try {
            const checkRes = await axios.get(`${BASE_URL}/check-in/check`, {
                params: { plate, typeId },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            const checkData = checkRes.data;

            if (checkData.canEnter) {
                setCheckResult({ type: 'success', message: checkData.message, floor: checkData.suggestedFloorName });
                setSelectedSlotId(checkData.suggestedSlotId || null);
                if (checkData.bookingId) {
                    form.setFieldsValue({ bookingId: checkData.bookingId });
                }
            } else {
                message.error(checkData.message || 'Vehicle cannot enter');
                setCheckResult({ type: 'error', message: checkData.message });
                setSelectedSlotId(null);
            }

            // Move focus to card input automatically
            if (cardInputRef.current) {
                cardInputRef.current.focus();
            }

        } catch (error) {
            console.error('Check entry failed', error);
            message.error(error.response?.data?.message || 'Check failed');
            setCheckResult({ type: 'error', message: 'Check failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAndSubmit = async (values) => {
        try {
            setLoading(true);
            setCheckResult(null);

            // 1. Check entry condition to get allocated slot
            const checkRes = await axios.get(`${BASE_URL}/check-in/check`, {
                params: {
                    plate: values.licensePlate,
                    typeId: values.typeId
                },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            const checkData = checkRes.data;

            if (checkData.canEnter) {
                setCheckResult({ type: 'success', message: checkData.message, floor: checkData.suggestedFloorName });
                if (!selectedSlotId) {
                    setSelectedSlotId(checkData.suggestedSlotId || null);
                }
                if (checkData.bookingId) {
                    form.setFieldsValue({ bookingId: checkData.bookingId });
                    values.bookingId = checkData.bookingId; // Update local values
                }
            } else {
                message.error(checkData.message || 'Vehicle cannot enter');
                setCheckResult({ type: 'error', message: checkData.message });
                setSelectedSlotId(null);
                setLoading(false);
                return;
            }

            // 2. Confirm Check-in
            const payload = {
                licensePlate: values.licensePlate,
                typeId: values.typeId,
                slotId: selectedSlotId || checkData.suggestedSlotId,
                cardCode: values.cardCode,
                bookingId: values.bookingId ? Number(values.bookingId) : null,
                gateId: 1, // Hardcoded for MVP, should come from Staff config
                staffId: user?.accountId
            };

            await axios.post(`${BASE_URL}/check-in`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            message.success('Check-in successful! Barrier opening...');
            setCheckResult({
                type: 'success',
                message: 'Check-in successful! Barrier opening...',
                floor: checkData.suggestedFloorName
            });

            // Reset form for next vehicle
            form.resetFields();
            setSelectedSlotId(null);
            setInImage(null);
            
            // Focus card input automatically for the next scan
            if (cardInputRef.current) {
                cardInputRef.current.focus();
            }

        } catch (error) {
            console.error('Check-in failed', error);
            const errorMsg = error.response?.data?.message || error.message || 'Check-in failed';
            message.error(errorMsg);
            setCheckResult({ type: 'error', message: errorMsg });
            
            // Re-focus on card input so staff can quickly scan a new card
            if (cardInputRef.current) {
                form.setFieldsValue({ cardCode: '' });
                cardInputRef.current.focus();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Content style={{ padding: '24px', minHeight: 280 }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Gate Check-in Station</Title>
                    <Text type="secondary">Automated ALPR and RFID scanning interface</Text>
                </div>
                <Button type="primary" icon={<QrcodeOutlined />} onClick={() => setQrScannerVisible(!qrScannerVisible)}>
                    Scan Booking QR
                </Button>
            </div>

            {qrScannerVisible && (
                <Card style={{ marginBottom: 24, background: '#e6f7ff', borderColor: '#91d5ff' }}>
                    <Input.Search 
                        placeholder="Click here and scan the QR code from the user..." 
                        enterButton="Process" 
                        size="large" 
                        onSearch={handleQRScan} 
                        autoFocus
                    />
                </Card>
            )}

            <Row gutter={[24, 24]}>
                <Col span={12}>
                    <Card title="Vehicle Information" bordered={false}>
                        {inImage && (
                            <div style={{ marginBottom: 16, textAlign: 'center', height: 200, width: '100%', border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                                <img src={inImage} alt="Vehicle In" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                            </div>
                        )}
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleCheckAndSubmit}
                            initialValues={{ typeId: 1 }} // Default to Car or first type
                        >
                            <Form.Item
                                name="licensePlate"
                                label="License Plate (ALPR Camera)"
                                rules={[
                                    { required: true, message: 'Missing license plate' }
                                ]}
                            >
                                <Input 
                                    size="large" 
                                    prefix={<CarOutlined />} 
                                    placeholder="Enter or scan license plate" 
                                    autoFocus
                                />
                            </Form.Item>

                            <Form.Item
                                name="typeId"
                                label="Vehicle Type"
                                rules={[{ required: true, message: 'Missing vehicle type' }]}
                            >
                                <Select size="large">
                                    {vehicleTypes.map(type => (
                                        <Option key={type.typeId} value={type.typeId}>
                                            {type.typeName}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="bookingId"
                                label="Pre-booking ID (Optional)"
                                help="Nhập ID đặt trước nếu khách hàng đã đặt trước chỗ"
                            >
                                <Input 
                                    size="large" 
                                    placeholder="Ví dụ: 1024" 
                                />
                            </Form.Item>

                            <Form.Item label="Physical RFID Card" required>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Form.Item
                                        name="cardCode"
                                        rules={[{ required: true, message: 'Scan physical card' }]}
                                        style={{ marginBottom: 0, flex: 1 }}
                                    >
                                        <Input 
                                            size="large" 
                                            prefix={<QrcodeOutlined />} 
                                            placeholder="Scan RFID card here..." 
                                            ref={cardInputRef}
                                        />
                                    </Form.Item>
                                    <Button 
                                        size="large" 
                                        onClick={() => {
                                            const randomCard = 'CARD-' + Math.floor(100000 + Math.random() * 900000);
                                            form.setFieldsValue({ cardCode: randomCard });
                                            message.success('Đã tạo thẻ tự động: ' + randomCard);
                                        }}
                                    >
                                        Lấy thẻ tự động
                                    </Button>
                                </div>
                                <div style={{ marginTop: '4px', color: '#888', fontSize: '12px' }}>
                                    Scan the card or click the button to generate a random card.
                                </div>
                            </Form.Item>

                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                size="large" 
                                block 
                                loading={loading}
                                icon={<SelectOutlined />}
                            >
                                Confirm & Open Barrier
                            </Button>
                        </Form>
                    </Card>
                </Col>
                
                <Col span={12}>
                    <Card title="System Feedback & Allocation" bordered={false} style={{ height: '100%' }}>
                        {!checkResult && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                                <QrcodeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                                <br />
                                Waiting for vehicle scan...
                            </div>
                        )}
                        
                        {checkResult && checkResult.type === 'error' && (
                            <Alert
                                message="Check-in Rejected"
                                description={checkResult.message}
                                type="error"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        {checkResult && checkResult.type === 'success' && (
                            <Alert
                                message="Access Granted"
                                description={
                                    <div>
                                        <p>{checkResult.message}</p>
                                        <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                                            <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
                                                Direct to: Floor {checkResult.floor}
                                            </Title>
                                        </div>
                                    </div>
                                }
                                type="success"
                                showIcon
                            />
                        )}

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
                                        highlightedSlotId={selectedSlotId}
                                        onSlotClick={(slot) => {
                                            if (slot.status === 'Available') {
                                                setSelectedSlotId(slot.slotId);
                                                message.success(`Đã chọn vị trí: ${slot.slotName}`);
                                            } else {
                                                message.warning(`Vị trí ${slot.slotName} đang ở trạng thái ${slot.status}, không thể chọn.`);
                                            }
                                        }}
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

export default StaffCheckIn;
