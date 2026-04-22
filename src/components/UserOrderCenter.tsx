import { useEffect, useMemo, useState } from 'react';
import {
  getMerchantsAndDevices,
  getUsageRecords,
  getUserOrders,
  Merchant,
  useInstrument,
  UsageRecord,
  UserOrder,
} from '../lib/api';

export default function UserOrderCenter() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'history'>('orders');
  const [actionMessage, setActionMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId),
    [merchants, selectedMerchantId]
  );

  const selectedDevice = useMemo(
    () => selectedMerchant?.devices.find((device) => device.id === selectedDeviceId),
    [selectedMerchant, selectedDeviceId]
  );
  const visibleOrders = orders;

  useEffect(() => {
    const loadInitData = async () => {
      setLoading(true);
      try {
        const merchantRes = await getMerchantsAndDevices();
        if (String(merchantRes.code) !== '200' || merchantRes.data.length === 0) {
          setActionMessage(merchantRes.msg || '获取商家失败');
          return;
        }

        const loadedMerchants = merchantRes.data;
        const firstMerchant = loadedMerchants[0];
        const firstDeviceId = firstMerchant.devices[0]?.id || '';
        setMerchants(loadedMerchants);
        setSelectedMerchantId(firstMerchant.id);
        setSelectedDeviceId(firstDeviceId);

        const [orderRes, historyRes] = await Promise.all([
          getUserOrders(firstMerchant.id),
          getUsageRecords(),
        ]);

        if (String(orderRes.code) === '200') {
          setOrders(orderRes.data);
        } else {
          setActionMessage(orderRes.msg || '获取订单失败');
        }

        if (String(historyRes.code) === '200') {
          setUsageRecords(historyRes.data);
        } else {
          setActionMessage(historyRes.msg || '获取历史记录失败');
        }
      } catch {
        setActionMessage('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    void loadInitData();
  }, []);

  const handleMerchantChange = async (merchantId: string) => {
    const merchant = merchants.find((item) => item.id === merchantId);
    if (!merchant) return;
    setSelectedMerchantId(merchant.id);
    setSelectedDeviceId(merchant.devices[0]?.id || '');
    setActionMessage('');

    const orderRes = await getUserOrders(merchant.id);
    if (String(orderRes.code) !== '200') {
      setActionMessage(orderRes.msg || '获取订单失败');
      return;
    }
    setOrders(orderRes.data);
  };

  const handleUseInstrument = async (orderId: string) => {
    if (!selectedDevice) {
      setActionMessage('请先选择设备');
      return;
    }

    const useRes = await useInstrument({
      orderId,
      deviceId: selectedDevice.id,
    });
    if (String(useRes.code) !== '200') {
      setActionMessage(useRes.msg || '使用失败');
      return;
    }

    const [orderRes, historyRes] = await Promise.all([
      getUserOrders(selectedMerchantId),
      getUsageRecords(),
    ]);
    if (String(orderRes.code) === '200') {
      setOrders(orderRes.data);
    }
    if (String(historyRes.code) === '200') {
      setUsageRecords(historyRes.data);
    }
    setActionMessage(useRes.msg || `使用成功，设备ID：${selectedDevice.id}`);
    setActiveTab('history');
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-5">
      <h2 className="text-xl font-bold text-slate-800 mb-4">订单中心</h2>
      {loading && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          数据加载中...
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <p className="text-sm font-medium text-slate-700 mb-3">商家选择</p>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={selectedMerchantId}
            onChange={(e) => handleMerchantChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {merchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.name}
              </option>
            ))}
          </select>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {selectedMerchant?.devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`rounded-lg py-2 text-sm font-medium transition-all ${
            activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          订单列表
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`rounded-lg py-2 text-sm font-medium transition-all ${
            activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          历史使用记录
        </button>
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {actionMessage}
        </div>
      )}

      {activeTab === 'orders' ? (
        <div className="space-y-3">
          {visibleOrders.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-xl border border-slate-200">
              当前商家暂无订单
            </div>
          ) : (
            visibleOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">商家：{order.merchantName}</p>
                <p className="text-base font-semibold text-slate-800 mt-1">项目：{order.projectName}</p>
                <p className="text-sm text-slate-600 mt-1">
                  次数：共 {order.totalCount} 次，剩余 {order.remainingCount} 次
                </p>
                <button
                  type="button"
                  onClick={() => handleUseInstrument(order.id)}
                  className="mt-3 w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2 text-sm font-medium transition-all disabled:bg-blue-300"
                  disabled={order.remainingCount <= 0}
                >
                  {order.remainingCount <= 0 ? '次数已用完' : '使用仪器'}
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {usageRecords.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-xl border border-slate-200">
              暂无历史使用记录
            </div>
          ) : (
            usageRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">商家：{record.merchantName}</p>
                <p className="text-sm text-slate-700 mt-1">项目：{record.projectName}</p>
                <p className="text-sm text-slate-700 mt-1">
                  设备：{record.deviceName}（{record.deviceId}）
                </p>
                <p className="text-xs text-slate-500 mt-1">使用时间：{record.usedAt}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
