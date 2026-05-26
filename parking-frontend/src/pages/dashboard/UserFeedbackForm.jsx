import React, { useState } from 'react';
import { Layout, Typography, Card, Form, Input, Select, Button, message, Upload, Spin } from 'antd';
import { UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const BASE_URL = 'http://localhost:8080/api/user/feedbacks';

const UserFeedbackForm = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const sessionId = searchParams.get('sessionId');
    const bookingId = searchParams.get('bookingId');
    const buildingId = searchParams.get('buildingId');

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);

    const onFinish = async (values) => {
        try {
            setLoading(true);
            
            // Mock converting files to URLs or Base64. In reality, we'd upload to S3 first.
            const evidenceImages = fileList.map(file => file.name + "_mock_url");

            const payload = {
                buildingId: buildingId ? parseInt(buildingId) : 1, // Fallback for MVP if not provided
                sessionId: sessionId ? parseInt(sessionId) : null,
                bookingId: bookingId ? parseInt(bookingId) : null,
                issueCategory: values.issueCategory,
                description: values.description,
                evidenceImages: evidenceImages
            };

            await axios.post(BASE_URL, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            message.success('Report submitted successfully! Staff will assist you shortly.');
            navigate('/user/feedback-history');
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Failed to submit report. You may have too many open tickets.');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadChange = ({ fileList: newFileList }) => setFileList(newFileList);

    return (
        <Content style={{ padding: '24px', maxWidth: 600, margin: '0 auto' }}>
            <Card title={<><ExclamationCircleOutlined /> Report an Issue</>} bordered={false}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Having trouble? Describe your issue and our staff will assist you as soon as possible.
                </Text>

                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        name="issueCategory"
                        label="Issue Category"
                        rules={[{ required: true, message: 'Please select a category' }]}
                    >
                        <Select placeholder="Select the type of issue">
                            <Option value="LOST_TICKET">Lost Parking Ticket / Card</Option>
                            <Option value="FEE_DISPUTE">Fee Dispute / Incorrect Charge</Option>
                            <Option value="SLOT_OCCUPIED">My Reserved Slot is Occupied</Option>
                            <Option value="CAR_LOCATING">Can't Find My Car</Option>
                            <Option value="OTHERS">Other Issues</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Detailed Description"
                        rules={[
                            { required: true, message: 'Please provide some details' },
                            { min: 10, message: 'Description must be at least 10 characters' }
                        ]}
                    >
                        <TextArea rows={4} placeholder="E.g. Slot A-12 has a white Toyota parking in it..." />
                    </Form.Item>

                    <Form.Item label="Upload Evidence (Optional)">
                        <Upload
                            listType="picture"
                            fileList={fileList}
                            onChange={handleUploadChange}
                            beforeUpload={() => false} // Prevent auto upload
                            maxCount={5}
                        >
                            <Button icon={<UploadOutlined />}>Select Image (Max 5)</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ background: '#cf1322', borderColor: '#cf1322' }}>
                            Submit Report
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </Content>
    );
};

export default UserFeedbackForm;
