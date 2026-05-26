import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  CarOutlined,
  CalendarOutlined,
  DollarOutlined,
  SettingOutlined,
  FileTextOutlined,
  TeamOutlined,
  GatewayOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import useSSE from '../hooks/useSSE';

const { Header, Content } = Layout;
const { Text } = Typography;

const AppLayout = ({ children, role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    navigate('/login');
  };

  // Global SSE listener for STAFF to auto-navigate on camera triggers
  useSSE(
    role === 'STAFF' ? ['CAMERA_ENTRY', 'CAMERA_EXIT'] : [],
    role === 'STAFF' ? [
      (dataString) => {
        try {
          const data = typeof dataString === 'string' ? JSON.parse(dataString) : dataString;
          navigate('/staff/checkin', { state: { cameraEntryData: data } });
        } catch (e) { console.error(e); }
      },
      (dataString) => {
        try {
          const data = typeof dataString === 'string' ? JSON.parse(dataString) : dataString;
          navigate('/staff/checkout', { state: { cameraExitData: data } });
        } catch (e) { console.error(e); }
      }
    ] : []
  );

  // Determine the menu items list based on Role
  const getMenuItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { key: '/admin', icon: <DashboardOutlined />, label: 'System Overview' },
          { key: '/admin/accounts', icon: <TeamOutlined />, label: 'User Management' },
          { key: '/admin/settings', icon: <SettingOutlined />, label: 'System Configuration' }
        ];
      case 'MANAGER':
        return [
          { key: '/manager', icon: <DashboardOutlined />, label: 'Overview' },
          { key: '/manager/building', icon: <SettingOutlined />, label: 'Building Config' },
          { key: '/manager/monthly-tickets', icon: <CreditCardOutlined />, label: 'Monthly Tickets' },
          { key: '/manager/gates', icon: <GatewayOutlined />, label: 'Gate Config' },
          { key: '/manager/floor-allocation', icon: <CarOutlined />, label: 'Quy hoạch Phân tầng' },
          { key: '/manager/floors', icon: <CarOutlined />, label: 'Slot Map' },
          { key: '/manager/pricing', icon: <DollarOutlined />, label: 'Pricing' },
          { key: '/manager/penalties', icon: <SettingOutlined />, label: 'Penalty Rules' },
          { key: '/manager/reports', icon: <FileTextOutlined />, label: 'Reports & Analytics' },
          { key: '/manager/incidents', icon: <DashboardOutlined />, label: 'Exception Management' }
        ];
      case 'STAFF':
        return [
          { key: '/staff', icon: <DashboardOutlined />, label: 'Overview' },
          { key: '/staff/checkin', icon: <CarOutlined />, label: 'Check-in (In)' },
          { key: '/staff/checkout', icon: <LogoutOutlined />, label: 'Check-out (Out)' },
          { key: '/staff/exceptions', icon: <FileTextOutlined />, label: 'Handle Exceptions' }
        ];
      case 'USER':
      default:
        return [
          { key: '/user', icon: <DashboardOutlined />, label: 'Home' },
          { key: '/user/booking', icon: <CalendarOutlined />, label: 'Pre-book' },
          { key: '/user/sessions', icon: <CarOutlined />, label: 'Parking History' }
        ];
    }
  };

  const menuItems = getMenuItems();

  const userDropdownItems = [
    {
      key: 'username',
      label: <Text strong>{username}</Text>,
      disabled: true
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <CarOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 8 }} />
          <Text strong style={{ fontSize: 18, color: '#002140' }}>SmartParking</Text>
        </div>
        
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{ flex: 1, minWidth: 0, borderBottom: 'none', justifyContent: 'center' }}
        />

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" arrow>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
              <Text strong>{username}</Text>
            </Space>
          </Dropdown>
        </div>
      </Header>
      
      <Content style={{
        margin: '24px auto',
        padding: '24px',
        background: '#fff',
        minHeight: 280,
        width: '100%',
        maxWidth: 1400,
        borderRadius: 8,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
      }}>
        {children}
      </Content>
    </Layout>
  );
};

export default AppLayout;
