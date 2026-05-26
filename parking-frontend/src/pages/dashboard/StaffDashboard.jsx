import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Input, Button, Select, Alert, Typography, Table, Tag, Modal, InputNumber, message, Space, Descriptions, Radio } from 'antd';
import { CarOutlined, PlusOutlined, SearchOutlined, CheckCircleOutlined, AlertOutlined, HistoryOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { PayPalButtons } from '@paypal/react-paypal-js';
import axiosInstance from '../../api/axiosInstance';
import dayjs from 'dayjs';
import ParkingMap from '../../components/ParkingMap';
import useSSE from '../../hooks/useSSE';

const { Title, Text } = Typography;
const { Option } = Select;

const StaffDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [vehicleTypes, setVehicleTypes] = useState([]);

  // States cho Check-In
  const [inPlate, setInPlate] = useState('');
  const [inTypeId, setInTypeId] = useState(null);
  const [inImage, setInImage] = useState('');
  const [inCardCode, setInCardCode] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  // States cho Check-Out
  const [outPlate, setOutPlate] = useState('');
  const [outCardCode, setOutCardCode] = useState('');
  const [outImage, setOutImage] = useState('');
  const [checkoutPreview, setCheckoutPreview] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // States cho Exceptions
  const [exceptions, setExceptions] = useState([]);
  const [loadingEx, setLoadingEx] = useState(false);
  const [isExModalOpen, setIsExModalOpen] = useState(false);
  const [exForm] = Form.useForm();

  // State map
  const [slots, setSlots] = useState([]);
  const [floors, setFloors] = useState([]);
  const [structures, setStructures] = useState([]);
  const [selectedFloorIdIn, setSelectedFloorIdIn] = useState(null);
  const [selectedFloorIdOut, setSelectedFloorIdOut] = useState(null);

  // Load ban đầu
  const loadData = async () => {
    try {
      const typesRes = await axiosInstance.get('/public/vehicle-types');
      setVehicleTypes(typesRes.data.filter(t => t.status === 'Active'));

      const exRes = await axiosInstance.get('/staff/exceptions');
      setExceptions(exRes.data);

      const slotsRes = await axiosInstance.get('/public/slots');
      setSlots(slotsRes.data);

      const structRes = await axiosInstance.get('/public/structures');
      setStructures(structRes.data);

      const floorsRes = await axiosInstance.get('/public/floors');
      setFloors(floorsRes.data);
      if (floorsRes.data.length > 0) {
        setSelectedFloorIdIn(prev => prev || floorsRes.data[0].floorId);
        setSelectedFloorIdOut(prev => prev || floorsRes.data[0].floorId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== CHECK IN LOGIC =====
  const handleCheckInCheck = async (plateToCheck = inPlate, typeIdToCheck = inTypeId) => {
    if (!plateToCheck || !typeIdToCheck) {
      message.warning('Please enter license plate and select vehicle type!');
      return;
    }
    setCheckingIn(true);
    setCheckInResult(null);
    try {
      const res = await axiosInstance.get('/staff/check-in/check', {
        params: { plate: plateToCheck, typeId: typeIdToCheck }
      });
      setCheckInResult(res.data);
      if (!res.data.canEnter) {
        message.error(res.data.message || 'Not eligible to enter.');
      } else {
        message.success('Eligible! See suggested parking slot below.');
        setInCardCode('CARD-' + Math.random().toString(36).substring(2, 8).toUpperCase());
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'An error occurred.');
    } finally {
      setCheckingIn(false);
    }
  };

  useSSE(['SLOTS_UPDATED', 'PRICES_UPDATED', 'CONFIG_UPDATED', 'CAMERA_ENTRY', 'CAMERA_EXIT'], [
    () => { console.log('Slots updated from server'); loadData(); },
    () => { console.log('Prices updated from server'); loadData(); },
    () => { console.log('Config updated from server'); loadData(); },
    (dataString) => {
      try {
        const data = typeof dataString === 'string' ? JSON.parse(dataString) : dataString;
        console.log("CAMERA ENTRY", data);
        const plate = data.plate || '';
        const typeId = data.typeId ? Number(data.typeId) : 1;
        setInPlate(plate);
        setInTypeId(typeId);
        if (data.imageUrl) setInImage(data.imageUrl);
        navigate('/staff/checkin');
        message.info(`Vehicle entered: ${plate}. Auto-checking...`);
        // Auto check
        handleCheckInCheck(plate, typeId);
      } catch (e) { console.error(e); }
    },
    (dataString) => {
      try {
        const data = typeof dataString === 'string' ? JSON.parse(dataString) : dataString;
        console.log("CAMERA EXIT", data);
        const plate = data.plate || '';
        setOutPlate(plate);
        if (data.imageUrl) setOutImage(data.imageUrl);
        navigate('/staff/checkout');
        message.info(`Vehicle exited: ${plate}. Auto-checking...`);
        // Auto check
        handleFindActiveSession(plate);
      } catch (e) { console.error(e); }
    }
  ]);

  const handleRejectCheckIn = async () => {
    if (!inPlate) return;
    try {
      await axiosInstance.post('/public/iot/camera/reject', null, { params: { plate: inPlate } });
      message.success('Entry rejected and vehicle notified to leave.');
    } catch (error) {
      message.error('Failed to send reject signal.');
    }
    handleClearIn();
  };

  const handleConfirmCheckIn = async () => {
    if (!checkInResult || !checkInResult.suggestedSlotId) return;
    try {
      const res = await axiosInstance.post('/staff/check-in', {
        licensePlate: inPlate,
        typeId: inTypeId,
        slotId: checkInResult.suggestedSlotId,
        bookingId: checkInResult.bookingId,
        cardCode: inCardCode
      });
      Modal.success({
        title: 'Check-in successful!',
        content: (
          <div>
            <p><strong>Card Code:</strong> {res.data.cardCode}</p>
            <p><strong>License Plate:</strong> {res.data.licensePlateIn}</p>
            <p><strong>Assigned Slot:</strong> {res.data.slot?.slotName} ({res.data.slot?.floor?.floorName})</p>
            <p style={{ color: '#1890ff', fontWeight: 600 }}>Staff please print/hand card to driver.</p>
          </div>
        ),
      });
      setInPlate('');
      setInTypeId(null);
      setInImage('');
      setInCardCode('');
      setCheckInResult(null);
      loadData();
    } catch (error) {
      message.error('Error saving check-in.');
    }
  };

  const handleClearIn = () => {
    setInPlate('');
    setInTypeId(null);
    setInImage('');
    setInCardCode('');
    setCheckInResult(null);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} mins`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} hrs ${m} mins`;
  };

  // ===== CHECK OUT LOGIC =====
  const handleSlotClickOut = async (slot) => {
    if (slot.status !== 'Occupied') {
      message.info('This slot is currently empty or unavailable.');
      return;
    }
    setCheckingOut(true);
    setCheckoutPreview(null);
    try {
      const res = await axiosInstance.get('/staff/check-out/find-by-slot', {
        params: { slotId: slot.slotId }
      });
      setCheckoutPreview(res.data);
      setOutPlate(res.data.licensePlate);
      message.success('Fetched active session from slot!');
    } catch (error) {
      message.error(error.response?.data?.message || 'Error fetching session for this slot.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleFindActiveSession = async (plateToSearch = outPlate, cardCodeToSearch = outCardCode) => {
    if (!plateToSearch && !cardCodeToSearch) {
      message.warning('Enter license plate or card code to search!');
      return;
    }
    setCheckingOut(true);
    setCheckoutPreview(null);
    try {
      const res = await axiosInstance.get('/staff/check-out/find', {
        params: { plate: plateToSearch, cardCode: cardCodeToSearch }
      });
      setCheckoutPreview(res.data);
      message.success('Found active session!');
    } catch (error) {
      message.error(error.response?.data?.message || 'Vehicle not found in parking lot.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleConfirmCheckOut = async () => {
    if (!checkoutPreview) return;
    try {
      const res = await axiosInstance.post(`/staff/check-out/${checkoutPreview.sessionId}`, null, {
        params: { plateOut: outPlate }
      });
      Modal.success({
        title: 'Check-out successful!',
        content: (
          <div>
            <p><strong>License Plate:</strong> {res.data.licensePlate}</p>
            <p><strong>Duration:</strong> {formatDuration(res.data.durationMinutes)}</p>
            <p style={{ fontSize: 18, color: '#fa8c16', fontWeight: 700 }}>
              Total Fee: {res.data.totalFee.toLocaleString()} VND
            </p>
          </div>
        ),
      });
      setOutPlate('');
      setOutImage('');
      setCheckoutPreview(null);
      setPaymentMethod('Cash');
      loadData();
    } catch (error) {
      message.error('Error during payment/checkout.');
    }
  };

  const handleClearOut = () => {
    setOutPlate('');
    setOutCardCode('');
    setOutImage('');
    setCheckoutPreview(null);
    setPaymentMethod('Cash');
  };

  // ===== EXCEPTIONS LOGIC =====
  const handleCreateException = async (values) => {
    try {
      await axiosInstance.post('/staff/exceptions', {
        sessionId: values.sessionId,
        exceptionType: values.exceptionType,
        description: values.description,
        fineApplied: values.fineApplied
      });
      message.success('Exception recorded successfully.');
      setIsExModalOpen(false);
      exForm.resetFields();
      loadData();
    } catch (error) {
      message.error('Error recording exception.');
    }
  };

  const handleResolveException = async (id, status) => {
    try {
      await axiosInstance.put(`/staff/exceptions/${id}`, {
        status: status,
        resolutionNote: 'Resolved directly at operation gate.'
      });
      message.success('Exception status updated successfully.');
      loadData();
    } catch (error) {
      message.error('Update error.');
    }
  };

  const exceptionColumns = [
    { title: 'ID', dataIndex: 'exceptionId', key: 'id' },
    { title: 'Related Card', dataIndex: ['session', 'cardCode'], key: 'cardCode', render: (val) => val || 'None' },
    { title: 'License Plate', dataIndex: ['session', 'licensePlateIn'], key: 'plate', render: (val) => val || 'None' },
    { title: 'Exception Type', dataIndex: 'exceptionType', key: 'type', render: (val) => <Tag color="red">{val}</Tag> },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    { title: 'Fine', dataIndex: 'fineApplied', key: 'fine', render: (val) => val ? `${val.toLocaleString()} VND` : 'None' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Resolved' ? 'green' : 'gold'}>{status}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        record.status === 'Pending' && (
          <Space>
            <Button type="primary" size="small" style={{ background: '#52c41a', border: 'none' }} onClick={() => handleResolveException(record.exceptionId, 'Resolved')}>
              Resolve
            </Button>
            <Button danger size="small" onClick={() => handleResolveException(record.exceptionId, 'Rejected')}>
              Reject
            </Button>
          </Space>
        )
      )
    }
  ];

  const handleSlotClickIn = (slot) => {
    if (!checkInResult) {
      message.warning('Please check-in to get a suggested slot first.');
      return;
    }
    if (slot.status !== 'Available') {
      message.warning('Please select an Available slot.');
      return;
    }
    setCheckInResult({
      ...checkInResult,
      suggestedSlotId: slot.slotId,
      suggestedSlotName: slot.slotName,
      suggestedFloorName: slot.floor?.floorName,
    });
    message.success(`Changed slot to ${slot.slotName}`);
  };

  const displayedSlotsIn = selectedFloorIdIn ? slots.filter(s => s.floor?.floorId === selectedFloorIdIn) : slots;
  const displayedSlotsOut = selectedFloorIdOut ? slots.filter(s => s.floor?.floorId === selectedFloorIdOut) : slots;

  const currentFloorIn = floors.find(f => f.floorId === selectedFloorIdIn);
  const currentFloorOut = floors.find(f => f.floorId === selectedFloorIdOut);

  const displayedStructuresIn = selectedFloorIdIn ? structures.filter(s => s.floor?.floorId === selectedFloorIdIn) : structures;
  const displayedStructuresOut = selectedFloorIdOut ? structures.filter(s => s.floor?.floorId === selectedFloorIdOut) : structures;

  let checkoutSlotId = null;
  if (checkoutPreview) {
    const s = slots.find(s => s.slotName === checkoutPreview.slotName && s.floor?.floorName === checkoutPreview.floorName);
    if (s) checkoutSlotId = s.slotId;
  }

  const renderMap = () => (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4}><CarOutlined /> Parking Map</Title>
      </div>
      <ParkingMap 
        slots={slots} 
        structures={structures}
        cols={floors.length > 0 ? (floors[0].mapCols || 15) : 15}
        rows={floors.length > 0 ? (floors[0].mapRows || 10) : 10}
        editable={false} 
      />
    </div>
  );

  const renderCheckIn = () => (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4}><CarOutlined /> Check-In Gate</Title>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text strong>Floor Map:</Text>
          <Select
            value={selectedFloorIdIn}
            onChange={setSelectedFloorIdIn}
            style={{ width: 200 }}
            placeholder="Select Floor"
          >
            {floors.map(f => (
              <Option key={f.floorId} value={f.floorId}>{f.floorName}</Option>
            ))}
          </Select>
          <Text type="secondary" style={{ fontStyle: 'italic', fontSize: 12 }}>
            * Click an available slot to override suggestion
          </Text>
        </div>
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 8, background: '#fafafa' }}>
          <ParkingMap
            slots={displayedSlotsIn}
            structures={displayedStructuresIn}
            cols={currentFloorIn?.mapCols || 15}
            rows={currentFloorIn?.mapRows || 10}
            highlightedSlotId={checkInResult?.suggestedSlotId}
            onSlotClick={handleSlotClickIn}
          />
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Camera Data & Allocation" bordered={false} bodyStyle={{ padding: 12 }} style={{ background: '#fafafa', height: '100%' }}>
            <div style={{ marginBottom: 8, textAlign: 'center', height: 200, width: '100%', border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
              {inImage ? (
                <img src={inImage} alt="Vehicle In" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
              ) : (
                <Text type="secondary">Waiting for Camera...</Text>
              )}
            </div>
            <Form layout="vertical">
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item label="License Plate" required style={{ marginBottom: 8 }}>
                    <Input value={inPlate} onChange={(e) => setInPlate(e.target.value.toUpperCase())} onPressEnter={() => handleCheckInCheck()} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Vehicle Type" required style={{ marginBottom: 8 }}>
                    <Select value={inTypeId} onChange={setInTypeId}>
                      {vehicleTypes.map(t => (
                        <Option key={t.typeId} value={t.typeId}>{t.typeName}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Card Code" style={{ marginBottom: 8 }}>
                <Input disabled value={inCardCode || "Auto-generated on Check"} style={{ fontWeight: 'bold', color: inCardCode ? '#1890ff' : 'rgba(0,0,0,0.25)' }} />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          {checkInResult ? (
            <Card title="Result" bordered={false} bodyStyle={{ padding: 12 }} style={{ height: '100%' }}>
              {checkInResult.canEnter ? (
                <div>
                  <Alert message={<span style={{ fontWeight: 700 }}>ALLOWED ({checkInResult.entryType})</span>} description={checkInResult.message} type="success" showIcon style={{ marginBottom: 8 }} />
                  <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="Floor">{checkInResult.suggestedFloorName}</Descriptions.Item>
                    <Descriptions.Item label="Slot"><span style={{ fontSize: 16, color: '#1890ff', fontWeight: 700 }}>{checkInResult.suggestedSlotName}</span></Descriptions.Item>
                  </Descriptions>
                  <Button type="primary" onClick={handleConfirmCheckIn} block style={{ background: '#52c41a', border: 'none', marginBottom: 8 }}>
                    Confirm Entry
                  </Button>
                  <Button danger onClick={handleRejectCheckIn} block>
                    Reject Entry
                  </Button>
                </div>
              ) : (
                <div>
                  <Alert message="DENIED" description={checkInResult.message} type="error" showIcon style={{ marginBottom: 16 }} />
                  <Button danger onClick={handleRejectCheckIn} block>
                    Reject Entry
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card title="Result" bordered={false} bodyStyle={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }} style={{ height: '100%', background: '#fafafa' }}>
              <Text type="secondary">Submit camera data to see results</Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );

  const renderCheckOut = () => (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4}><HistoryOutlined /> Check-Out Gate</Title>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text strong>Floor Map:</Text>
          <Select
            value={selectedFloorIdOut}
            onChange={setSelectedFloorIdOut}
            style={{ width: 200 }}
            placeholder="Select Floor"
          >
            {floors.map(f => (
              <Option key={f.floorId} value={f.floorId}>{f.floorName}</Option>
            ))}
          </Select>
          <Text type="secondary" style={{ fontStyle: 'italic', fontSize: 12 }}>
            * The slot being checked out will blink
          </Text>
        </div>
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 8, background: '#fafafa' }}>
          <ParkingMap
            slots={displayedSlotsOut}
            structures={displayedStructuresOut}
            cols={currentFloorOut?.mapCols || 15}
            rows={currentFloorOut?.mapRows || 10}
            highlightedSlotId={checkoutSlotId}
            onSlotClick={handleSlotClickOut}
          />
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Camera Data & Checkout" bordered={false} bodyStyle={{ padding: 12 }} style={{ background: '#fafafa', height: '100%' }}>
            <div style={{ marginBottom: 8, textAlign: 'center', height: 200, width: '100%', border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
              {outImage ? (
                <img src={outImage} alt="Vehicle Out" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
              ) : (
                <Text type="secondary">Waiting for Camera...</Text>
              )}
            </div>
            <Form layout="vertical">
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item label="License Plate" style={{ marginBottom: 8 }}>
                    <Input value={outPlate} onChange={(e) => setOutPlate(e.target.value.toUpperCase())} onPressEnter={() => handleFindActiveSession()} placeholder="30A-123" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Card Code" style={{ marginBottom: 8 }}>
                    <Input value={outCardCode} onChange={(e) => setOutCardCode(e.target.value.toUpperCase())} onPressEnter={() => handleFindActiveSession()} placeholder="CARD-ABC" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          {checkoutPreview ? (
            <Card title="Invoice & Payment" bordered={false} bodyStyle={{ padding: 12 }} style={{ height: '100%' }}>
              <div>
                <Descriptions bordered column={1} size="small" style={{ marginBottom: 12, background: '#fff' }}>
                  <Descriptions.Item label="License Plate">
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{checkoutPreview.licensePlate}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Vehicle Type">
                    <span style={{ fontWeight: 600 }}>{checkoutPreview.vehicleTypeName || 'N/A'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Slot">
                    {checkoutPreview.slotName} ({checkoutPreview.floorName})
                  </Descriptions.Item>
                  <Descriptions.Item label="Duration">
                    {formatDuration(checkoutPreview.durationMinutes)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Fee">
                    <span style={{ fontSize: 18, color: '#fa8c16', fontWeight: 700 }}>
                      {checkoutPreview.totalFee.toLocaleString()} VND
                    </span>
                  </Descriptions.Item>
                </Descriptions>
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>Payment Method:</Text>
                  <Radio.Group value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Radio value="Cash" style={{ border: '1px solid #d9d9d9', padding: '10px', borderRadius: '4px', width: '100%' }}>
                      <strong>Cash Payment (At Center)</strong>
                    </Radio>
                    <Radio value="PayPal" style={{ border: '1px solid #d9d9d9', padding: '10px', borderRadius: '4px', width: '100%', display: 'flex', alignItems: 'center' }}>
                      <strong>Online Payment (PayPal)</strong>
                      <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" style={{ height: 20, marginLeft: 10, verticalAlign: 'middle' }} />
                    </Radio>
                  </Radio.Group>
                </div>

                {paymentMethod === 'Cash' ? (
                  <Button type="primary" onClick={handleConfirmCheckOut} block style={{ background: '#52c41a', border: 'none', height: 40, fontSize: 16 }}>
                    Confirm Payment (Cash)
                  </Button>
                ) : (
                  <div style={{ marginTop: 15 }}>
                    <PayPalButtons 
                      style={{ layout: "vertical" }}
                      createOrder={(data, actions) => {
                        const totalUSD = (checkoutPreview.totalFee / 25000).toFixed(2);
                        return actions.order.create({
                          purchase_units: [
                            {
                              amount: {
                                value: totalUSD,
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={(data, actions) => {
                        return actions.order.capture().then((details) => {
                          message.success(`Payment successfully completed by ${details.payer.name.given_name}!`);
                          handleConfirmCheckOut();
                        });
                      }}
                      onError={(err) => {
                        message.error('An error occurred during PayPal checkout.');
                        console.error(err);
                      }}
                    />
                  </div>
                )}
              </div>
            </Card>
          ) : (
             <Card title="Invoice & Payment" bordered={false} bodyStyle={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }} style={{ height: '100%', background: '#fafafa' }}>
               <Text type="secondary">Find a session to checkout</Text>
             </Card>
          )}
        </Col>
      </Row>
    </div>
  );

  const renderExceptions = () => (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}><AlertOutlined /> Exception Log</Title>
        <Button
          type="primary"
          danger
          icon={<PlusOutlined />}
          onClick={() => setIsExModalOpen(true)}
        >
          Record New Exception
        </Button>
      </div>
      <Table
        dataSource={exceptions}
        columns={exceptionColumns}
        rowKey="exceptionId"
      />
    </div>
  );

  return (
    <div>
      {path.includes('/staff/checkin') && renderCheckIn()}
      {path.includes('/staff/checkout') && renderCheckOut()}
      {path.includes('/staff/exceptions') && renderExceptions()}
      {(path === '/staff' || path === '/staff/') && renderMap()}

      {/* Exception Modal */}
      <Modal
        title="Record Incident"
        open={isExModalOpen}
        onCancel={() => setIsExModalOpen(false)}
        footer={null}
      >
        <Form form={exForm} layout="vertical" onFinish={handleCreateException}>
          <Form.Item
            name="exceptionType"
            label="Exception Type"
            rules={[{ required: true, message: 'Please select exception type!' }]}
          >
            <Select placeholder="Select exception">
              <Option value="lost_card">Lost Card</Option>
              <Option value="damaged_card">Damaged Card</Option>
              <Option value="wrong_floor">Wrong Floor/Position</Option>
              <Option value="overtime">Overtime</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="sessionId" label="Session ID (if any)">
            <InputNumber placeholder="Example: 15" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Detailed Description"
            rules={[{ required: true, message: 'Enter exception description!' }]}
          >
            <Input.TextArea placeholder="Specific description of status, vehicle details..." />
          </Form.Item>
          <Form.Item name="fineApplied" label="Fine Amount (VND) if any">
            <InputNumber placeholder="Example: 100000" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" danger block>
              Save & Report
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffDashboard;
