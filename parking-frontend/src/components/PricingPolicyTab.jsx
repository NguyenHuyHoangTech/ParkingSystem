import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Typography, Tag, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axiosInstance';
import PricingPolicyForm from './PricingPolicyForm';
import { Form } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PricingPolicyTab = ({ buildingId, vehicleTypes }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadPolicies = async () => {
    if (!buildingId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/manager/buildings/${buildingId}/pricing-policies`);
      setPolicies(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      message.error('Failed to load policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, [buildingId]);

  const openModal = () => {
    // Pre-populate default rules for all vehicle types to make it easier for users
    const defaultRules = (Array.isArray(vehicleTypes) ? vehicleTypes : []).map(vt => ({
      vehicleTypeId: vt.typeId,
      gracePeriodMinutes: 15,
      maxDailyCap: null,
      lostTicketSurcharge: 50000,
      blocks: [
        {
          timeRange: [dayjs().startOf('day'), dayjs().endOf('day')],
          firstBlockDurationMinutes: 120,
          firstBlockRate: 20000,
          subsequentBlockDurationMinutes: 60,
          subsequentBlockRate: 10000
        }
      ]
    }));
    
    form.setFieldsValue({
      rules: defaultRules
    });
    setIsModalOpen(true);
  };

  const transformValuesToDto = (values) => {
    const formatTime = (dateObj) => {
      if (!dateObj) return null;
      if (typeof dateObj.format === 'function') return dateObj.format('HH:mm:ss');
      return dayjs(dateObj).format('HH:mm:ss');
    };
    const formatDate = (dateObj) => {
      if (!dateObj) return null;
      if (typeof dateObj.format === 'function') return dateObj.format('YYYY-MM-DDTHH:mm:ss');
      return dayjs(dateObj).format('YYYY-MM-DDTHH:mm:ss');
    };

    const dto = {
      policyName: values.policyName,
      effectiveDate: formatDate(values.effectiveDate),
      expiryDate: formatDate(values.expiryDate),
      rules: (values.rules || []).map(r => ({
        vehicleTypeId: r.vehicleTypeId,
        gracePeriodMinutes: r.gracePeriodMinutes || 0,
        maxDailyCap: r.maxDailyCap,
        lostTicketSurcharge: r.lostTicketSurcharge || 0,
        blocks: (r.blocks || []).map(b => ({
          timeFrameStart: formatTime(b.timeRange?.[0]),
          timeFrameEnd: formatTime(b.timeRange?.[1]),
          firstBlockDurationMinutes: b.firstBlockDurationMinutes,
          firstBlockRate: b.firstBlockRate,
          subsequentBlockDurationMinutes: b.subsequentBlockDurationMinutes,
          subsequentBlockRate: b.subsequentBlockRate
        }))
      }))
    };
    return dto;
  };

  const submitPolicy = async (dto, forceOverride = false) => {
    try {
      await axiosInstance.post(`/manager/buildings/${buildingId}/pricing-policies`, dto, {
        params: { forceOverride }
      });
      message.success('Đã lưu cấu hình giá thành công!');
      setIsModalOpen(false);
      form.resetFields();
      loadPolicies();
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Overlap detected
        Modal.confirm({
          title: 'Policy Time Overlap Detected',
          content: `${error.response.data.error || 'This policy overlaps with an existing active policy'}. Do you want to deactivate the old policy and force override?`,
          okText: 'Yes, Override',
          cancelText: 'Cancel',
          onOk: () => {
            submitPolicy(dto, true);
          }
        });
      } else {
        const errorMsg = error.response?.data?.error || JSON.stringify(error.response?.data) || error.message || 'Lỗi không xác định';
        message.error(`Failed to save policy. Backend says: ${errorMsg}`);
      }
    }
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      // Basic Frontend Validation for blocks coverage could go here
      const dto = transformValuesToDto(values);
      submitPolicy(dto, false);
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  const safeFormatDate = (val) => {
    if (!val) return 'Vô thời hạn (Indefinite)';
    try {
      if (Array.isArray(val)) {
        return dayjs(new Date(val[0], val[1] - 1, val[2], val[3] || 0, val[4] || 0, val[5] || 0)).format('YYYY-MM-DD HH:mm');
      }
      return dayjs(val).format('YYYY-MM-DD HH:mm');
    } catch (e) {
      return 'Lỗi định dạng ngày';
    }
  };

  const columns = [
    { title: 'Mã', dataIndex: 'policyId', key: 'policyId' },
    { title: 'Tên Chính Sách', dataIndex: 'policyName', key: 'policyName' },
    { 
      title: 'Ngày Hiệu Lực', dataIndex: 'effectiveDate', key: 'effectiveDate',
      render: val => safeFormatDate(val)
    },
    { 
      title: 'Ngày Hết Hạn', dataIndex: 'expiryDate', key: 'expiryDate',
      render: val => safeFormatDate(val)
    },
    {
      title: 'Trạng Thái', dataIndex: 'isActive', key: 'isActive',
      render: isActive => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Đang Áp Dụng' : 'Đã Hết Hạn'}</Tag>
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Danh Sách Bảng Giá (Pricing Policies)</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
          Tạo Bảng Giá Mới
        </Button>
      </div>

      <Table dataSource={policies} columns={columns} rowKey="policyId" loading={loading} />

      <Modal
        title="Thiết Lập Bảng Giá Mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={1000}
        onOk={handleSave}
        okText="Lưu Bảng Giá"
        cancelText="Hủy"
        destroyOnClose
      >
        <PricingPolicyForm form={form} vehicleTypes={vehicleTypes} />
      </Modal>
    </div>
  );
};

export default PricingPolicyTab;
