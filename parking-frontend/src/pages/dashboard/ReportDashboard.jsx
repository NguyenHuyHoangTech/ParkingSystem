import React, { useState, useEffect } from 'react';
import { Layout, Typography, DatePicker, Select, Button, Space, message, Alert } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import KPISection from '../../components/reports/KPISection';
import ChartsSection from '../../components/reports/ChartsSection';
import { getDashboardSummary, getTrafficTrend, getRevenueDistribution, triggerAggregation } from '../../api/reportApi';
import axios from 'axios';
import { exportToExcel } from '../../utils/exportUtils';
import { useAuth } from '../../hooks/useAuth';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Content } = Layout;

const ReportDashboard = () => {
    const { user } = useAuth();
    
    // Default to today
    const [dateRange, setDateRange] = useState([dayjs(), dayjs()]);
    const [vehicleType, setVehicleType] = useState(null);
    const [loading, setLoading] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [trafficData, setTrafficData] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [vehicleTypesList, setVehicleTypesList] = useState([]);
    const [syncing, setSyncing] = useState(false);

    // We assume the Manager has an assigned building in user.buildingId, or Admin can view all (not fully implemented in UI selector yet, assuming buildingId=1 for demo if missing)
    const buildingId = user?.buildingId || 1;

    const fetchData = async () => {
        try {
            setLoading(true);
            const startDateStr = dateRange[0].format('YYYY-MM-DD');
            const endDateStr = dateRange[1].format('YYYY-MM-DD');
            
            // Only fetch summary for 'Today' (if range is just today)
            // Or we could fetch summary for the latest date in the range. The backend supports 'Today' via getDashboardSummary which doesn't take date.
            // Let's call summary anyway, it will show today's live data.
            const summary = await getDashboardSummary(buildingId);
            setSummaryData(summary);

            const traffic = await getTrafficTrend(buildingId, startDateStr, endDateStr, vehicleType);
            setTrafficData(traffic);

            const revenue = await getRevenueDistribution(buildingId, startDateStr, endDateStr);
            setRevenueData(revenue);

        } catch (error) {
            message.error('Failed to fetch report data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicleTypes = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/public/vehicle-types');
            setVehicleTypesList(response.data);
        } catch (error) {
            console.error('Failed to fetch vehicle types', error);
        }
    };

    useEffect(() => {
        fetchVehicleTypes();
    }, []);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [buildingId, dateRange, vehicleType]);

    const handleDateChange = (dates) => {
        if (!dates || dates.length !== 2) return;
        
        const [start, end] = dates;
        const diffDays = end.diff(start, 'day');
        
        if (diffDays > 90) {
            message.warning('Vui lòng chọn khoảng thời gian tối đa 90 ngày để đảm bảo tốc độ tải dữ liệu');
            // Reset to last 30 days
            setDateRange([end.subtract(30, 'day'), end]);
        } else {
            setDateRange(dates);
        }
    };

    const handleExport = () => {
        const trafficSheetData = trafficData.map(t => ({
            'Date / Hour': t.name,
            'Total Entries': t.entries,
            'Total Exits': t.exits
        }));

        const revenueSheetData = revenueData.map(r => ({
            'Vehicle Type': r.name,
            'Total Revenue (VNĐ)': r.value
        }));

        const exportData = {
            'Traffic Trend': trafficSheetData,
            'Revenue Distribution': revenueSheetData
        };
        
        exportToExcel(exportData, `Parking_Report_${buildingId}`);
        message.success('Report exported successfully');
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            await triggerAggregation();
            message.success('Data synchronized successfully!');
            fetchData(); // Reload data after sync
        } catch (error) {
            message.error('Failed to synchronize data');
            console.error(error);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Content style={{ padding: '24px', minHeight: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Reports & Analytics</Title>
                
                <Space>
                    <Button 
                        onClick={handleSync} 
                        loading={syncing}
                        title="Force recalculate historical data for today and past days"
                    >
                        Sync Data
                    </Button>

                    <Select 
                        placeholder="All Vehicles" 
                        allowClear 
                        style={{ width: 150 }}
                        onChange={setVehicleType}
                        value={vehicleType}
                    >
                        {vehicleTypesList.map(type => (
                            <Option key={type.typeId} value={type.typeId}>{type.typeName}</Option>
                        ))}
                    </Select>
                    
                    <RangePicker 
                        value={dateRange}
                        onChange={handleDateChange}
                        allowClear={false}
                    />
                    
                    <Button 
                        type="primary" 
                        icon={<DownloadOutlined />} 
                        onClick={handleExport}
                        disabled={loading || (trafficData.length === 0 && revenueData.length === 0)}
                    >
                        Export Excel
                    </Button>
                </Space>
            </div>

            {dateRange[0].isSame(dayjs(), 'day') && dateRange[1].isSame(dayjs(), 'day') && (
                <Alert message="Showing real-time data for Today" type="info" showIcon style={{ marginBottom: 16 }} />
            )}

            <KPISection data={summaryData} loading={loading} />
            
            <ChartsSection trafficData={trafficData} revenueData={revenueData} loading={loading} />
            
        </Content>
    );
};

export default ReportDashboard;
