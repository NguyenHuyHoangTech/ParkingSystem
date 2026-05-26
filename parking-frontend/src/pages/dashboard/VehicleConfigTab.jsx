import React, { useState, useEffect } from 'react';
import { Card, Table, Checkbox, InputNumber, Select, Button, message, Typography, Row, Col, Modal } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';

const { Title, Text } = Typography;
const { Option } = Select;

const VehicleConfigTab = ({ building }) => {
  const [masterTypes, setMasterTypes] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (building && building.buildingId) {
      loadData(building.buildingId);
    }
  }, [building]);

  const loadData = async (buildingId) => {
    setLoading(true);
    try {
      // Fetch Master Types (public or manager endpoint)
      const typesRes = await axiosInstance.get('/public/vehicle-types');
      const activeTypes = typesRes.data.filter(t => t.status === 'Active');
      setMasterTypes(activeTypes);

      // Fetch Current Building Configs
      const configsRes = await axiosInstance.get(`/v1/buildings/${buildingId}/vehicle-configs`);
      
      // We need to fetch the building's zones to populate the multi-select
      // Fortunately we can get floors from the building object or fetch them again
      const bRes = await axiosInstance.get('/v1/buildings');
      const currentBuilding = bRes.data.find(b => b.buildingId === buildingId);
      
      let allFloors = [];
      if (currentBuilding && currentBuilding.floors) {
        currentBuilding.floors.forEach(f => {
          allFloors.push({
            floorId: f.floorId,
            floorName: f.floorName,
            label: f.floorName
          });
        });
      }
      setFloors(allFloors);

      // Map backend configs to local state
      const initialConfigs = activeTypes.map(mt => {
        const existing = configsRes.data.find(c => c.vehicleType.typeId === mt.typeId);
        
        // Find mapped zones from the allZones based on the current mappings
        // Since ZoneVehicleMapping is not fully exposed in standard building response, we might need to rely on the backend sending the mappedZoneIds or we can fetch them.
        // Wait, the API GET /api/v1/buildings/{buildingId}/vehicle-configs returns BuildingVehicleConfig, but doesn't return mappedZoneIds!
        // The backend `BuildingVehicleConfig` entity doesn't have `mappedZoneIds`.
        // To make it simple, let's look at the `Zone` data. The `Zone` entity in the backend now has `vehicleMappings`.
        
        let mappedFloorIds = [];
        if (currentBuilding && currentBuilding.floors) {
          currentBuilding.floors.forEach(f => {
            if (f.vehicleMappings && f.vehicleMappings.some(m => m.vehicleType.typeId === mt.typeId)) {
              mappedFloorIds.push(f.floorId);
            }
          });
        }

        return {
          vehicleTypeId: mt.typeId,
          typeName: mt.typeName,
          isSupported: existing ? existing.isSupported : false,
          maxHeight: existing ? existing.maxHeight : null,
          maxWeight: existing ? existing.maxWeight : null,
          mappedFloorIds: mappedFloorIds
        };
      });
      setConfigs(initialConfigs);

    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tải dữ liệu cấu hình phương tiện.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (typeId, field, value) => {
    setConfigs(prev => prev.map(c => 
      c.vehicleTypeId === typeId ? { ...c, [field]: value } : c
    ));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = configs.map(c => ({
        vehicleTypeId: c.vehicleTypeId,
        isSupported: c.isSupported,
        maxHeight: c.maxHeight,
        maxWeight: c.maxWeight,
        mappedFloorIds: c.mappedFloorIds
      }));

      await axiosInstance.put(`/v1/buildings/${building.buildingId}/vehicle-configs`, payload);
      message.success('Cấu hình phương tiện đã được lưu thành công!');
      loadData(building.buildingId);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        Modal.error({
          title: 'Không thể lưu cấu hình',
          content: error.response.data.error,
          okText: 'Đã hiểu'
        });
      } else {
        message.error('Có lỗi xảy ra khi lưu cấu hình.');
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Hỗ trợ',
      dataIndex: 'isSupported',
      key: 'isSupported',
      width: 100,
      render: (val, record) => (
        <Checkbox 
          checked={val} 
          onChange={(e) => handleConfigChange(record.vehicleTypeId, 'isSupported', e.target.checked)} 
        />
      )
    },
    {
      title: 'Loại Phương Tiện',
      dataIndex: 'typeName',
      key: 'typeName',
      width: 200,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Giới hạn Chiều cao (m)',
      dataIndex: 'maxHeight',
      key: 'maxHeight',
      width: 200,
      render: (val, record) => (
        <InputNumber 
          disabled={!record.isSupported}
          min={0.1} 
          step={0.1}
          value={val}
          onChange={(v) => handleConfigChange(record.vehicleTypeId, 'maxHeight', v)}
          placeholder="VD: 2.2"
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Giới hạn Tải trọng (Tấn)',
      dataIndex: 'maxWeight',
      key: 'maxWeight',
      width: 200,
      render: (val, record) => (
        <InputNumber 
          disabled={!record.isSupported}
          min={0.1} 
          step={0.1}
          value={val}
          onChange={(v) => handleConfigChange(record.vehicleTypeId, 'maxWeight', v)}
          placeholder="VD: 3.5"
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Ánh xạ Tầng (Floor Mapping)',
      dataIndex: 'mappedFloorIds',
      key: 'mappedFloorIds',
      render: (val, record) => (
        <Select
          mode="multiple"
          disabled={!record.isSupported}
          style={{ width: '100%' }}
          placeholder="Chọn các tầng cho phép đỗ"
          value={val}
          onChange={(v) => handleConfigChange(record.vehicleTypeId, 'mappedFloorIds', v)}
          optionFilterProp="children"
        >
          {floors.map(f => (
            <Option key={f.floorId} value={f.floorId}>{f.label}</Option>
          ))}
        </Select>
      )
    }
  ];

  return (
    <Card 
      title={<Title level={4} style={{ margin: 0 }}>Cấu hình Phương tiện & Giới hạn Vật lý</Title>}
      extra={
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
          Lưu Thay đổi
        </Button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Hãy kích hoạt các loại phương tiện mà tòa nhà này hỗ trợ và phân bổ chúng vào các Tầng (Floor) tương ứng.
          Để trống Chiều cao/Tải trọng nếu không có giới hạn (VD: Bãi đỗ ngoài trời).
        </Text>
      </div>
      <Table 
        columns={columns} 
        dataSource={configs} 
        rowKey="vehicleTypeId" 
        pagination={false}
        loading={loading}
      />
    </Card>
  );
};

export default VehicleConfigTab;
