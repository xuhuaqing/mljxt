import { useEffect, useMemo, useState } from 'react';
import TopToast from './TopToast';
import {
  createTeacherOrder,
  getMerchantDevices,
  getMerchantOptions,
  getMerchantRemainingCount,
  getMerchantOrderConsumeRecords,
  getProjectCategories,
  manualRefreshDevice,
  MerchantOption,
  MerchantDeviceSummary,
  ProjectCategory,
  TeacherOrderPayload,
  UsageRecord,
} from '../lib/api';
import { formatDateTime, formatFreeUsage } from '../lib/formatDateTime';
import {
  isFixedDurationCategory,
  MERCHANT_HIDDEN_CATEGORY_NAMES,
  parseUsageCountInput,
} from '../lib/orderConstraints';

type MerchantTab = 'devices' | 'records' | 'order';

type OrderFormState = Omit<TeacherOrderPayload, 'merchantId' | 'projectName' | 'age' | 'height' | 'weight' | 'usageCount'> & {
  age: number | '';
  height: number | '';
  weight: number | '';
  usageCount: number | '';
};

const defaultOrderForm: OrderFormState = {
  phone: '',
  name: '',
  gender: '女',
  age: 25,
  height: 165,
  weight: 52,
  usageCount: 1,
  exercisePerformance: 0,
  durationMinutes: 45,
};

const parseBodyMetric = (value: string): number | '' => (value === '' ? '' : Number(value));

