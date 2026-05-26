import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Statistic, Table } from 'antd';
import { TeamOutlined, SettingOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;

const AdminOverview = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:8080/api/admin/logs', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setLogs(res.data);
      } catch (error) {
        console.error('Failed to load logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const columns = [
    { title: 'Audit ID', dataIndex: 'auditId', key: 'id' },
    { title: 'Config Key', dataIndex: 'configKey', key: 'configKey' },
    { title: 'Old Value', dataIndex: 'oldValue', key: 'oldValue' },
    { title: 'New Value', dataIndex: 'newValue', key: 'newValue' },
    { title: 'Changed By', dataIndex: ['changedByAccount', 'username'], key: 'changedBy' },
    { title: 'Changed At', dataIndex: 'changedAt', key: 'changedAt', render: val => new Date(val).toLocaleString() }
  ];

  return (
    <Content style={{ padding: '24px' }}>
      <Title level={2}>System Overview</Title>
      <Text type="secondary">Global system status and statistics</Text>
      
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Total Users" value={120} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Active Services" value={5} prefix={<SettingOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="System Status" value="Healthy" valueStyle={{ color: '#3f8600' }} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="Configuration Audit Logs" style={{ marginTop: 24 }}>
        <Table 
          columns={columns} 
          dataSource={logs} 
          rowKey="auditId" 
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </Content>
  );
};

export default AdminOverview;
