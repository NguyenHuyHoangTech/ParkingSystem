import React, { useState } from 'react';
import { Layout, Typography, Card, Form, Input, Select, Button, message, Alert, Result } from 'antd';
import { SearchOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
import { useNavigate } from 'react-router-dom';

const UserHelp = () => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const payload = {
                licensePlate: values.licensePlate,
                type: values.incidentType,
                description: values.description
            };

            await axios.post('http://localhost:8080/api/public/incidents/report', payload);
            
            setSubmitted(true);
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi gửi báo cáo sự cố');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <Content style={{ padding: '50px', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
                <Card style={{ width: 600, textAlign: 'center' }}>
                    <Result
                        status="success"
                        title="Đã Gửi Báo Cáo Sự Cố Thành Công!"
                        subTitle="Nhân viên bãi đỗ xe đã nhận được thông báo của bạn. Vui lòng đợi tại trạm trong ít phút để được hỗ trợ trực tiếp."
                        extra={[
                            <Button type="primary" key="console" onClick={() => { setSubmitted(false); form.resetFields(); }}>
                                Quay Lại
                            </Button>
                        ]}
                    />
                </Card>
            </Content>
        );
    }

    return (
        <Content style={{ padding: '50px', minHeight: '100vh', background: '#f0f2f5' }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <WarningOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
                    <Title level={2}>Trạm Hỗ Trợ Khách Hàng</Title>
                    <Text type="secondary">Vui lòng điền thông tin bên dưới nếu bạn gặp sự cố, nhân viên sẽ đến hỗ trợ bạn ngay lập tức.</Text>
                </div>

                <Card>
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            name="licensePlate"
                            label="Biển số xe của bạn"
                            rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
                        >
                            <Input size="large" prefix={<SearchOutlined />} placeholder="Ví dụ: 29A-12345" />
                        </Form.Item>

                        <Form.Item
                            name="incidentType"
                            label="Loại sự cố"
                            rules={[{ required: true, message: 'Vui lòng chọn loại sự cố' }]}
                        >
                            <Select size="large" placeholder="-- Chọn sự cố --">
                                <Option value="LOST_TICKET">Tôi bị mất thẻ xe (Lost Ticket)</Option>
                                <Option value="WRONG_ZONE">Tôi đỗ sai khu vực (Wrong Zone)</Option>
                                <Option value="OVERTIME">Thẻ của tôi báo quá hạn (Overtime)</Option>
                                <Option value="WRONG_PLATE">Hệ thống không nhận diện được biển số</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Mô tả thêm (Tùy chọn)"
                        >
                            <TextArea rows={4} placeholder="Cung cấp thêm thông tin giúp nhân viên hỗ trợ bạn nhanh hơn..." />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" size="large" loading={loading} block style={{ height: 50, fontSize: 18 }}>
                            Gửi Yêu Cầu Hỗ Trợ Khẩn Cấp
                        </Button>
                    </Form>
                </Card>

                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <Text type="secondary">Bạn muốn xem thông tin phí tạm tính? </Text>
                    <Button type="link" onClick={() => navigate('/track')}>
                        Tra cứu lượt gửi xe
                    </Button>
                </div>
            </div>
        </Content>
    );
};

export default UserHelp;
