import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Image, Row, Col, Typography, Tag } from 'antd';
import { resolveIncident } from '../../api/incidentApi';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ResolveIncidentModal = ({ visible, incident, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [noteLength, setNoteLength] = useState(0);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            await resolveIncident(incident.incidentId, {
                resolutionNote: values.resolutionNote,
                overrideAction: 'RESOLVE'
            });
            message.success('Incident resolved and session unlocked successfully');
            form.resetFields();
            onSuccess();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Failed to resolve incident');
        } finally {
            setLoading(false);
        }
    };

    const handleValuesChange = (changedValues, allValues) => {
        if (changedValues.resolutionNote !== undefined) {
            setNoteLength(changedValues.resolutionNote.length);
        }
    };

    if (!incident) return null;

    return (
        <Modal
            title={<Title level={4}>Resolve Incident: #{incident.incidentId}</Title>}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
        >
            <div style={{ marginBottom: 20 }}>
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Text strong>Exception Type: </Text>
                        <Tag color="red">{incident.exceptionType}</Tag>
                    </Col>
                    <Col span={12}>
                        <Text strong>License Plate: </Text>
                        <Text>{incident.licensePlate || 'N/A'}</Text>
                    </Col>
                    <Col span={24}>
                        <Text strong>Description: </Text>
                        <Text>{incident.description}</Text>
                    </Col>
                </Row>
            </div>

            {/* Display Images if available, especially for WRONG_PLATE */}
            {(incident.carImageIn || incident.carImageOut) && (
                <div style={{ marginBottom: 20 }}>
                    <Text strong>Camera Evidence:</Text>
                    <Row gutter={16} style={{ marginTop: 8 }}>
                        {incident.carImageIn && (
                            <Col span={12}>
                                <div><Text type="secondary">Entry Image</Text></div>
                                <Image width="100%" src={incident.carImageIn} fallback="https://via.placeholder.com/300?text=No+Image" />
                            </Col>
                        )}
                        {incident.carImageOut && (
                            <Col span={12}>
                                <div><Text type="secondary">Exit Image</Text></div>
                                <Image width="100%" src={incident.carImageOut} fallback="https://via.placeholder.com/300?text=No+Image" />
                            </Col>
                        )}
                    </Row>
                </div>
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={handleValuesChange}
            >
                <Form.Item
                    name="resolutionNote"
                    label="Resolution Note (Mandatory Audit Trail)"
                    rules={[
                        { required: true, message: 'Please enter a resolution note' },
                        { min: 20, message: 'Note must be at least 20 characters long' }
                    ]}
                >
                    <TextArea 
                        rows={4} 
                        placeholder="Explain why this incident is being resolved and what actions were taken. (Min 20 characters)" 
                        showCount 
                        maxLength={500} 
                    />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                    <Text type="secondary">
                        * Clicking confirm will apply any associated penalty fees and unlock the vehicle for exit.
                    </Text>
                    <Space>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading}
                            disabled={noteLength < 20}
                        >
                            Confirm & Override Lock
                        </Button>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
};

// Add Space import which was missing
import { Space } from 'antd';

export default ResolveIncidentModal;
