import { useEffect, useMemo, useState } from 'react';
import {
  createWithdraw,
  DeveloperDeviceSummary,
  getDeveloperDevices,
  getWithdrawRecords,
  WithdrawRecord,
} from '../lib/api';

type DeveloperTab = 'devices' | 'withdraw';

export default function DeveloperWorkbench() {
  const [activeTab, setActiveTab] = useState<DeveloperTab>('devices');
  const [devices, setDevices] = useState<DeveloperDeviceSummary[]>([]);
  const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const groupedDevices = useMemo(() => {
    return devices.reduce<Record<string, DeveloperDeviceSummary[]>>((acc, item) => {
      if (!acc[item.merchantId]) {
        acc[item.merchantId] = [];
      }
      acc[item.merchantId].push(item);
      return acc;
    }, {});
  }, [devices]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [deviceRes, withdrawRes] = await Promise.all([
          getDeveloperDevices(),
          getWithdrawRecords(),
        ]);

        if (String(deviceRes.code) === '200') {
          setDevices(deviceRes.data);
        } else {
          setMessage(deviceRes.msg || '获取设备失败');
        }

        if (String(withdrawRes.code) === '200') {
          setWithdrawRecords(withdrawRes.data);
        } else {
          setMessage(withdrawRes.msg || '获取提现明细失败');
        }
      } catch {
        setMessage('加载开发端数据失败');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    const result = await createWithdraw();
    setWithdrawing(false);

    if (String(result.code) !== '200') {
      setMessage(result.msg || '提现失败');
      return;
    }

    setMessage(result.msg || '提现成功');
    setWithdrawRecords((prev) => [result.data, ...prev]);
    setActiveTab('withdraw');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 py-3">
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 py-4 text-white shadow-sm">
        <h2 className="text-lg font-semibold mt-1">开发工作台</h2>
        <p className="text-xs text-indigo-100 mt-1">店铺设备总览与提现管理</p>
      </div>

      {loading && (
        <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          数据加载中...
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4 rounded-2xl bg-white p-2 border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('devices')}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'devices' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
          }`}
        >
          设备列表
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('withdraw')}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'withdraw' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
          }`}
        >
          提现明细
        </button>
      </div>

      {activeTab === 'devices' && (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="inline-flex items-center rounded-full bg-indigo-50 hover:bg-indigo-100 disabled:bg-indigo-50/60 px-3 py-1 text-xs font-medium text-indigo-700 transition-all"
            >
              {withdrawing ? '提现中...' : '提现'}
            </button>
          </div>
          {Object.keys(groupedDevices).length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-2xl border border-slate-200">
              暂无设备
            </div>
          ) : (
            Object.values(groupedDevices).map((merchantDevices) => {
              const merchantName = merchantDevices[0]?.merchantName || '未知店铺';
              const merchantId = merchantDevices[0]?.merchantId || 'unknown';
              const merchantUsageCount = merchantDevices[0]?.merchantUsageCount ?? 0;
              return (
                <div key={merchantId} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">{merchantName}</p>
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                      使用次数 {merchantUsageCount}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {merchantDevices.map((device) => (
                      <div key={device.deviceId} className="rounded-xl border border-slate-100 px-3 py-2 bg-slate-50/50">
                        <p className="text-sm text-slate-800 font-medium">{device.deviceName}</p>
                        <p className="text-xs text-slate-500 mt-1">设备ID：{device.deviceId}</p>
                        <p className="text-xs text-slate-500 mt-1">免费到期时间：{device.freeExpireAt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'withdraw' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {withdrawRecords.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8">暂无提现明细</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {withdrawRecords.map((record) => (
                <div key={record.id} className="p-3">
                  <p className="text-sm text-slate-800 font-medium">提现点击时间：{record.clickedAt}</p>
                  <p className="text-xs text-slate-600 mt-1">提现时设备使用次数：{record.usageCount}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
