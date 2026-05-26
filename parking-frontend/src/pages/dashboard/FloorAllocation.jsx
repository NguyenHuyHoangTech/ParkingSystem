import React, { useState, useEffect } from 'react';
import { Card, Table, Checkbox, InputNumber, Button, message, Typography, Modal } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';

const { Title, Text } = Typography;

const FloorAllocation = () => {
  const [building, setBuilding] = useState(null);
  const [floors, setFloors] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [allocations, setAllocations] = useState({}); // { "floorId_typeId": { isActive, priorityIndex } }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch buildings (get the first one for now)
      const bRes = await axiosInstance.get('/v1/buildings');
      if (bRes.data && bRes.data.length > 0) {
        const b = bRes.data[0];
        setBuilding(b);
        
        // Ensure floors are sorted by floorOrder
        const sortedFloors = (b.floors || []).sort((f1, f2) => f1.floorOrder - f2.floorOrder);
        setFloors(sortedFloors);

        // 2. Fetch all vehicle types
        const typesRes = await axiosInstance.get('/public/vehicle-types');
        const activeTypes = typesRes.data.filter(t => t.status === 'Active');
        setVehicleTypes(activeTypes);

        // 3. Fetch allocations
        const allocRes = await axiosInstance.get(`/v1/buildings/${b.buildingId}/floor-allocations`);
        
        const initialAllocMap = {};
        // Pre-fill existing allocations
        allocRes.data.forEach(a => {
          const key = `${a.floor.floorId}_${a.vehicleType.typeId}`;
          initialAllocMap[key] = {
            isActive: a.isActive,
            priorityIndex: a.priorityIndex
          };
        });
        
        setAllocations(initialAllocMap);
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tải dữ liệu phân tầng.');
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (floorId, typeId, field, value) => {
    setAllocations(prev => {
      const key = `${floorId}_${typeId}`;
      const current = prev[key] || { isActive: false, priorityIndex: 1 };
      
      const updated = { ...current, [field]: value };
      
      // If checked and no priority, set default to 1
      if (field === 'isActive' && value && !current.priorityIndex) {
        updated.priorityIndex = 1;
      }

      return {
        ...prev,
        [key]: updated
      };
    });
  };

  const handleSave = async () => {
    if (!building) return;
    
    setLoading(true);
    try {
      const payload = [];
      Object.keys(allocations).forEach(key => {
        const [floorId, typeId] = key.split('_');
        const alloc = allocations[key];
        // We can send all touched rules, or just ones where it's either active, or explicitly became inactive.
        // For simplicity, we send everything in the map. The backend will upsert active ones, and soft-delete inactive ones.
        payload.push({
          floorId: parseInt(floorId),
          vehicleTypeId: parseInt(typeId),
          isActive: alloc.isActive,
          priorityIndex: alloc.priorityIndex || 1
        });
      });

      await axiosInstance.put(`/v1/buildings/${building.buildingId}/floor-allocations`, payload);
      message.success('Quy hoạch phân tầng đã được lưu thành công!');
      loadInitialData(); // reload
    } catch (error) {
      if (error.response && error.response.status === 409) {
        Modal.error({
          title: 'Lỗi Xung Đột Nghiệp Vụ',
          content: error.response.data.error,
          okText: 'Đã hiểu'
        });
      } else {
        message.error('Có lỗi xảy ra khi lưu phân tầng.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate Table Columns dynamically based on VehicleTypes
  const columns = [
    {
      title: 'Tầng / Khu vực',
      dataIndex: 'floorName',
      key: 'floorName',
      fixed: 'left',
      width: 150,
      render: (text) => <Text strong>{text}</Text>
    },
    ...vehicleTypes.map(vt => ({
      title: vt.typeName,
      key: `vt_${vt.typeId}`,
      align: 'center',
      render: (_, record) => {
        const key = `${record.floorId}_${vt.typeId}`;
        const alloc = allocations[key] || { isActive: false, priorityIndex: 1 };
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Checkbox 
              checked={alloc.isActive}
              onChange={(e) => handleCellChange(record.floorId, vt.typeId, 'isActive', e.target.checked)}
            >
              Cho phép
            </Checkbox>
            {alloc.isActive && (
              <InputNumber
                min={1}
                size="small"
                placeholder="Priority"
                value={alloc.priorityIndex}
                onChange={(v) => handleCellChange(record.floorId, vt.typeId, 'priorityIndex', v)}
                style={{ width: 80 }}
              />
            )}
            {alloc.isActive && <Text type="secondary" style={{ fontSize: 11 }}>Độ ưu tiên</Text>}
          </div>
        );
      }
    }))
  ];

  return (
    <Card 
      title={<Title level={3} style={{ margin: 0 }}>Quy hoạch Phân tầng theo Loại xe</Title>}
      extra={
        <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
          Cập nhật đồng loạt
        </Button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Sử dụng ma trận dưới đây để quy định Loại phương tiện nào được phép di chuyển và đỗ tại Tầng nào. 
          Thiết lập <b>Độ ưu tiên (Priority Index)</b>: Số càng nhỏ (1) thì ưu tiên càng cao. Tầng có độ ưu tiên cao sẽ được hệ thống chỉ dẫn xe điền đầy trước.
        </Text>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={floors} 
        rowKey="floorId" 
        pagination={false}
        loading={loading}
        bordered
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default FloorAllocation;
