import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Switch, Button, message, Spin, Collapse } from 'antd';
import { SaveOutlined, SecurityScanOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Panel } = Collapse;

const BASE_URL = 'http://localhost:8080/api/admin/roles';

const AdminRoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [rolePermissionsMap, setRolePermissionsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const rolesRes = await axios.get(BASE_URL, { headers });
            const permsRes = await axios.get(`${BASE_URL}/permissions`, { headers });
            
            setRoles(rolesRes.data);
            setAllPermissions(permsRes.data);

            const map = {};
            for (let r of rolesRes.data) {
                const rpRes = await axios.get(`${BASE_URL}/${r.roleCode}/permissions`, { headers });
                map[r.roleCode] = rpRes.data; // Array of Permission IDs
            }
            setRolePermissionsMap(map);
        } catch (error) {
            message.error('Failed to load RBAC data.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = (roleCode, permissionId, checked) => {
        setRolePermissionsMap(prev => {
            const updated = prev[roleCode] ? [...prev[roleCode]] : [];
            if (checked && !updated.includes(permissionId)) {
                updated.push(permissionId);
            } else if (!checked && updated.includes(permissionId)) {
                const index = updated.indexOf(permissionId);
                updated.splice(index, 1);
            }
            return { ...prev, [roleCode]: updated };
        });
    };

    const saveRolePermissions = async (roleCode) => {
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            await axios.put(`${BASE_URL}/${roleCode}/permissions`, 
                { permissionIds: rolePermissionsMap[roleCode] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success(`Permissions for ${roleCode} updated successfully.`);
        } catch (error) {
            message.error(error.response?.data?.message || `Failed to update permissions for ${roleCode}.`);
        } finally {
            setSaving(false);
        }
    };

    // Group permissions by module
    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {});

    return (
        <Content style={{ padding: '24px' }}>
            <Card title={<><SecurityScanOutlined /> RBAC Configuration Matrix</>} bordered={false}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Define what actions each Role is allowed to perform across the system. 
                    Changes are applied in real-time to active sessions.
                </Text>

                <Spin spinning={loading}>
                    <Collapse accordion defaultActiveKey={['ROLE_STAFF']}>
                        {roles.map(role => (
                            <Panel 
                                header={<Text strong>{role.roleName} ({role.roleCode})</Text>} 
                                key={role.roleCode}
                                extra={
                                    <Button 
                                        type="primary" 
                                        size="small"
                                        loading={saving}
                                        icon={<SaveOutlined />}
                                        onClick={(e) => { e.stopPropagation(); saveRolePermissions(role.roleCode); }}
                                    >
                                        Save Changes
                                    </Button>
                                }
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                                        <Card size="small" title={`Module: ${moduleName}`} key={moduleName} style={{ background: '#fafafa' }}>
                                            <Table 
                                                dataSource={perms} 
                                                rowKey="permissionId" 
                                                pagination={false}
                                                size="small"
                                                columns={[
                                                    { title: 'Permission Code', dataIndex: 'permissionCode', width: '30%' },
                                                    { title: 'Description', dataIndex: 'description', width: '50%' },
                                                    { 
                                                        title: 'Access', 
                                                        width: '20%',
                                                        render: (_, record) => {
                                                            const isGranted = (rolePermissionsMap[role.roleCode] || []).includes(record.permissionId);
                                                            return (
                                                                <Switch 
                                                                    checked={isGranted}
                                                                    onChange={(checked) => handleTogglePermission(role.roleCode, record.permissionId, checked)}
                                                                />
                                                            );
                                                        }
                                                    }
                                                ]}
                                            />
                                        </Card>
                                    ))}
                                </div>
                            </Panel>
                        ))}
                    </Collapse>
                </Spin>
            </Card>
        </Content>
    );
};

export default AdminRoleManagement;
