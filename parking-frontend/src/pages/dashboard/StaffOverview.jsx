import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Select, message } from 'antd';
import ParkingMap from '../../components/ParkingMap';
import axiosInstance from '../../api/axiosInstance';
import useSSE from '../../hooks/useSSE';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const StaffOverview = () => {
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [floorsRes, slotsRes, structuresRes] = await Promise.all([
        axiosInstance.get('/staff/floors'),
        axiosInstance.get('/staff/slots'),
        axiosInstance.get('/staff/structures')
      ]);
      setFloors(floorsRes.data);
      if (floorsRes.data.length > 0 && !selectedFloor) {
        setSelectedFloor(floorsRes.data[0].floorId);
      }
      setSlots(slotsRes.data);
      setStructures(structuresRes.data);
    } catch (error) {
      console.error(error);
      message.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useSSE(['SLOTS_UPDATED'], [
    () => { loadData(); }
  ]);

  const currentFloor = floors.find(f => f.floorId === selectedFloor) || {};
  const mapCols = currentFloor.mapCols || 15;
  const mapRows = currentFloor.mapRows || 10;
  
  const filteredSlots = slots.filter(s => s.floor && s.floor.floorId === selectedFloor);
  const filteredStructures = structures.filter(s => s.floor && s.floor.floorId === selectedFloor);

  return (
    <Content style={{ padding: '24px' }}>
      <Title level={2}>Parking Map Overview</Title>
      <Text type="secondary">Real-time view of the parking lot</Text>

      <Card style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Select style={{ width: 200 }} value={selectedFloor} onChange={(val) => setSelectedFloor(val)} placeholder="Select Floor">
            {floors.map(f => <Option key={f.floorId} value={f.floorId}>{f.floorName}</Option>)}
          </Select>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px', width: '100%', border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
          <ParkingMap 
            slots={filteredSlots} 
            structures={filteredStructures} 
            cols={mapCols} 
            rows={mapRows} 
            editable={false} 
          />
        </div>
      </Card>
    </Content>
  );
};

export default StaffOverview;