export default function MerchantWorkbench() {
  const currentMerchantId = window.localStorage.getItem('currentUserId') || '';
  const currentMerchantRemainingUseCount = Number(window.localStorage.getItem('currentMerchantRemainingUseCount') || 0);
  const [activeTab, setActiveTab] = useState<MerchantTab>('devices');
  const [devices, setDevices] = useState<MerchantDeviceSummary[]>([]);
  const [merchantRemainingCount, setMerchantRemainingCount] = useState(0);
  const [consumeRecords, setConsumeRecords] = useState<UsageRecord[]>([]);
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
  const [merchantOptions, setMerchantOptions] = useState<MerchantOption[]>([]);
  const [consumeSearchPhone, setConsumeSearchPhone] = useState('');
  const [consumeDeviceFilterId, setConsumeDeviceFilterId] = useState('');

  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [orderForm, setOrderForm] = useState(defaultOrderForm);
  const [orderMerchantId, setOrderMerchantId] = useState('');
  const [refreshingDeviceId, setRefreshingDeviceId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [consumePageNo, setConsumePageNo] = useState(1);
  const consumePageSize = 10;
  const [consumeTotal, setConsumeTotal] = useState(0);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const selectedOrderMerchantName = useMemo(
    () => merchantOptions.find((item) => item.id === orderMerchantId)?.name || '当前登录商家',
    [merchantOptions, orderMerchantId]
  );
  const visibleProjectCategories = useMemo(
    () =>
      projectCategories.filter(
        (category) => !MERCHANT_HIDDEN_CATEGORY_NAMES.includes(category.categoryName)
      ),
    [projectCategories]
  );
  const consumeTotalPages = Math.max(1, Math.ceil(consumeTotal / consumePageSize));

  const loadConsumeRecords = async (options?: { deviceId?: string; pageNo?: number; phone?: string }) => {
    const targetDeviceId =
      options && 'deviceId' in options ? options.deviceId ?? '' : consumeDeviceFilterId;
    const targetPageNo = options?.pageNo || consumePageNo;
    const targetPhone = options?.phone ?? consumeSearchPhone;

    if (!targetDeviceId) {
      if (devices.length === 0) {
        setConsumeRecords([]);
        setConsumeTotal(0);
        setConsumePageNo(1);
        return;
      }
      const allResults = await Promise.all(
        devices.map((device) =>
          getMerchantOrderConsumeRecords({
            deviceId: device.deviceId,
            phone: targetPhone,
            pageNo: 1,
            pageSize: 100,
          })
        )
      );
      const failed = allResults.find((item) => String(item.code) !== '200' && String(item.code) !== '0');
      if (failed) {
        setMessage(failed.msg || '获取订单消耗记录失败');
        return;
      }
      const merged = allResults
        .flatMap((item) => item.data.records)
        .sort((a, b) => (a.usedAt < b.usedAt ? 1 : -1));
      const start = (targetPageNo - 1) * consumePageSize;
      setConsumeRecords(merged.slice(start, start + consumePageSize));
      setConsumeTotal(merged.length);
      setConsumePageNo(targetPageNo);
      setConsumeDeviceFilterId('');
      return;
    }

    const consumeRes = await getMerchantOrderConsumeRecords({
      deviceId: targetDeviceId,
      phone: targetPhone,
      pageNo: targetPageNo,
      pageSize: consumePageSize,
    });
    if (String(consumeRes.code) === '200' || String(consumeRes.code) === '0') {
      setConsumeRecords(consumeRes.data.records);
      setConsumeTotal(consumeRes.data.total);
      setConsumePageNo(targetPageNo);
      setConsumeDeviceFilterId(targetDeviceId);
    } else {
      setMessage(consumeRes.msg || '获取订单消耗记录失败');
    }
  };

  useEffect(() => {
    const loadMerchantData = async () => {
      setLoading(true);
      if (currentMerchantRemainingUseCount > 0) {
        setMerchantRemainingCount(currentMerchantRemainingUseCount);
      }
      try {
        const [deviceResult, remainingResult, projectResult, merchantOptionResult] = await Promise.allSettled([
          getMerchantDevices(currentMerchantId),
          getMerchantRemainingCount(),
          getProjectCategories(),
          getMerchantOptions(),
        ]);

        if (deviceResult.status === 'fulfilled') {
          const deviceRes = deviceResult.value;
          if (String(deviceRes.code) === '200' || String(deviceRes.code) === '0') {
            setDevices(deviceRes.data);
            await loadConsumeRecords({ deviceId: '', pageNo: 1, phone: consumeSearchPhone });
          } else {
            setMessage(deviceRes.msg || '获取设备列表失败');
          }
        } else {
          setMessage('获取设备列表失败');
        }

        if (remainingResult.status === 'fulfilled') {
          const remainingRes = remainingResult.value;
          if (String(remainingRes.code) === '200' || String(remainingRes.code) === '0') {
            setMerchantRemainingCount(remainingRes.data);
          } else {
            setMessage(remainingRes.msg || '获取剩余次数失败');
          }
        }

        if (projectResult.status === 'fulfilled') {
          const projectRes = projectResult.value;
          if (String(projectRes.code) === '200' || String(projectRes.code) === '0') {
            setProjectCategories(projectRes.data);
          } else {
            setMessage(projectRes.msg || '获取项目失败');
          }
        } else {
          setMessage('获取项目失败');
        }

        if (merchantOptionResult.status === 'fulfilled') {
          const merchantOptionRes = merchantOptionResult.value;
          if (String(merchantOptionRes.code) === '0' || String(merchantOptionRes.code) === '200') {
            setMerchantOptions(merchantOptionRes.data);
            setOrderMerchantId(currentMerchantId || merchantOptionRes.data[0]?.id || '');
          } else {
            setMessage(merchantOptionRes.msg || '获取商家失败');
          }
        }
      } catch {
        setMessage('加载商家页面数据失败');
      } finally {
        setLoading(false);
      }
    };

    void loadMerchantData();
  }, [currentMerchantId, currentMerchantRemainingUseCount]);

  const handleSubmitOrder = async () => {
    if (!orderForm.name.trim()) {
      setMessage('用户姓名不能为空');
      return;
    }
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
    if (orderForm.age === '' || orderForm.height === '' || orderForm.weight === '') {
      setMessage('请填写年龄、身高和体重');
      return;
    }
    if (orderForm.usageCount === '' || orderForm.usageCount < 1) {
      setMessage('请填写有效的使用次数');
      return;
    }

    const payload: TeacherOrderPayload = {
      ...orderForm,
      age: orderForm.age,
      height: orderForm.height,
      weight: orderForm.weight,
      usageCount: orderForm.usageCount,
      merchantId: orderMerchantId,
      projectName: selectedProject,
    };

    const result = await createTeacherOrder(payload);
    if (String(result.code) !== '200' && String(result.code) !== '0') {
      setMessage(result.msg || '下单失败');
      return;
    }

    const createdMsg =
      result.data?.newUserCreated && result.data.initialPassword
        ? `下单成功，已自动创建用户，初始密码：${result.data.initialPassword}`
        : '下单成功';
    setShowOrderDetail(false);
    setSelectedProject('');
    setSelectedCategory('');
    setOrderForm(defaultOrderForm);
    setMessage(createdMsg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualRefresh = async (deviceId: string) => {
    setRefreshingDeviceId(deviceId);
    try {
      const result = await manualRefreshDevice(Number(deviceId));
      if (String(result.code) === '200' || String(result.code) === '0') {
        setMessage('时间已清零，可重新下单');
      } else {
        setMessage(result.msg || '时间清零失败');
      }
    } catch {
      setMessage('时间清零失败');
    } finally {
      setRefreshingDeviceId('');
    }
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
      <TopToast message={message} />

      <div className="grid grid-cols-3 gap-2 mb-4 rounded-2xl bg-white p-2 border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setActiveTab('devices');
            setMessage('');
          }}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'devices' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
          }`}
        >
          名下设备
        </button>
        <button
          type="button"
          onClick={async () => {
            setActiveTab('records');
            setMessage('');
            await loadConsumeRecords({ pageNo: 1 });
          }}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'records' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
          }`}
        >
          消耗记录
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('order');
            setMessage('');
          }}
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-800 font-medium">{device.deviceName}</p>
                    <p className="text-xs text-slate-500 mt-1">设备编号：{device.deviceId}</p>
                    <p className="text-xs text-slate-500 mt-1">免费到期时间：{formatDateTime(device.freeExpireAt)}</p>
                    <p className="text-xs text-slate-600 mt-2">免费期使用：{device.deviceFreeUsageCount}</p>
                    <p className="text-xs text-slate-600 mt-1">非免费期使用：{device.deviceNonFreeUsageCount}</p>
                  </div>
                  <button
                    type="button"
                    disabled={refreshingDeviceId === device.deviceId}
                    onClick={() => {
                      void handleManualRefresh(device.deviceId);
                    }}
                    className="shrink-0 whitespace-nowrap rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-40"
                  >
                    {refreshingDeviceId === device.deviceId ? '清零中...' : '时间清零'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={consumeDeviceFilterId}
              onChange={async (e) => {
                await loadConsumeRecords({ deviceId: e.target.value, pageNo: 1 });
              }}
              className="w-full shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 sm:w-40"
            >
              <option value="">全部设备</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.deviceName}
                </option>
              ))}
            </select>
            <div className="flex min-w-0 gap-2 sm:flex-1">
              <input
                value={consumeSearchPhone}
                onChange={(e) => setConsumeSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="按手机号搜索"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
              <button
                type="button"
                onClick={async () => {
                  await loadConsumeRecords({ pageNo: 1, phone: consumeSearchPhone });
                }}
                className="shrink-0 whitespace-nowrap rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                搜索
              </button>
            </div>
          </div>
          {consumeRecords.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8">暂无订单消耗记录</div>
          ) : (
            <div>
              <div className="md:hidden p-3 space-y-3">
                {consumeRecords.map((record) => (
                  <div key={record.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-600">项目：{record.projectName}</p>
                    <p className="text-xs text-slate-600 mt-1">用户：{record.userPhone}</p>
                    <p className="text-xs text-slate-600 mt-1">设备：{record.deviceName}</p>
                    <p className="text-xs text-slate-500 mt-1">下单时间：{formatDateTime(record.usedAt)}</p>
                    <p className="text-xs text-slate-500 mt-1">免费使用：{formatFreeUsage(record.freeUsage)}</p>
                  </div>
                ))}
              </div>

              <div className="hidden md:block max-h-96 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">下单时间</th>
                      <th className="px-3 py-2 text-left font-medium">用户手机号</th>
                      <th className="px-3 py-2 text-left font-medium">项目</th>
                      <th className="px-3 py-2 text-left font-medium">设备</th>
                      <th className="px-3 py-2 text-left font-medium">免费使用</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumeRecords.map((record) => (
                      <tr key={record.id} className="border-t border-slate-100 text-slate-700">
                        <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(record.usedAt)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{record.userPhone}</td>
                        <td className="px-3 py-2">{record.projectName}</td>
                        <td className="px-3 py-2">{record.deviceName}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatFreeUsage(record.freeUsage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between text-xs text-slate-600">
                <span>第 {consumePageNo} / {consumeTotalPages} 页，共 {consumeTotal} 条</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={consumePageNo <= 1}
                    onClick={async () => {
                      await loadConsumeRecords({ pageNo: Math.max(1, consumePageNo - 1) });
                    }}
                    className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
                  >
                    上一页
                  </button>
                  <button
                    type="button"
                    disabled={consumePageNo >= consumeTotalPages}
                    onClick={async () => {
                      await loadConsumeRecords({ pageNo: Math.min(consumeTotalPages, consumePageNo + 1) });
                    }}
                    className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'order' && (
        <div className="space-y-3">
          {!showOrderDetail ? (
            visibleProjectCategories.map((category) => (
              <div key={category.categoryName} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-800">{category.categoryName}</p>
                  <span className="text-xs text-slate-400">{category.projects.length} 个项目</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {category.projects.map((project) => (
                    <button
                      key={project.code}
                      type="button"
                      onClick={() => {
                        setSelectedProject(project.name);
                        setSelectedCategory(category.categoryName);
                        setOrderForm((prev) => ({ ...prev, durationMinutes: 45, usageCount: 1 }));
                        setShowOrderDetail(true);
                        setMessage('');
                      }}
                      className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-2 py-2 text-xs text-slate-700 hover:border-orange-200 hover:text-orange-700 hover:from-orange-50 hover:to-orange-50 transition-all"
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
              <p className="text-base font-semibold text-slate-800">下单详情</p>

              <label className="block text-xs text-slate-500 mb-1">用户姓名</label>
              <input
                value={orderForm.name}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, name: e.target.value.trimStart() }))}
                placeholder="请输入用户姓名"
                maxLength={32}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />

              <label className="block text-xs text-slate-500 mb-1">手机号</label>
              <input
                value={orderForm.phone}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                placeholder="请输入手机号"
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
                  value={orderForm.age === '' ? '' : orderForm.age}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, age: parseBodyMetric(e.target.value) }))}
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
                  value={orderForm.height === '' ? '' : orderForm.height}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, height: parseBodyMetric(e.target.value) }))}
                  placeholder="身高(cm)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">体重(kg)</label>
                <input
                  type="number"
                  value={orderForm.weight === '' ? '' : orderForm.weight}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, weight: parseBodyMetric(e.target.value) }))}
                  placeholder="体重(kg)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
                </div>
              </div>

              <label className="block text-xs text-slate-500 mb-1">运动表现</label>
              <select
                value={orderForm.exercisePerformance}
                onChange={(e) =>
                  setOrderForm((prev) => ({
                    ...prev,
                    exercisePerformance: Number(e.target.value) as 0 | 1 | 2,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                <option value={0}>经常运动</option>
                <option value={1}>偶尔运动</option>
                <option value={2}>从未运动</option>
              </select>

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
                readOnly={isFixedDurationCategory(selectedCategory)}
                onChange={(e) => {
                  if (isFixedDurationCategory(selectedCategory)) return;
                  setOrderForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) || 45 }));
                }}
                className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                  isFixedDurationCategory(selectedCategory)
                    ? 'border-orange-200 bg-orange-50 text-orange-800'
                    : 'border-slate-200'
                }`}
              />

              <label className="block text-xs text-slate-500 mb-1">使用次数</label>
              <input
                type="text"
                inputMode="numeric"
                value={orderForm.usageCount === '' ? '' : orderForm.usageCount}
                onChange={(e) =>
                  setOrderForm((prev) => ({
                    ...prev,
                    usageCount: parseUsageCountInput(e.target.value),
                  }))
                }
                placeholder="请输入使用次数"
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
                  onClick={() => {
                    setShowOrderDetail(false);
                    setSelectedCategory('');
                  }}
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
