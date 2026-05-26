import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { 
    DollarCircleOutlined, 
    CarOutlined, 
    LogoutOutlined, 
    DashboardOutlined 
} from '@ant-design/icons';

const KPISection = ({ data, loading }) => {
    return (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
                <Card loading={loading}>
                    <Statistic
                        title="Today's Revenue"
                        value={data?.totalRevenue || 0}
                        precision={2}
                        valueStyle={{ color: '#3f8600' }}
                        prefix={<DollarCircleOutlined />}
                        suffix="$"
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card loading={loading}>
                    <Statistic
                        title="Today's Entries"
                        value={data?.totalEntries || 0}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<CarOutlined />}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card loading={loading}>
                    <Statistic
                        title="Today's Exits"
                        value={data?.totalExits || 0}
                        valueStyle={{ color: '#faad14' }}
                        prefix={<LogoutOutlined />}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card loading={loading}>
                    <Statistic
                        title="Current Occupancy"
                        value={data?.occupancyRate || 0}
                        precision={1}
                        valueStyle={{ color: data?.occupancyRate > 90 ? '#cf1322' : '#3f8600' }}
                        prefix={<DashboardOutlined />}
                        suffix="%"
                    />
                </Card>
            </Col>
        </Row>
    );
};

export default KPISection;
