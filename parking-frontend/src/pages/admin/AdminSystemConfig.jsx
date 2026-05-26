import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Input, InputNumber, Switch, Button, message, Form, Spin, Modal } from 'antd';
import { SaveOutlined, SettingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;

const BASE_URL = 'http://localhost:8080/api/admin/configurations';

const AdminSystemConfig = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
    
    // Maintenance Guard State
    const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [pendingMaintenanceValue, setPendingMaintenanceValue] = useState(false);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(BASE_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConfigs(response.data);

            // Populate form
            const initialValues = {};
            response.data.forEach(c => {
                initialValues[c.configKey] = c.dataType === 'BOOLEAN' ? c.configValue === 'true' : c.configValue;
            });
            form.setFieldsValue(initialValues);
        } catch (error) {
            console.error(error);
            message.error('Failed to load system configurations.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            
            // Map form values back to ConfigUpdateRequest array
            const requests = Object.keys(values).map(key => ({
                configKey: key,
                configValue: String(values[key])
            }));

            await axios.put(BASE_URL, requests, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success('Configurations updated and cache flushed successfully.');
            fetchConfigs();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Error saving configurations.');
        } finally {
            setSaving(false);
        }
    };

    const handleMaintenanceToggle = (checked) => {
        if (checked) {
            // Turning ON maintenance mode requires confirmation
            setPendingMaintenanceValue(checked);
            setMaintenanceModalVisible(true);
        } else {
            // Turning OFF is safe
            form.setFieldsValue({ SYS_MAINTENANCE_MODE: false });
        }
    };

    const confirmMaintenanceMode = () => {
        if (confirmText === 'CONFIRM') {
            form.setFieldsValue({ SYS_MAINTENANCE_MODE: pendingMaintenanceValue });
            setMaintenanceModalVisible(false);
            setConfirmText('');
        } else {
            message.error('Incorrect confirmation text.');
        }
    };

    const cancelMaintenanceMode = () => {
        // Revert toggle UI
        form.setFieldsValue({ SYS_MAINTENANCE_MODE: !pendingMaintenanceValue });
        setMaintenanceModalVisible(false);
        setConfirmText('');
    };

    // Group configs by category
    const groupedConfigs = configs.reduce((acc, config) => {
        if (!acc[config.category]) acc[config.category] = [];
        acc[config.category].push(config);
        return acc;
    }, {});

    const renderInput = (config) => {
        if (config.configKey === 'SYS_MAINTENANCE_MODE') {
            return <Switch onChange={handleMaintenanceToggle} checkedChildren="ON" unCheckedChildren="OFF" />;
        }
        
        switch (config.dataType) {
            case 'BOOLEAN':
                return <Switch checkedChildren="ON" unCheckedChildren="OFF" />;
            case 'INTEGER':
                return <InputNumber style={{ width: '100%' }} />;
            case 'DOUBLE':
                return <InputNumber style={{ width: '100%' }} step={0.1} />;
            default:
                if (config.configKey.includes('SECRET') || config.configKey.includes('PASSWORD') || config.configKey.includes('TOKEN')) {
                    return <Input.Password />;
                }
                return <Input />;
        }
    };

    return (
        <Content style={{ padding: '24px' }}>
            <Card 
                title={<><SettingOutlined /> Global System Configuration</>} 
                bordered={false}
                extra={
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>
                        Save All Changes
                    </Button>
                }
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Warning: Changes made here directly impact the entire system globally. 
                    Invalid configurations may cause service disruptions.
                </Text>

                <Spin spinning={loading}>
                    <Form form={form} layout="vertical" onFinish={handleSave}>
                        {Object.keys(groupedConfigs).map(category => (
                            <Card key={category} title={`Category: ${category}`} size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                                {groupedConfigs[category].map(config => (
                                    <Form.Item 
                                        key={config.configKey} 
                                        name={config.configKey} 
                                        label={<b>{config.configKey}</b>}
                                        extra={config.description}
                                        style={{ marginBottom: 24 }}
                                    >
                                        {renderInput(config)}
                                    </Form.Item>
                                ))}
                            </Card>
                        ))}
                    </Form>
                </Spin>
            </Card>

            {/* Maintenance Guard Modal */}
            <Modal
                title={<><ExclamationCircleOutlined style={{ color: 'red' }} /> CRITICAL ACTION: Enable Maintenance Mode</>}
                open={maintenanceModalVisible}
                onOk={confirmMaintenanceMode}
                onCancel={cancelMaintenanceMode}
                okText="Yes, Enable Maintenance"
                okButtonProps={{ danger: true, disabled: confirmText !== 'CONFIRM' }}
            >
                <Text type="danger" strong>
                    You are about to place the ENTIRE system into Maintenance Mode. 
                    All active users will be disconnected and services will be unavailable!
                </Text>
                <div style={{ marginTop: 16 }}>
                    <Text>To proceed, please type <b>CONFIRM</b> exactly as shown:</Text>
                    <Input 
                        style={{ marginTop: 8 }} 
                        value={confirmText} 
                        onChange={(e) => setConfirmText(e.target.value)} 
                        placeholder="Type CONFIRM here"
                    />
                </div>
            </Modal>
        </Content>
    );
};

export default AdminSystemConfig;
