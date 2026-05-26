import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, message } from 'antd';
import PricingPolicyTab from '../../components/PricingPolicyTab';
import axiosInstance from '../../api/axiosInstance';

const { Content } = Layout;
const { Title, Text } = Typography;

const PricingManagement = () => {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/manager/vehicle-types');
        setVehicleTypes(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        message.error('Failed to load vehicle types');
      } finally {
        setLoading(false);
      }
    };
    fetchVehicleTypes();
  }, []);

  return (
    <Content style={{ padding: '24px' }}>
      <Title level={2}>Pricing Management</Title>
      <Text type="secondary">Manage pricing policies for your parking building</Text>
      
      <Card style={{ marginTop: 24 }} loading={loading}>
        <PricingPolicyTab buildingId={1} vehicleTypes={vehicleTypes} />
      </Card>
    </Content>
  );
};

export default PricingManagement;
