import React from 'react';
import { Form, Input, DatePicker, Select, InputNumber, Button, Space, Card, TimePicker, Typography, Alert, Tooltip } from 'antd';
import { MinusCircleOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

const PricingPolicyForm = ({ form, vehicleTypes }) => {
  return (
    <Form form={form} layout="vertical">
      <Alert
        message="Hướng dẫn cấu hình giá"
        description="Điền thông tin bảng giá. Các loại xe đã được điền sẵn mặc định. Bạn có thể xóa loại xe không cần thiết hoặc điều chỉnh mức giá cho từng lượt."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <div style={{ background: '#f0f2f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <Title level={5}>1. Thông tin chung</Title>
        <Form.Item name="policyName" label="Tên Bảng Giá" rules={[{ required: true, message: 'Vui lòng nhập tên bảng giá' }]}>
          <Input placeholder="Ví dụ: Bảng giá chung 2026 / Giá ngày lễ..." size="large" />
        </Form.Item>
        
        <Space style={{ display: 'flex', width: '100%', gap: 24 }} align="baseline">
          <Form.Item name="effectiveDate" label="Ngày bắt đầu áp dụng" rules={[{ required: true, message: 'Chọn ngày bắt đầu' }]} style={{ flex: 1 }}>
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="Chọn ngày bắt đầu" />
          </Form.Item>
          <Form.Item name="expiryDate" label="Ngày kết thúc (Bỏ trống nếu áp dụng vô thời hạn)" style={{ flex: 1 }}>
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="Không bắt buộc" />
          </Form.Item>
        </Space>
      </div>

      <Title level={5}>2. Bảng giá chi tiết từng loại xe</Title>
      <Form.List name="rules">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }, index) => (
              <Card key={key} style={{ marginBottom: 24, border: '1px solid #d9d9d9' }} 
                title={<Text strong style={{ color: '#1890ff', fontSize: 16 }}>Cấu hình xe loại {index + 1}</Text>}
                extra={<Button danger type="text" onClick={() => remove(name)} icon={<MinusCircleOutlined />}>Xóa loại xe này</Button>}
              >
                <Space style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%' }} align="start">
                  <Form.Item {...restField} name={[name, 'vehicleTypeId']} label="Áp dụng cho Loại Xe" rules={[{ required: true, message: 'Bắt buộc chọn' }]}>
                    <Select placeholder="Chọn loại xe..." style={{ width: 180 }}>
                      {(Array.isArray(vehicleTypes) ? vehicleTypes : []).map(t => (
                        <Option key={t.typeId} value={t.typeId}>{t.typeName}</Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item {...restField} name={[name, 'gracePeriodMinutes']} 
                    label={
                      <Space>
                        Miễn phí mấy phút đầu?
                        <Tooltip title="Thời gian khách được đỗ miễn phí trước khi bắt đầu tính tiền (VD: 15 phút)."><InfoCircleOutlined /></Tooltip>
                      </Space>
                    } 
                    rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: 180 }} placeholder="VD: 15" addonAfter="phút" />
                  </Form.Item>

                  <Form.Item {...restField} name={[name, 'maxDailyCap']} 
                    label={
                      <Space>
                        Thu tối đa / 1 ngày
                        <Tooltip title="Nếu khách gửi quá lâu, thu tối đa bao nhiêu 1 ngày? Bỏ trống nếu cứ cộng dồn mãi mãi."><InfoCircleOutlined /></Tooltip>
                      </Space>
                    }>
                    <InputNumber min={0} style={{ width: 180 }} placeholder="Không giới hạn" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="VNĐ" />
                  </Form.Item>

                  <Form.Item {...restField} name={[name, 'lostTicketSurcharge']} label="Phí phạt nếu làm mất vé">
                    <InputNumber min={0} style={{ width: 180 }} placeholder="VD: 50000" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="VNĐ" />
                  </Form.Item>
                </Space>

                <div style={{ background: '#fafafa', padding: 16, marginTop: 16, borderRadius: 8, border: '1px dashed #d9d9d9' }}>
                  <Text strong>Cấu hình cách tính tiền theo Lượt / Khung giờ</Text>
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Nếu tính giá giống nhau cho cả ngày, hãy giữ nguyên thời gian 00:00 - 23:59.<br/>
                      Nếu Ban ngày giá khác, Ban đêm giá khác, hãy thêm Khung giờ cho Ban đêm.
                    </Text>
                  </div>
                  
                  <Form.List name={[name, 'blocks']}>
                    {(blockFields, { add: addBlock, remove: removeBlock }) => (
                      <>
                        {blockFields.map((blockField, bIndex) => (
                          <div key={blockField.key} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start', flexWrap: 'wrap', background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e8e8e8', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: '100%', marginBottom: 8 }}>
                              <Text strong style={{ color: '#52c41a', fontSize: 15 }}>Khung giờ {bIndex + 1}</Text>
                              <Button danger type="link" size="small" style={{ float: 'right' }} onClick={() => removeBlock(blockField.name)} icon={<MinusCircleOutlined />}>Xóa khung này</Button>
                            </div>
                            
                            <Form.Item {...blockField} name={[blockField.name, 'timeRange']} label="Thời gian áp dụng" rules={[{ required: true, message: 'Bắt buộc' }]}>
                              <TimePicker.RangePicker format="HH:mm" style={{ width: 220 }} />
                            </Form.Item>

                            <Form.Item {...blockField} name={[blockField.name, 'firstBlockDurationMinutes']} label="Lượt đầu tiên kéo dài" rules={[{ required: true, message: 'Bắt buộc' }]}>
                              <InputNumber min={1} style={{ width: 150 }} placeholder="VD: 120" addonAfter="phút" />
                            </Form.Item>

                            <Form.Item {...blockField} name={[blockField.name, 'firstBlockRate']} label="Giá thu cho Lượt đầu tiên" rules={[{ required: true, message: 'Bắt buộc' }]}>
                              <InputNumber min={0} style={{ width: 160 }} placeholder="VD: 20000" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="đ" />
                            </Form.Item>

                            <Form.Item {...blockField} name={[blockField.name, 'subsequentBlockDurationMinutes']} label="Mỗi lượt tiếp theo kéo dài" rules={[{ required: true, message: 'Bắt buộc' }]}>
                              <InputNumber min={1} style={{ width: 150 }} placeholder="VD: 60" addonAfter="phút" />
                            </Form.Item>

                            <Form.Item {...blockField} name={[blockField.name, 'subsequentBlockRate']} label="Giá thu cho mỗi Lượt tiếp theo" rules={[{ required: true, message: 'Bắt buộc' }]}>
                              <InputNumber min={0} style={{ width: 180 }} placeholder="VD: 10000" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="đ" />
                            </Form.Item>
                          </div>
                        ))}
                        <Button type="dashed" onClick={() => addBlock({ timeRange: [dayjs().startOf('day'), dayjs().endOf('day')], firstBlockDurationMinutes: 120, firstBlockRate: 20000, subsequentBlockDurationMinutes: 60, subsequentBlockRate: 10000 })} block icon={<PlusOutlined />}>
                          Thêm Khung Giờ Mới (VD: Ban đêm)
                        </Button>
                      </>
                    )}
                  </Form.List>
                </div>
              </Card>
            ))}
            <Button type="primary" ghost size="large" onClick={() => add({ gracePeriodMinutes: 15, blocks: [{ timeRange: [dayjs().startOf('day'), dayjs().endOf('day')], firstBlockDurationMinutes: 120, firstBlockRate: 20000, subsequentBlockDurationMinutes: 60, subsequentBlockRate: 10000 }] })} block icon={<PlusOutlined />}>
              Thêm Bảng Giá Cho Một Loại Xe Khác
            </Button>
          </>
        )}
      </Form.List>
    </Form>
  );
};

export default PricingPolicyForm;
