import React, { useState, useEffect } from 'react';
import { Form, Input, Button, TimePicker, Switch, Card, Row, Col, Typography, message, Table, Space, Modal, Select, InputNumber, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosInstance from '../../api/axiosInstance';
import VehicleConfigTab from './VehicleConfigTab';

const { Title, Text } = Typography;
const { Option } = Select;

const BuildingManagement = () => {
  const [form] = Form.useForm();
  const [building, setBuilding] = useState(null);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [is24Hours, setIs24Hours] = useState(false);

  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [floorForm] = Form.useForm();
  const [editingFloorIndex, setEditingFloorIndex] = useState(null);

  const [vehicleTypes, setVehicleTypes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [buildingsRes, vTypesRes] = await Promise.all([
        axiosInstance.get('/v1/buildings'),
        axiosInstance.get('/manager/vehicle-types')
      ]);
      setVehicleTypes(vTypesRes.data);

      if (buildingsRes.data && buildingsRes.data.length > 0) {
        const b = buildingsRes.data[0]; // Load first building
        setBuilding(b);
        setFloors(b.floors || []);

        const is24h = b.openTime === '00:00:00' && (b.closeTime === '23:59:59' || b.closeTime?.startsWith('23:59'));
        setIs24Hours(is24h);

        form.setFieldsValue({
          name: b.name,
          address: b.address,
          hotline: b.hotline,
          status: b.status,
          is24Hours: is24h,
          openTime: b.openTime && !is24h ? dayjs(b.openTime, 'HH:mm:ss') : null,
          closeTime: b.closeTime && !is24h ? dayjs(b.closeTime, 'HH:mm:ss') : null,
        });
      } else {
        // Init default if no building
        setFloors([]);
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tải dữ liệu Tòa nhà.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      const values = await form.validateFields();
      
      const payloadFloors = floors.map(f => ({
        ...f
      }));

      const payload = {
        name: values.name,
        address: values.address,
        hotline: values.hotline,
        status: values.status,
        is24Hours: values.is24Hours,
        openTime: values.is24Hours ? null : values.openTime?.format('HH:mm:ss'),
        closeTime: values.is24Hours ? null : values.closeTime?.format('HH:mm:ss'),
        floors: payloadFloors
      };

      if (building && building.buildingId) {
        await axiosInstance.put(`/v1/buildings/${building.buildingId}`, payload);
        message.success('Cấu hình Tòa nhà đã được lưu thành công!');
        loadData();
      } else {
        message.error('Chức năng thêm mới Tòa nhà chưa được hỗ trợ trên UI này.');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 409) {
          message.error(`Không thể lưu: ${error.response.data.error || 'Xung đột dữ liệu'}`);
        } else if (error.response.status === 400) {
          // Xử lý lỗi validation từ Spring Boot
          const data = error.response.data;
          let errorMessages = [];
          if (typeof data === 'object') {
            for (const key in data) {
              if (data.hasOwnProperty(key) && key !== 'timestamp' && key !== 'status' && key !== 'error' && key !== 'path') {
                errorMessages.push(`${key}: ${data[key]}`);
              }
            }
          }
          const finalMsg = errorMessages.length > 0 ? errorMessages.join(' | ') : (data.error || data.message || 'Dữ liệu không hợp lệ');
          message.error(`Lỗi từ máy chủ: ${finalMsg}`);
        } else {
          message.error(`Lỗi hệ thống: ${error.response.status} - ${error.response.data?.message || 'Lỗi không xác định'}`);
        }
      } else if (error.errorFields) {
        // Lỗi validation từ Form của Ant Design
        message.error(`Vui lòng điền đầy đủ các trường bắt buộc trong Thông tin Tòa nhà!`);
      } else {
        message.error('Lỗi khi lưu cấu hình Tòa nhà. Vui lòng kiểm tra lại kết nối.');
        console.error(error);
      }
    }
  };

  // ----- FLOOR MANAGEMENT -----
  const handleSaveFloor = async () => {
    try {
      const values = await floorForm.validateFields();
      const newFloors = [...floors];
      if (editingFloorIndex !== null) {
        newFloors[editingFloorIndex] = { ...newFloors[editingFloorIndex], ...values };
      } else {
        newFloors.push({ ...values, structures: [] });
      }
      setFloors(newFloors);
      setIsFloorModalOpen(false);
    } catch (e) {}
  };

  const handleDeleteFloor = (index) => {
    const newFloors = [...floors];
    newFloors.splice(index, 1);
    setFloors(newFloors);
  };

  const floorColumns = [
    { title: 'Tên Tầng', dataIndex: 'floorName', key: 'floorName' },
    { title: 'Thứ tự', dataIndex: 'floorOrder', key: 'floorOrder' },
    { title: 'Kích thước Lưới', render: (_, r) => `${r.mapCols} x ${r.mapRows}` },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    {
      title: 'Hành động', key: 'actions', render: (_, r, index) => (
        <Space>
          <Button size="small" onClick={() => {
            setEditingFloorIndex(index);
            floorForm.setFieldsValue(r);
            setIsFloorModalOpen(true);
          }}>Sửa</Button>
          <Button size="small" danger onClick={() => handleDeleteFloor(index)}>Xóa</Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Tabs defaultActiveKey="1" style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
        <Tabs.TabPane tab="Thông tin Tòa nhà" key="1" forceRender={true}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <Title level={3}>Cấu hình Thông tin & Không gian</Title>
            <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSaveAll} loading={loading}>
              Lưu Cấu hình
            </Button>
          </div>

          <Row gutter={24}>
            <Col span={8}>
              <Card title="Thông tin cơ bản">
                <Form form={form} layout="vertical">
                  <Form.Item name="name" label="Tên Bãi Đỗ Xe" rules={[{ required: true }]}>
                    <Input placeholder="Tên bãi đỗ xe" />
                  </Form.Item>
                  <Form.Item name="address" label="Địa chỉ" rules={[{ required: true }]}>
                    <Input placeholder="Địa chỉ chi tiết" />
                  </Form.Item>
                  <Form.Item name="hotline" label="Hotline">
                    <Input placeholder="1900 1234" />
                  </Form.Item>
                  <Form.Item label="Hoạt động 24/24">
                    <Switch checked={is24Hours} onChange={setIs24Hours} />
                  </Form.Item>
                  {!is24Hours && (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="openTime" label="Giờ mở cửa" rules={[{ required: !is24Hours }]}>
                          <TimePicker format="HH:mm" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="closeTime" label="Giờ đóng cửa" rules={[{ required: !is24Hours }]}>
                          <TimePicker format="HH:mm" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
                  <Form.Item name="status" label="Trạng thái" initialValue="Active">
                    <Select>
                      <Option value="Active">Đang hoạt động</Option>
                      <Option value="Maintenance">Bảo trì</Option>
                      <Option value="Closed">Đóng cửa</Option>
                    </Select>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={16}>
              <Card title="Cấu trúc Không gian (Tầng & Khu vực)" extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                  setEditingFloorIndex(null);
                  floorForm.resetFields();
                  setIsFloorModalOpen(true);
                }}>
                  Thêm Tầng
                </Button>
              }>
                <Table
                  dataSource={floors}
                  columns={floorColumns}
                  rowKey={(r, i) => i}
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Cấu hình Phương tiện" key="2">
          <VehicleConfigTab building={building} />
        </Tabs.TabPane>
      </Tabs>

      {/* MODALS */}
      <Modal title={editingFloorIndex !== null ? "Sửa Tầng" : "Thêm Tầng"} open={isFloorModalOpen} onCancel={() => setIsFloorModalOpen(false)} onOk={handleSaveFloor}>
        <Form form={floorForm} layout="vertical">
          <Form.Item name="floorName" label="Tên Tầng" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="floorOrder" label="Thứ tự hiển thị"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="mapCols" label="Cột Lưới" initialValue={15}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="mapRows" label="Hàng Lưới" initialValue={10}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="status" label="Trạng thái" initialValue="Active">
            <Select><Option value="Active">Active</Option><Option value="Inactive">Inactive</Option></Select>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default BuildingManagement;
