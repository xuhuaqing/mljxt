import { useEffect, useMemo, useState } from 'react';
import {
  createTeacherOrder,
  getMerchantDevices,
  getMerchantRemainingCount,
  getMerchantOrderConsumeRecords,
  getMerchantsAndDevices,
  getProjectCategories,
  Merchant,
  MerchantDeviceSummary,
  ProjectCategory,
  TeacherOrderPayload,
  UsageRecord,
} from '../lib/api';

type MerchantTab = 'devices' | 'records' | 'order';

const defaultOrderForm: Omit<TeacherOrderPayload, 'merchantId' | 'projectName'> = {
  phone: '',
  gender: '女',
  age: 25,
  height: 165,
  weight: 52,
  durationMinutes: 45,
};

export default function MerchantWorkbench() {
  const [activeTab, setActiveTab] = useState<MerchantTab>('devices');
  const [devices, setDevices] = useState<MerchantDeviceSummary[]>([]);
  const [merchantRemainingCount, setMerchantRemainingCount] = useState(0);
  const [consumeRecords, setConsumeRecords] = useState<UsageRecord[]>([]);
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  const [selectedProject, setSelectedProject] = useState('');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [orderForm, setOrderForm] = useState(defaultOrderForm);
  const [orderMerchantId, setOrderMerchantId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const selectedOrderMerchantName = useMemo(
    () => merchants.find((item) => item.id === orderMerchantId)?.name || '当前登录商家',
    [merchants, orderMerchantId]
  );
  const groupedConsumeRecords = useMemo(() => {
    return consumeRecords.reduce<Record<string, UsageRecord[]>>((acc, record) => {
      const key = `${record.deviceName}__${record.deviceId}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
      return acc;
    }, {});
  }, [consumeRecords]);

  useEffect(() => {
    const loadMerchantData = async () => {
      setLoading(true);
      try {
        const [deviceRes, remainingRes, consumeRes, projectRes, merchantRes] = await Promise.all([
          getMerchantDevices(),
          getMerchantRemainingCount(),
          getMerchantOrderConsumeRecords(),
          getProjectCategories(),
          getMerchantsAndDevices(),
        ]);

        if (String(deviceRes.code) === '200') {
          setDevices(deviceRes.data);
        } else {
          setMessage(deviceRes.msg || '获取设备列表失败');
        }

        if (String(remainingRes.code) === '200') {
          setMerchantRemainingCount(remainingRes.data);
        } else {
          setMessage(remainingRes.msg || '获取剩余次数失败');
        }

        if (String(consumeRes.code) === '200') {
          setConsumeRecords(consumeRes.data);
        } else {
          setMessage(consumeRes.msg || '获取订单消耗记录失败');
        }

        if (String(projectRes.code) === '200') {
          setProjectCategories(projectRes.data);
        }
        if (String(merchantRes.code) === '200') {
          setMerchants(merchantRes.data);
          setOrderMerchantId(merchantRes.data[0]?.id || '');
        }
      } catch {
        setMessage('加载商家页面数据失败');
      } finally {
        setLoading(false);
      }
    };

    void loadMerchantData();
  }, []);

  const handleSubmitOrder = async () => {
    if (!/^1[3-9]\d{9}$/.test(orderForm.phone)) {
      setMessage('请输入有效手机号');
      return;
    }
    if (!selectedProject) {
      setMessage('请选择项目');
      return;
    }
    if (!orderMerchantId) {
      setMessage('未获取到当前商家信息');
      return;
    }

    const payload: TeacherOrderPayload = {
      ...orderForm,
      merchantId: orderMerchantId,
      projectName: selectedProject,
    };

    const result = await createTeacherOrder(payload);
    if (String(result.code) !== '200') {
      setMessage(result.msg || '下单失败');
      return;
    }

    setMessage(result.msg || '下单成功');
    setShowOrderDetail(false);
    setSelectedProject('');
    setOrderForm(defaultOrderForm);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 py-3">
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-4 text-white shadow-sm">
        <h2 className="text-lg font-semibold mt-1">商家工作台</h2>
        <p className="text-xs text-amber-100 mt-1">设备管理、订单消耗、商家下单</p>
      </div>

      {loading && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
          数据加载中...
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4 rounded-2xl bg-white p-2 border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('devices')}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'devices' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
          }`}
        >
          名下设备
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'records' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
          }`}
        >
          消耗记录
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('order')}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'order' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
          }`}
        >
          下单功能
        </button>
      </div>

      {activeTab === 'devices' && (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
              剩余次数 {merchantRemainingCount}
            </span>
          </div>
          {devices.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-2xl border border-slate-200">
              暂无设备
            </div>
          ) : (
            devices.map((device) => (
              <div key={device.deviceId} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div>
                  <p className="text-sm text-slate-800 font-medium">{device.deviceName}</p>
                  <p className="text-xs text-slate-500 mt-1">设备ID：{device.deviceId}</p>
                  <p className="text-xs text-slate-500 mt-1">免费到期时间：{device.freeExpireAt}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {consumeRecords.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8">暂无订单消耗记录</div>
          ) : (
            <div>
              {/* Mobile: card list to avoid squeezed columns */}
              <div className="md:hidden p-3 space-y-3">
                {Object.entries(groupedConsumeRecords).map(([groupKey, records]) => {
                  const [, deviceId] = groupKey.split('__');
                  const deviceName = records[0]?.deviceName || '未知设备';
                  return (
                    <div key={groupKey} className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 px-3 py-2">
                        <p className="text-sm font-medium text-slate-800">{deviceName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">设备ID：{deviceId}</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {records.map((record) => (
                          <div key={record.id} className="px-3 py-2">
                            <p className="text-xs text-slate-600">项目：{record.projectName}</p>
                            <p className="text-xs text-slate-600 mt-1">用户：{record.userPhone}</p>
                            <p className="text-xs text-slate-500 mt-1">{record.usedAt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(groupedConsumeRecords).length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-6">暂无订单消耗记录</div>
                )}
              </div>

              {/* Desktop/Tablet: keep table layout */}
              <div className="hidden md:block max-h-96 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">时间</th>
                      <th className="px-3 py-2 text-left font-medium">用户手机号</th>
                      <th className="px-3 py-2 text-left font-medium">项目</th>
                      <th className="px-3 py-2 text-left font-medium">设备</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumeRecords.map((record) => (
                      <tr key={record.id} className="border-t border-slate-100 text-slate-700">
                        <td className="px-3 py-2 whitespace-nowrap">{record.usedAt}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{record.userPhone}</td>
                        <td className="px-3 py-2">{record.projectName}</td>
                        <td className="px-3 py-2">{record.deviceName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'order' && (
        <div className="space-y-3">
          {!showOrderDetail ? (
            projectCategories.map((category) => (
              <div key={category.categoryName} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-800">{category.categoryName}</p>
                  <span className="text-xs text-slate-400">{category.projects.length} 个项目</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {category.projects.map((project) => (
                    <button
                      key={project}
                      type="button"
                      onClick={() => {
                        setSelectedProject(project);
                        setShowOrderDetail(true);
                        setMessage('');
                      }}
                      className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-2 py-2 text-xs text-slate-700 hover:border-orange-200 hover:text-orange-700 hover:from-orange-50 hover:to-orange-50 transition-all"
                    >
                      {project}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
              <p className="text-base font-semibold text-slate-800">下单详情</p>

              <label className="block text-xs text-slate-500 mb-1">下单用户手机号</label>
              <input
                value={orderForm.phone}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                placeholder="下单用户手机号"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">性别</label>
                <select
                  value={orderForm.gender}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, gender: e.target.value as '男' | '女' }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                >
                  <option value="女">女</option>
                  <option value="男">男</option>
                </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">年龄</label>
                <input
                  type="number"
                  value={orderForm.age}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, age: Number(e.target.value) || 0 }))}
                  placeholder="年龄"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">身高(cm)</label>
                <input
                  type="number"
                  value={orderForm.height}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, height: Number(e.target.value) || 0 }))}
                  placeholder="身高(cm)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">体重(kg)</label>
                <input
                  type="number"
                  value={orderForm.weight}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, weight: Number(e.target.value) || 0 }))}
                  placeholder="体重(kg)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
                </div>
              </div>

              <label className="block text-xs text-slate-500 mb-1">项目名称</label>
              <input
                value={selectedProject}
                readOnly
                className="w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 font-medium"
              />

              <label className="block text-xs text-slate-500 mb-1">项目时长(分钟)</label>
              <input
                type="number"
                value={orderForm.durationMinutes}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) || 45 }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />

              <label className="block text-xs text-slate-500 mb-1">商家</label>
              <input
                value={selectedOrderMerchantName}
                readOnly
                className="w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 font-medium"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOrderDetail(false)}
                  className="rounded-xl py-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  返回选项目
                </button>
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  className="rounded-xl py-2 text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 shadow-sm"
                >
                  提交下单
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
