import React, { useEffect, useState } from 'react';
import { Layout, Typography, Card, Row, Col, Statistic, Table, Button, Divider } from 'antd';
import { CarOutlined, PhoneOutlined, ClockCircleOutlined, DollarOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import ParkingMap from '../components/ParkingMap';
import useSSE from '../hooks/useSSE';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState({});
  const [prices, setPrices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [structures, setStructures] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch data individually to prevent one failure from crashing the whole page
      try {
        const configRes = await axiosInstance.get('/public/system-config');
        const configMap = {};
        configRes.data.forEach(c => { configMap[c.configKey] = c.configValue; });
        setConfigs(configMap);
      } catch (e) { console.warn('Public config API unavailable'); }

      try {
        const priceRes = await axiosInstance.get('/public/price-configs');
        setPrices(priceRes.data);
      } catch (e) { console.warn('Public prices API unavailable'); }

      try {
        const [slotRes, structRes, floorRes] = await Promise.all([
          axiosInstance.get('/public/slots'),
          axiosInstance.get('/public/structures'),
          axiosInstance.get('/public/floors')
        ]);
        setSlots(slotRes.data);
        setStructures(structRes.data);
        setFloors(floorRes.data);
      } catch (e) { console.error('Error loading public map data:', e); }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useSSE(['SLOTS_UPDATED', 'PRICES_UPDATED', 'CONFIG_UPDATED'], [
    () => { loadData(); },
    () => { loadData(); },
    () => { loadData(); }
  ]);

  const priceColumns = [
    { title: 'Vehicle Type', dataIndex: ['vehicleType', 'typeName'], key: 'vehicleType' },
    { title: 'Block Type', dataIndex: 'blockType', key: 'blockType', render: (val) => val === 'First_Block' ? 'First Hour' : 'Next Hour' },
    { title: 'Hours', dataIndex: 'durationHours', key: 'duration' },
    { title: 'Price', dataIndex: 'priceAmount', key: 'price', render: (val) => `${val?.toLocaleString()} VND` },
  ];

  const availableSlots = slots.filter(s => s.status === 'Available').length;
  const totalSlots = slots.length;

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CarOutlined style={{ fontSize: 28, color: '#1890ff', marginRight: 12 }} />
          <Title level={4} style={{ margin: 0, color: '#002140' }}>SmartParking</Title>
        </div>
        <div>
          <Button type="primary" icon={<LoginOutlined />} size="large" onClick={() => navigate('/login')} style={{ borderRadius: 8 }}>
            Login
          </Button>
        </div>
      </Header>

      <Content style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        
        {/* Banner Section */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={1} style={{ fontSize: 48, fontWeight: 900, marginBottom: 16 }}>
            Smart Parking Lot
          </Title>
          <Paragraph style={{ fontSize: 18, color: '#595959', maxWidth: 600, margin: '0 auto' }}>
            Automated, safe, and convenient parking management system. View real-time availability and pricing.
          </Paragraph>
        </div>

        <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Statistic
                title={<span style={{ fontSize: 16, fontWeight: 600 }}>Available Slots</span>}
                value={availableSlots}
                suffix={`/ ${totalSlots}`}
                valueStyle={{ color: availableSlots > 0 ? '#52c41a' : '#f5222d', fontSize: 36, fontWeight: 800 }}
                prefix={<CarOutlined />}
              />
              <Paragraph style={{ marginTop: 12, color: '#8c8c8c' }}>Real-time parking lot status</Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Statistic
                title={<span style={{ fontSize: 16, fontWeight: 600 }}>Operating Hours</span>}
                value={configs['operating_hours'] || '06:00 - 22:00'}
                valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 700 }}
                prefix={<ClockCircleOutlined />}
              />
              <Paragraph style={{ marginTop: 12, color: '#8c8c8c' }}>Serving every day of the week</Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Statistic
                title={<span style={{ fontSize: 16, fontWeight: 600 }}>Support Hotline</span>}
                value={configs['hotline'] || '1900 1234'}
                valueStyle={{ color: '#fa8c16', fontSize: 24, fontWeight: 700 }}
                prefix={<PhoneOutlined />}
              />
              <Paragraph style={{ marginTop: 12, color: '#8c8c8c' }}>24/7 on-duty for fast issue resolution</Paragraph>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[40, 40]} style={{ marginTop: 40 }}>
          <Col xs={24} lg={15}>
            <div style={{ marginBottom: 24 }}>
              <Title level={3}><CarOutlined /> Live Parking Map</Title>
              <Paragraph>Below is the map of parking slots. Green indicates available slots, and blue indicates occupied slots.</Paragraph>
            </div>
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <ParkingMap 
                slots={slots} 
                structures={structures}
                cols={floors.length > 0 ? (floors[0].mapCols || 15) : 15}
                rows={floors.length > 0 ? (floors[0].mapRows || 10) : 10}
                editable={false} 
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={9}>
            <div style={{ marginBottom: 24 }}>
              <Title level={3}><DollarOutlined /> Pricing & Services</Title>
              <Paragraph>The reference price list applied for each vehicle type in our parking lot.</Paragraph>
            </div>
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: 0 }}>
              <Table
                dataSource={prices}
                columns={priceColumns}
                rowKey="priceId"
                loading={loading}
                pagination={false}
                size="middle"
              />
            </Card>
          </Col>
        </Row>

      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255, 255, 255, 0.65)' }}>
        SmartParking ©{new Date().getFullYear()} - Providing top smart parking solutions.
      </Footer>
    </Layout>
  );
};

export default LandingPage;
