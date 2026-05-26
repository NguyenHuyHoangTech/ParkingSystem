import React, { useState } from 'react';
import { Layout, Typography, Card, Form, Input, Button, message, Descriptions, Tag, Divider, Spin } from 'antd';
import { SearchOutlined, ClockCircleOutlined, CarOutlined, BankOutlined, MoneyCollectOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;

const UserTracking = () => {
    const [loading, setLoading] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const handleSearch = async (values) => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/public/tracking', {
                params: { plate: values.licensePlate }
            });
            setSessionData(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Không tìm thấy lượt gửi xe nào đang hoạt động cho biển số này.');
            setSessionData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Content style={{ padding: '50px', minHeight: '100vh', background: '#f0f2f5' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Title level={2}>Tra Cứu Lượt Gửi Xe</Title>
                    <Text type="secondary">Nhập biển số xe của bạn để xem thời gian gửi và phí tạm tính</Text>
                </div>

                <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Form form={form} layout="vertical" onFinish={handleSearch}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Form.Item
                                name="licensePlate"
                                style={{ flex: 1, marginBottom: 0 }}
                                rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
                            >
                                <Input size="large" prefix={<SearchOutlined />} placeholder="Ví dụ: 29A-12345" />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ width: 120 }}>
                                Tra Cứu
                            </Button>
                        </div>
                    </Form>
                </Card>

                {loading && (
                    <div style={{ textAlign: 'center', marginTop: 40 }}>
                        <Spin size="large" />
                    </div>
                )}

                {sessionData && !loading && (
                    <Card style={{ marginTop: 24, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Title level={4} style={{ marginBottom: 24, color: '#1890ff' }}>
                            <CarOutlined style={{ marginRight: 8 }} />
                            Thông Tin Lượt Gửi
                        </Title>
                        
                        {sessionData.isFlagged && (
                            <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', padding: '12px 16px', borderRadius: 8, marginBottom: 24 }}>
                                <Text type="danger">
                                    <strong>Cảnh Báo:</strong> Xe của bạn đang bị khóa tạm thời do sự cố ({sessionData.incidentDetails?.join(', ')}). 
                                    Vui lòng liên hệ nhân viên để được hỗ trợ.
                                </Text>
                            </div>
                        )}

                        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="Biển số xe">
                                <Text strong style={{ fontSize: 16 }}>{sessionData.licensePlate}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại xe">
                                <Tag color="blue">{sessionData.vehicleTypeName}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={<span><ClockCircleOutlined /> Giờ vào</span>}>
                                {new Date(sessionData.timeIn).toLocaleString('vi-VN')}
                            </Descriptions.Item>
                            <Descriptions.Item label={<span><ClockCircleOutlined /> Thời gian đã đỗ</span>}>
                                {sessionData.durationMinutes} phút
                            </Descriptions.Item>
                            <Descriptions.Item label={<span><BankOutlined /> Khu vực đỗ</span>} span={2}>
                                Vị trí <strong>{sessionData.slotName}</strong> - Tầng <strong>{sessionData.floorName}</strong> (Tòa nhà #{sessionData.buildingId})
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider dashed />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', padding: '24px', borderRadius: 8 }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 16 }}>Phí Tạm Tính</Text>
                                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                                    (Chưa bao gồm các phí phát sinh khi thanh toán)
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a' }}>
                                    <MoneyCollectOutlined style={{ marginRight: 8 }} />
                                    {sessionData.totalFee.toLocaleString('vi-VN')} VNĐ
                                </Text>
                            </div>
                        </div>
                    </Card>
                )}

                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <Text type="secondary">Bạn gặp sự cố (mất thẻ, sai thông tin)? </Text>
                    <Button type="link" onClick={() => navigate('/help')}>
                        Báo cáo ngay <ArrowRightOutlined />
                    </Button>
                </div>
            </div>
        </Content>
    );
};

export default UserTracking;
