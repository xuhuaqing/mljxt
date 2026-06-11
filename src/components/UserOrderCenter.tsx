import { useEffect, useMemo, useState } from 'react';
import {
  getDevicesByMerchantId,
  getMerchantOptions,
  MerchantDevice,
  MerchantOption,
  getUsageRecords,
  getUserOrders,
  useInstrument,
  UsageRecord,
  UserOrder,
} from '../lib/api';
import { formatDateTime } from '../lib/formatDateTime';

export default function UserOrderCenter() {
  const currentUserPhone = window.localStorage.getItem('currentUserPhone') || '';
  const currentUserId = Number(window.localStorage.getItem('currentUserId') || 0);
  const [devices, setDevices] = useState<MerchantDevice[]>([]);
  const [merchantOptions, setMerchantOptions] = useState<MerchantOption[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'history'>('orders');
  const [actionMessage, setActionMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actionMessage) return;
    const timer = window.setTimeout(() => setActionMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId),
    [devices, selectedDeviceId]
  );
  const visibleOrders = orders;

  const refreshCurrentData = async () => {
    if (!selectedMerchantId) return;
    const [orderResult, historyResult] = await Promise.allSettled([
      getUserOrders({ phone: currentUserPhone, merchantId: selectedMerchantId, pageNo: 1, pageSize: 50 }),
      getUsageRecords({ phone: currentUserPhone, pageNo: 1, pageSize: 50 }),
    ]);
    if (
      orderResult.status === 'fulfilled' &&
      (String(orderResult.value.code) === '200' || String(orderResult.value.code) === '0')
    ) {
      setOrders(orderResult.value.data);
    }
    if (
      historyResult.status === 'fulfilled' &&
      (String(historyResult.value.code) === '200' || String(historyResult.value.code) === '0')
    ) {
      setUsageRecords(historyResult.value.data);
    }
    setActionMessage('数据已刷新');
  };

  useEffect(() => {
    const loadInitData = async () => {
      setLoading(true);
      try {
        const merchantOptionRes = await getMerchantOptions({
          ...(currentUserId > 0 ? { userId: currentUserId } : {}),
          ...(currentUserPhone ? { phone: currentUserPhone } : {}),
        });
        if (
          (String(merchantOptionRes.code) !== '0' && String(merchantOptionRes.code) !== '200') ||
          merchantOptionRes.data.length === 0
        ) {
          setActionMessage(merchantOptionRes.msg || '获取商家失败');
          return;
        }
        setMerchantOptions(merchantOptionRes.data);

        const firstMerchantId = merchantOptionRes.data[0]?.id || '';
        setSelectedMerchantId(firstMerchantId);

        const firstDeviceRes = await getDevicesByMerchantId(firstMerchantId);
        if (String(firstDeviceRes.code) === '0' || String(firstDeviceRes.code) === '200') {
          setDevices(firstDeviceRes.data);
          setSelectedDeviceId(firstDeviceRes.data[0]?.id || '');
        } else {
          setDevices([]);
          setSelectedDeviceId('');
        }

        const [orderResult, historyResult] = await Promise.allSettled([
          getUserOrders({ phone: currentUserPhone, merchantId: firstMerchantId, pageNo: 1, pageSize: 50 }),
          getUsageRecords({ phone: currentUserPhone, pageNo: 1, pageSize: 50 }),
        ]);

        if (orderResult.status === 'fulfilled') {
          const orderRes = orderResult.value;
          if (String(orderRes.code) === '200' || String(orderRes.code) === '0') {
            setOrders(orderRes.data);
          } else {
            setActionMessage(orderRes.msg || '获取订单失败');
          }
        } else {
          setActionMessage('获取订单失败');
        }

        if (historyResult.status === 'fulfilled') {
          const historyRes = historyResult.value;
          if (String(historyRes.code) === '200' || String(historyRes.code) === '0') {
            setUsageRecords(
              historyRes.data.map((item) => ({
                ...item,
                userPhone: item.userPhone || currentUserPhone,
              }))
            );
          } else {
            setActionMessage(historyRes.msg || '获取历史记录失败');
          }
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
    if (!merchantId) return;
    setSelectedMerchantId(merchantId);
    setActionMessage('');

    const deviceRes = await getDevicesByMerchantId(merchantId);
    if (String(deviceRes.code) === '0' || String(deviceRes.code) === '200') {
      setDevices(deviceRes.data);
      setSelectedDeviceId(deviceRes.data[0]?.id || '');
    } else {
      setDevices([]);
      setSelectedDeviceId('');
      setActionMessage(deviceRes.msg || '获取设备失败');
    }

    const orderRes = await getUserOrders({ phone: currentUserPhone, merchantId, pageNo: 1, pageSize: 50 });
    if (String(orderRes.code) !== '200' && String(orderRes.code) !== '0') {
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
    if (!selectedDevice.machineNo?.trim()) {
      setActionMessage('所选设备缺少 machineNo，无法使用仪器');
      return;
    }

    try {
      console.log('[使用仪器] 页面上下文:', {
        orderId,
        selectedMerchantId,
        selectedDeviceId: selectedDevice.id,
        deviceName: selectedDevice.name,
        machineNo: selectedDevice.machineNo,
      });
      const useRes = await useInstrument({
        orderId,
        machineNo: selectedDevice.machineNo,
      });
      const wrappedCode = (useRes as { code?: string | number }).code;
      if (typeof wrappedCode !== 'undefined') {
        if (String(wrappedCode) !== '200' && String(wrappedCode) !== '0') {
          setActionMessage((useRes as { msg?: string }).msg || '使用失败');
          return;
        }
      }

      const [orderResult, historyResult] = await Promise.allSettled([
        getUserOrders({ phone: currentUserPhone, merchantId: selectedMerchantId, pageNo: 1, pageSize: 50 }),
        getUsageRecords({ phone: currentUserPhone, pageNo: 1, pageSize: 50 }),
      ]);
      if (
        orderResult.status === 'fulfilled' &&
        (String(orderResult.value.code) === '200' || String(orderResult.value.code) === '0')
      ) {
        setOrders(orderResult.value.data);
      }
      if (
        historyResult.status === 'fulfilled' &&
        (String(historyResult.value.code) === '200' || String(historyResult.value.code) === '0')
      ) {
      setUsageRecords(
        historyResult.value.data.map((item) => ({
          ...item,
          userPhone: item.userPhone || currentUserPhone,
        }))
      );
      }
      setActionMessage((useRes as { msg?: string }).msg || `使用成功，订单ID：${orderId}`);
      setActiveTab('history');
    } catch {
      setActionMessage('使用失败，请检查接口或网络');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">订单中心</h2>
        <button
          type="button"
          onClick={() => {
            void refreshCurrentData();
          }}
          className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50"
        >
          刷新
        </button>
      </div>
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
            {merchantOptions.map((merchant) => (
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
            {devices.map((device) => (
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
          onClick={() => {
            setActiveTab('orders');
            setActionMessage('');
          }}
          className={`rounded-lg py-2 text-sm font-medium transition-all ${
            activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          订单列表
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            setActionMessage('');
          }}
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
                  使用次数：{order.totalCount} 次
                </p>
                <button
                  type="button"
                  onClick={() => handleUseInstrument(order.id)}
                  className="mt-3 w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2 text-sm font-medium transition-all disabled:bg-blue-300"
                  disabled={order.totalCount <= 0}
                >
                  {order.totalCount <= 0 ? '次数已用完' : '使用仪器'}
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
                  设备：{record.deviceName || '—'}
                  {record.deviceId ? `（${record.deviceId}）` : ''}
                </p>
                <p className="text-xs text-slate-500 mt-1">使用时间：{formatDateTime(record.usedAt)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
