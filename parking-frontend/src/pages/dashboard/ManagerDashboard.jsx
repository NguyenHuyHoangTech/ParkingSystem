import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Button, Form, Select, Input, InputNumber,
  Table, Space, Tag, Tabs, DatePicker, Typography, Modal, message, Switch
} from 'antd';
import {
  AreaChartOutlined, CarOutlined, DollarOutlined, PlusOutlined,
  DeleteOutlined, LockOutlined, UnlockOutlined, AlertOutlined,
  WarningOutlined, EditOutlined, SettingOutlined
} from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';
import dayjs from 'dayjs';
import ParkingMap from '../../components/ParkingMap';
import SlotStatusModal from '../../components/SlotStatusModal';
import useSSE from '../../hooks/useSSE';

const { Title, Text } = Typography;
const { Option } = Select;

const ManagerDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('/manager/floors')) setActiveTab('1');
  }, [location.pathname]);

  // States quản lý Slot & Layout
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [structures, setStructures] = useState([]);
  const [zones, setZones] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm] = Form.useForm();
  
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [structureForm] = Form.useForm();
  
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm] = Form.useForm();
  
  const [isEditFloorModalOpen, setIsEditFloorModalOpen] = useState(false);
  const [floorForm] = Form.useForm();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);

  const [isVehicleTypeModalOpen, setIsVehicleTypeModalOpen] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState(null);
  const [vehicleTypeForm] = Form.useForm();

  // Tải dữ liệu ban đầu
  const loadData = async () => {
    setLoading(true);
    try {
      const [floorsRes, typesRes, slotsRes, structuresRes, zonesRes] = await Promise.all([
        axiosInstance.get('/manager/floors'),
        axiosInstance.get('/manager/vehicle-types'),
        axiosInstance.get('/manager/slots'),
        axiosInstance.get('/manager/structures'),
        axiosInstance.get('/manager/zones'),
      ]);

      setFloors(floorsRes.data);
      if (floorsRes.data.length > 0 && !selectedFloor) {
        setSelectedFloor(floorsRes.data[0].floorId);
      }
      setVehicleTypes(typesRes.data);
      setSlots(slotsRes.data);
      setStructures(structuresRes.data);
      setZones(zonesRes.data || []);
    } catch (error) {
      console.error(error);
      message.error('Error loading data. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Listen to SSE events to real-time update
  useSSE(['SLOTS_UPDATED'], [
    () => { console.log('Slots updated from server'); loadData(); }
  ]);



  // ===== SLOT LOGIC =====
  const handleAddSlot = async (values) => {
    try {
      if (editingSlot) {
        await axiosInstance.put(`/manager/slots/${editingSlot.slotId}/properties`, null, {
          params: { slotName: values.slotName, typeId: values.typeId, allowPreBooking: values.allowPreBooking }
        });
        message.success('Parking slot updated successfully!');
      } else {
        await axiosInstance.post('/manager/slots', null, {
          params: { floorId: values.floorId, slotName: values.slotName, posX: values.posX, posY: values.posY, typeId: values.typeId, allowPreBooking: values.allowPreBooking }
        });
        message.success('Parking slot added successfully!');
      }
      setIsSlotModalOpen(false);
      setEditingSlot(null);
      slotForm.resetFields();
      loadData();
    } catch (error) { message.error('Error saving parking slot.'); }
  };

  const handleUpdateSlotStatus = async (slotId, newStatus) => {
    try {
      await axiosInstance.put(`/manager/slots/${slotId}/status`, null, { params: { status: newStatus } });
      message.success('Slot status updated successfully!');
      loadData();
    } catch (error) { message.error(error.response?.data?.message || 'Update error.'); }
  };

  const handleManagerSlotStatusUpdate = async (slotId, payload) => {
    try {
      await axiosInstance.patch(`/manager/slots/${slotId}/status`, payload);
      message.success('Slot status updated successfully!');
      setIsStatusModalOpen(false);
      loadData();
    } catch (error) { 
      message.error(error.response?.data?.error || error.response?.data?.message || 'Error updating slot status.'); 
    }
  };

  const onMapSlotClick = (slot) => {
    setActiveSlot(slot);
    setIsStatusModalOpen(true);
  };

  const openEditSlot = (slot) => {
    setEditingSlot(slot);
    slotForm.setFieldsValue({
      floorId: slot.floor?.floorId,
      typeId: slot.vehicleType?.typeId,
      allowPreBooking: slot.allowPreBooking || false,
      slotName: slot.slotName,
      posX: slot.posX,
      posY: slot.posY
    });
    setIsSlotModalOpen(true);
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await axiosInstance.delete(`/manager/slots/${slotId}`);
      message.success('Slot deleted.');
      loadData();
    } catch (error) { message.error(error.response?.data?.message || 'Delete error.'); }
  };

  const handleSlotMove = async (slotId, targetX, targetY) => {
    try {
      await axiosInstance.put(`/manager/slots/${slotId}/position`, null, {
        params: { posX: targetX, posY: targetY }
      });
      message.success('New slot position saved');
      loadData();
    } catch (error) {
      message.error('Error saving position');
    }
  };

  const handleStructureMove = async (structureId, targetX, targetY) => {
    try {
      await axiosInstance.put(`/manager/structures/${structureId}/position`, null, {
        params: { posX: targetX, posY: targetY }
      });
      message.success('Structure position saved');
      loadData();
    } catch (error) {
      message.error('Error saving structure position');
    }
  };

  const onStructureClick = (st) => {
    setEditingStructure(st);
    structureForm.setFieldsValue({
      name: st.name,
      type: st.type,
      posX: st.posX,
      posY: st.posY,
      width: st.width,
      height: st.height
    });
    setIsStructureModalOpen(true);
  };

  // ===== ZONE LOGIC =====
  const handleSaveZone = async (values) => {
    try {
      const allowedVehicleTypes = (values.allowedVehicleTypeIds || []).map(id => ({ typeId: id }));
      const payload = {
        name: values.name,
        posX: values.posX,
        posY: values.posY,
        width: values.width,
        height: values.height,
        allowedVehicleTypes: allowedVehicleTypes,
        floor: { floorId: values.floorId }
      };

      if (editingZone) {
        await axiosInstance.put(`/manager/zones/${editingZone.zoneId}`, payload);
        message.success('Zone updated successfully!');
      } else {
        await axiosInstance.post('/manager/zones', payload);
        message.success('Zone added successfully!');
      }
      setIsZoneModalOpen(false);
      setEditingZone(null);
      zoneForm.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error saving zone.');
    }
  };

  const handleZoneMove = async (zoneId, targetX, targetY) => {
    try {
      await axiosInstance.put(`/manager/zones/${zoneId}/position`, null, {
        params: { posX: targetX, posY: targetY }
      });
      message.success('Zone position updated successfully.');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error moving zone.');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      await axiosInstance.delete(`/manager/zones/${zoneId}`);
      message.success('Zone deleted successfully.');
      loadData();
    } catch (error) {
      message.error('Error deleting zone.');
    }
  };

  const onZoneClick = (zone) => {
    setEditingZone(zone);
    zoneForm.setFieldsValue({
      floorId: zone.floor?.floorId,
      name: zone.name,
      posX: zone.posX,
      posY: zone.posY,
      width: zone.width,
      height: zone.height,
      allowedVehicleTypeIds: (zone.allowedVehicleTypes || []).map(t => t.typeId)
    });
    setIsZoneModalOpen(true);
  };



  // ===== VEHICLE TYPE LOGIC =====
  const handleSaveVehicleType = async (values) => {
    try {
      if (editingVehicleType) {
        await axiosInstance.put(`/manager/vehicle-types/${editingVehicleType.typeId}`, values);
        message.success('Vehicle type updated successfully!');
      } else {
        await axiosInstance.post('/manager/vehicle-types', values);
        message.success('Vehicle type added successfully!');
      }
      setIsVehicleTypeModalOpen(false);
      setEditingVehicleType(null);
      vehicleTypeForm.resetFields();
      loadData();
    } catch (error) { message.error('Error saving vehicle type.'); }
  };

  const handleDeleteVehicleType = async (typeId) => {
    try {
      await axiosInstance.delete(`/manager/vehicle-types/${typeId}`);
      message.success('Vehicle type disabled.');
      loadData();
    } catch (error) { message.error('Error disabling vehicle type.'); }
  };

  const openEditVehicleType = (record) => {
    setEditingVehicleType(record);
    vehicleTypeForm.setFieldsValue(record);
    setIsVehicleTypeModalOpen(true);
  };

  // ===== PRICING LOGIC =====
  const handleAddPriceConfig = async (values) => {
    try {
      await axiosInstance.post('/manager/price-configs', {
        vehicleType: { typeId: values.typeId },
        blockType: values.blockType,
        durationHours: values.durationHours,
        priceAmount: values.priceAmount
      });
      message.success('Price configured successfully!');
      setIsPriceModalOpen(false);
      priceForm.resetFields();
      loadData();
    } catch (error) { message.error('Error configuring price.'); }
  };

  const handleDeletePrice = async (priceId) => {
    try {
      await axiosInstance.delete(`/manager/price-configs/${priceId}`);
      message.success('Configuration deleted.');
      loadData();
    } catch (error) { message.error('Error deleting configuration.'); }
  };

  // ===== PENALTY LOGIC =====
  const handleSavePenalty = async (values) => {
    try {
      if (editingPenalty) {
        await axiosInstance.put(`/manager/penalty-rules/${editingPenalty.ruleId}`, values);
        message.success('Penalty rule updated successfully!');
      } else {
        await axiosInstance.post('/manager/penalty-rules', values);
        message.success('Penalty rule added successfully!');
      }
      setIsPenaltyModalOpen(false);
      setEditingPenalty(null);
      penaltyForm.resetFields();
      loadData();
    } catch (error) { message.error('Error saving penalty rule.'); }
  };

  const handleDeletePenalty = async (ruleId) => {
    try {
      await axiosInstance.delete(`/manager/penalty-rules/${ruleId}`);
      message.success('Penalty rule deleted.');
      loadData();
    } catch (error) { message.error('Error deleting penalty rule.'); }
  };

  const openEditPenalty = (record) => {
    setEditingPenalty(record);
    penaltyForm.setFieldsValue(record);
    setIsPenaltyModalOpen(true);
  };

  const currentFloor = floors.find(f => f.floorId === selectedFloor);
  const mapCols = currentFloor?.mapCols || 15;
  const mapRows = currentFloor?.mapRows || 10;

  const filteredSlots = slots.filter(s => s.floor?.floorId === selectedFloor);
  const filteredStructures = structures.filter(st => st.floor?.floorId === selectedFloor);
  const filteredZones = zones.filter(z => z.floor?.floorId === selectedFloor);


  // ===== COLUMNS =====
  const slotColumns = [
    { title: 'Slot Name', dataIndex: 'slotName', key: 'slotName' },
    { title: 'Floor', dataIndex: ['floor', 'floorName'], key: 'floorName' },
    { title: 'Position X/Y', key: 'coordinates', render: (_, r) => `X:${r.posX}, Y:${r.posY}` },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status) => {
        const colors = { Available: 'green', Occupied: 'blue', Booked: 'gold', Maintenance: 'red', Locked: 'default' };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" type="default" icon={<SettingOutlined />}
            onClick={() => onMapSlotClick(record)}>
            Manage Status
          </Button>
          <Button size="small" icon={<EditOutlined />}
            onClick={() => openEditSlot(record)}>
            Edit
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDeleteSlot(record.slotId)}
            disabled={record.status === 'Occupied'} />
        </Space>
      )
    }
  ];

  const zoneColumns = [
    { title: 'Zone Name', dataIndex: 'name', key: 'name' },
    { title: 'Floor', dataIndex: ['floor', 'floorName'], key: 'floorName' },
    { title: 'Position', key: 'pos', render: (_, r) => `X: ${r.posX}, Y: ${r.posY}` },
    { title: 'Size', key: 'size', render: (_, r) => `${r.width}x${r.height} cells` },
    { 
      title: 'Allowed Vehicle Types', 
      dataIndex: 'allowedVehicleTypes', 
      key: 'allowedTypes',
      render: (types) => (
        <Space wrap>
          {(types || []).map(t => <Tag color="blue" key={t.typeId}>{t.typeName}</Tag>)}
          {(!types || types.length === 0) && <Tag color="gray">None</Tag>}
        </Space>
      )
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => onZoneClick(record)}>Edit</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteZone(record.zoneId)} />
        </Space>
      )
    }
  ];

  const vehicleTypeColumns = [
    { title: 'ID', dataIndex: 'typeId', key: 'id' },
    { title: 'Vehicle Type', dataIndex: 'typeName', key: 'typeName' },
    { title: 'Size Multiplier', dataIndex: 'sizeMultiplier', key: 'size' },
    { 
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={s === 'Active' ? 'green' : 'red'}>{s}</Tag>
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEditVehicleType(record)}>Edit</Button>
          <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDeleteVehicleType(record.typeId)} disabled={record.status !== 'Active'}>Lock</Button>
        </Space>
      )
    }
  ];


  const exceptionColumns = [
    { title: 'ID', dataIndex: 'exceptionId', key: 'id' },
    {
      title: 'Exception Type', dataIndex: 'exceptionType', key: 'type',
      render: (val) => <Tag color="volcano">{val}</Tag>
    },
    { title: 'License Plate', dataIndex: ['session', 'licensePlateIn'], key: 'plate', render: (v) => v || '—' },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    {
      title: 'Fine Applied', dataIndex: 'fineApplied', key: 'fine',
      render: (v) => v ? `${v.toLocaleString()} VND` : '—'
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => (
        <Tag color={s === 'Resolved' ? 'green' : s === 'Rejected' ? 'red' : 'gold'}>{s}</Tag>
      )
    },
    {
      title: 'Created At', dataIndex: 'createdAt', key: 'created',
      render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'
    }
  ];

  const reportColumns = [
    { title: 'Vehicle Type', dataIndex: 'vehicleTypeName', key: 'name' },
    { title: 'Total Sessions', dataIndex: 'totalSessions', key: 'total' },
    {
      title: 'Revenue (VND)', dataIndex: 'revenue', key: 'revenue',
      render: (val) => val ? val.toLocaleString() : 0
    }
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k)}
        style={{ background: '#fff', padding: 24, borderRadius: 8 }}>

        {/* TAB 1: SLOT MANAGEMENT */}
        <Tabs.TabPane tab={<span><CarOutlined />Layout & Slot Management</span>} key="1">
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <Select style={{ width: 160 }} value={selectedFloor}
              onChange={(val) => { setSelectedFloor(val); }}
              placeholder="Select Floor">
              {floors.map(f => <Option key={f.floorId} value={f.floorId}>{f.floorName}</Option>)}
            </Select>
            <Button icon={<SettingOutlined />} onClick={() => {
              if (selectedFloor) {
                const f = floors.find(fl => fl.floorId === selectedFloor);
                floorForm.setFieldsValue(f);
                setIsEditFloorModalOpen(true);
              }
            }}>
              Edit Map Size
            </Button>

            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingSlot(null); slotForm.resetFields(); setIsSlotModalOpen(true); }}>
              Create New Slot
            </Button>
            <Button onClick={() => { setEditingStructure(null); structureForm.resetFields(); setIsStructureModalOpen(true); }}>
              Add Structure
            </Button>
            <Button type="primary" danger icon={<PlusOutlined />} onClick={() => { setEditingZone(null); zoneForm.resetFields(); zoneForm.setFieldsValue({ floorId: selectedFloor, posX: 0, posY: 0, width: 2, height: 2 }); setIsZoneModalOpen(true); }}>
              Add Zone (Partition)
            </Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px', width: '100%', border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
            <ParkingMap 
              slots={filteredSlots} 
              structures={filteredStructures} 
              zones={filteredZones}
              cols={mapCols} 
              rows={mapRows} 
              editable={true} 
              onSlotMove={handleSlotMove} 
              onSlotClick={onMapSlotClick} 
              onStructureMove={handleStructureMove}
              onStructureClick={onStructureClick}
              onZoneMove={handleZoneMove}
              onZoneClick={onZoneClick}
            />
          </div>
          <div style={{ marginTop: 24 }}>
            <Title level={5}>Detailed Slot List</Title>
            <Table dataSource={filteredSlots} columns={slotColumns} rowKey="slotId" loading={loading} />
          </div>
          <div style={{ marginTop: 24 }}>
            <Title level={5}>Detailed Zone List</Title>
            <Table dataSource={filteredZones} columns={zoneColumns} rowKey="zoneId" loading={loading} />
          </div>
        </Tabs.TabPane>




        {/* TAB 4: VEHICLE TYPE MANAGEMENT */}
        <Tabs.TabPane tab={<span><CarOutlined />Vehicle Types</span>} key="4">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0 }}>Vehicle Type Management</Title>
            <Button type="primary" icon={<PlusOutlined />}
              onClick={() => { setEditingVehicleType(null); vehicleTypeForm.resetFields(); setIsVehicleTypeModalOpen(true); }}>
              Add Vehicle Type
            </Button>
          </div>
          <Table dataSource={vehicleTypes} columns={vehicleTypeColumns} rowKey="typeId" loading={loading} />
        </Tabs.TabPane>
      </Tabs>

      {/* Add Slot Modal */}
      <Modal title={editingSlot ? "Edit parking slot" : "Add new parking slot"} open={isSlotModalOpen}
        onCancel={() => { setIsSlotModalOpen(false); setEditingSlot(null); slotForm.resetFields(); }} footer={null}>
        <Form form={slotForm} layout="vertical" onFinish={handleAddSlot}>
          <Form.Item name="floorId" label="Floor"
            rules={[{ required: true, message: 'Please select a Floor!' }]}>
            <Select placeholder="Select Floor" disabled={!!editingSlot}>
              {floors.map(f => (
                <Option key={f.floorId} value={f.floorId}>
                  {f.floorName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="typeId" label="Vehicle Type (Size)"
            rules={[{ required: true, message: 'Please select vehicle type!' }]}>
            <Select placeholder="Select Vehicle Type">
              {vehicleTypes.map(t => (
                <Option key={t.typeId} value={t.typeId}>
                  {t.typeName} ({t.gridWidth || 1}x{t.gridHeight || 1})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="allowPreBooking" label="Allow Pre-Booking" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
          <Form.Item name="slotName" label="Slot Name"
            rules={[{ required: true, message: 'Enter slot name!' }]}>
            <Input placeholder="Example: A-01" />
          </Form.Item>
          <Form.Item name="posX" label="Position X" rules={[{ required: true }]} initialValue={0}>
            <InputNumber style={{ width: '100%' }} disabled={!!editingSlot} />
          </Form.Item>
          <Form.Item name="posY" label="Position Y" rules={[{ required: true }]} initialValue={0}>
            <InputNumber style={{ width: '100%' }} disabled={!!editingSlot} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>{editingSlot ? 'Save Changes' : 'Create Now'}</Button>
          </Form.Item>
        </Form>
      </Modal>



      {/* Add/Edit Vehicle Type Modal */}
      <Modal
        title={editingVehicleType ? 'Edit Vehicle Type' : 'Add Vehicle Type'}
        open={isVehicleTypeModalOpen}
        onCancel={() => { setIsVehicleTypeModalOpen(false); setEditingVehicleType(null); vehicleTypeForm.resetFields(); }}
        footer={null}>
        <Form form={vehicleTypeForm} layout="vertical" onFinish={handleSaveVehicleType}>
          <Form.Item name="typeName" label="Vehicle Type Name" rules={[{ required: true, message: 'Enter vehicle type name!' }]}>
            <Input placeholder="Example: 4-seater car, Motorbike" />
          </Form.Item>
          <Form.Item name="sizeMultiplier" label="Size Multiplier" rules={[{ required: true }]} initialValue={1}>
            <InputNumber style={{ width: '100%' }} min={0.1} step={0.1} />
          </Form.Item>
          <Form.Item name="gridWidth" label="Grid Width (Cells)" rules={[{ required: true }]} initialValue={1}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="gridHeight" label="Grid Height (Cells)" rules={[{ required: true }]} initialValue={1}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="Active">
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingVehicleType ? 'Update' : 'Add New'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      {/* Add/Edit Structure Modal */}
      <Modal title={editingStructure ? "Edit Map Structure" : "Add Map Structure"} open={isStructureModalOpen}
        onCancel={() => { setIsStructureModalOpen(false); setEditingStructure(null); structureForm.resetFields(); }} footer={null}>
        <Form form={structureForm} layout="vertical" onFinish={async (values) => {
          try {
            if (editingStructure) {
               await axiosInstance.put(`/manager/structures/${editingStructure.structureId}`, {
                 name: values.name,
                 type: values.type,
                 width: values.width,
                 height: values.height
               });
               message.success('Structure updated successfully!');
            } else {
               await axiosInstance.post('/manager/structures', {
                 floor: { floorId: selectedFloor },
                 name: values.name,
                 type: values.type,
                 posX: values.posX,
                 posY: values.posY,
                 width: values.width,
                 height: values.height
               });
               message.success('Structure added successfully!');
            }
            setIsStructureModalOpen(false);
            setEditingStructure(null);
            structureForm.resetFields();
            loadData();
          } catch (error) { message.error('Error saving structure.'); }
        }}>
          <Form.Item name="name" label="Structure Name" rules={[{ required: true }]}>
            <Input placeholder="Example: Pillar, Wall" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]} initialValue="Wall">
            <Select>
              <Option value="Wall">Wall</Option>
              <Option value="Pillar">Pillar</Option>
              <Option value="Office">Office / Booth</Option>
            </Select>
          </Form.Item>
          <Form.Item name="posX" label="Position X" rules={[{ required: true }]} initialValue={0}>
            <InputNumber style={{ width: '100%' }} disabled={!!editingStructure} />
          </Form.Item>
          <Form.Item name="posY" label="Position Y" rules={[{ required: true }]} initialValue={0}>
            <InputNumber style={{ width: '100%' }} disabled={!!editingStructure} />
          </Form.Item>
          <Form.Item name="width" label="Width (Cells)" rules={[{ required: true }]} initialValue={1}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="height" label="Height (Cells)" rules={[{ required: true }]} initialValue={1}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button type="primary" htmlType="submit">{editingStructure ? 'Save Structure' : 'Add Structure'}</Button>
              {editingStructure && (
                  <Button danger onClick={async () => {
                     try {
                        await axiosInstance.delete(`/manager/structures/${editingStructure.structureId}`);
                        message.success('Structure deleted');
                        setIsStructureModalOpen(false);
                        loadData();
                     } catch(e) { message.error('Delete failed'); }
                  }}>Delete</Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Floor Modal */}
      <Modal title="Edit Map Size" open={isEditFloorModalOpen}
        onCancel={() => setIsEditFloorModalOpen(false)} footer={null}>
        <Form form={floorForm} layout="vertical" onFinish={async (values) => {
          try {
            await axiosInstance.put(`/manager/floors/${selectedFloor}`, values);
            message.success('Map size updated successfully!');
            setIsEditFloorModalOpen(false);
            loadData();
          } catch (error) { message.error('Error updating map size.'); }
        }}>
          <Form.Item name="floorName" label="Floor Name" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="mapCols" label="Map Columns (Width)" rules={[{ required: true }]} initialValue={15}>
            <InputNumber style={{ width: '100%' }} min={5} />
          </Form.Item>
          <Form.Item name="mapRows" label="Map Rows (Height)" rules={[{ required: true }]} initialValue={10}>
            <InputNumber style={{ width: '100%' }} min={5} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="Active" hidden>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>Save Configuration</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add/Edit Zone Modal */}
      <Modal title={editingZone ? "Edit Map Zone" : "Add Map Zone"} open={isZoneModalOpen}
        onCancel={() => { setIsZoneModalOpen(false); setEditingZone(null); zoneForm.resetFields(); }} footer={null}>
        <Form form={zoneForm} layout="vertical" onFinish={handleSaveZone}>
          <Form.Item name="floorId" label="Floor" rules={[{ required: true }]}>
            <Select placeholder="Select Floor" disabled={!!editingZone}>
              {floors.map(f => <Option key={f.floorId} value={f.floorId}>{f.floorName}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="Zone Name" rules={[{ required: true, message: 'Please enter zone name' }]}>
            <Input placeholder="Example: VIP Car Zone, Motorbike Zone" />
          </Form.Item>
          <Form.Item name="posX" label="Position X" rules={[{ required: true }]} initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="posY" label="Position Y" rules={[{ required: true }]} initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="width" label="Width (Cells)" rules={[{ required: true }]} initialValue={2}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="height" label="Height (Cells)" rules={[{ required: true }]} initialValue={2}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="allowedVehicleTypeIds" label="Allowed Vehicle Types" rules={[{ required: true, message: 'Select at least one vehicle type!' }]}>
            <Select mode="multiple" placeholder="Select allowed vehicle types" style={{ width: '100%' }}>
              {vehicleTypes.map(t => (
                <Option key={t.typeId} value={t.typeId}>{t.typeName}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>{editingZone ? 'Save Changes' : 'Create Zone'}</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Manager Slot Status Modal */}
      <SlotStatusModal 
        open={isStatusModalOpen} 
        slot={activeSlot} 
        onClose={() => setIsStatusModalOpen(false)} 
        onUpdateStatus={handleManagerSlotStatusUpdate} 
      />
    </div>
  );
};

export default ManagerDashboard;
