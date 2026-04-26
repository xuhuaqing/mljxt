import { useEffect, useMemo, useRef, useState } from 'react';
import {
  bindTeacherDevice,
  createTeacherOrder,
  getDevicesByMerchantId,
  getMerchantOptions,
  getTeacherDeviceUsageLogs,
  getProjectCategories,
  getTeacherBindings,
  MerchantDevice,
  MerchantOption,
  ProjectCategory,
  TeacherBinding,
  TeacherOrderPayload,
  UsageRecord,
} from '../lib/api';

type TeacherTab = 'order' | 'bind' | 'bound';

function formatDateTime(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

const defaultOrderForm: Omit<TeacherOrderPayload, 'merchantId' | 'projectName'> = {
  phone: '',
  gender: '女',
  age: 25,
  height: 165,
  weight: 52,
  usageCount: 1,
  exercisePerformance: 0,
  durationMinutes: 45,
};

export default function TeacherWorkbench() {
  const teacherId = Number(window.localStorage.getItem('currentUserId') || 0);
  const orderMerchantDropdownRef = useRef<HTMLDivElement | null>(null);
  const bindMerchantDropdownRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<TeacherTab>('order');
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
  const [bindings, setBindings] = useState<TeacherBinding[]>([]);

  const [orderMerchantKeyword, setOrderMerchantKeyword] = useState('');
  const [showOrderMerchantDropdown, setShowOrderMerchantDropdown] = useState(false);
  const [bindMerchantKeyword, setBindMerchantKeyword] = useState('');
  const [showBindMerchantDropdown, setShowBindMerchantDropdown] = useState(false);
  const [boundMerchantFilterId, setBoundMerchantFilterId] = useState('');
  const [orderMerchantOptions, setOrderMerchantOptions] = useState<MerchantOption[]>([]);
  const [bindMerchantOptions, setBindMerchantOptions] = useState<MerchantOption[]>([]);
  const [orderMerchantId, setOrderMerchantId] = useState('');
  const [bindMerchantId, setBindMerchantId] = useState('');
  const [bindDeviceId, setBindDeviceId] = useState('');
  const [bindDevices, setBindDevices] = useState<MerchantDevice[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [orderForm, setOrderForm] = useState(defaultOrderForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeBindingId, setActiveBindingId] = useState('');
  const [usageLogsByDevice, setUsageLogsByDevice] = useState<Record<string, UsageRecord[]>>({});
  const [usageLogsLoadingDeviceId, setUsageLogsLoadingDeviceId] = useState('');

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const filteredOrderMerchants = useMemo(() => orderMerchantOptions, [orderMerchantOptions]);
  const filteredBindMerchants = useMemo(() => bindMerchantOptions, [bindMerchantOptions]);

  const selectedOrderMerchantName = useMemo(
    () =>
      orderMerchantOptions.find((item) => item.id === orderMerchantId)?.name ||
      '请选择商家',
    [orderMerchantOptions, orderMerchantId]
  );
  const selectedBindMerchantName = useMemo(
    () =>
      bindMerchantOptions.find((item) => item.id === bindMerchantId)?.name ||
      '请选择商家',
    [bindMerchantOptions, bindMerchantId]
  );

  useEffect(() => {
    const loadTeacherData = async () => {
      setLoading(true);
      try {
        const [merchantOptionsResult, projectResult, bindingResult] = await Promise.allSettled([
          getMerchantOptions(),
          getProjectCategories(),
          getTeacherBindings(teacherId),
        ]);

        let merchantOptionLoaded = false;

        if (merchantOptionsResult.status === 'fulfilled') {
          const optionRes = merchantOptionsResult.value;
          if (String(optionRes.code) === '0' || String(optionRes.code) === '200') {
            merchantOptionLoaded = true;
            setOrderMerchantOptions(optionRes.data);
            setBindMerchantOptions(optionRes.data);
            const firstMerchantId = optionRes.data[0]?.id || '';
            if (firstMerchantId) {
              setOrderMerchantId(firstMerchantId);
              setBindMerchantId(firstMerchantId);
            }
          }
        }

        if (!merchantOptionLoaded) {
          setMessage('获取商家下拉失败');
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

        if (bindingResult.status === 'fulfilled') {
          const bindingRes = bindingResult.value;
          if (String(bindingRes.code) === '200' || String(bindingRes.code) === '0') {
            setBindings(bindingRes.data);
          } else {
            setMessage(bindingRes.msg || '获取绑定信息失败');
          }
        } else {
          setMessage('获取绑定信息失败');
        }
      } catch {
        setMessage('加载老师功能数据失败');
      } finally {
        setLoading(false);
      }
    };

    void loadTeacherData();
  }, [teacherId]);

  useEffect(() => {
    if (!showOrderMerchantDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!orderMerchantDropdownRef.current?.contains(target)) {
        setShowOrderMerchantDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOrderMerchantDropdown]);

  useEffect(() => {
    if (!showBindMerchantDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!bindMerchantDropdownRef.current?.contains(target)) {
        setShowBindMerchantDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBindMerchantDropdown]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const optionRes = await getMerchantOptions(orderMerchantKeyword);
        if (String(optionRes.code) === '0' || String(optionRes.code) === '200') {
          setOrderMerchantOptions(optionRes.data);
        } else {
          setMessage(optionRes.msg || '获取商家下拉失败');
        }
      } catch {
        setMessage('获取商家下拉失败，请检查网络或接口地址');
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [orderMerchantKeyword]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const optionRes = await getMerchantOptions(bindMerchantKeyword);
        if (String(optionRes.code) === '0' || String(optionRes.code) === '200') {
          setBindMerchantOptions(optionRes.data);
        } else {
          setMessage(optionRes.msg || '获取商家下拉失败');
        }
      } catch {
        setMessage('获取商家下拉失败，请检查网络或接口地址');
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [bindMerchantKeyword]);

  useEffect(() => {
    if (!showOrderMerchantDropdown) return;
    void (async () => {
      try {
        const optionRes = await getMerchantOptions(orderMerchantKeyword);
        if (String(optionRes.code) === '0' || String(optionRes.code) === '200') {
          setOrderMerchantOptions(optionRes.data);
        } else {
          setMessage(optionRes.msg || '获取商家下拉失败');
        }
      } catch {
        setMessage('获取商家下拉失败，请检查网络或接口地址');
      }
    })();
  }, [showOrderMerchantDropdown, orderMerchantKeyword]);

  useEffect(() => {
    if (!showBindMerchantDropdown) return;
    void (async () => {
      try {
        const optionRes = await getMerchantOptions(bindMerchantKeyword);
        if (String(optionRes.code) === '0' || String(optionRes.code) === '200') {
          setBindMerchantOptions(optionRes.data);
        } else {
          setMessage(optionRes.msg || '获取商家下拉失败');
        }
      } catch {
        setMessage('获取商家下拉失败，请检查网络或接口地址');
      }
    })();
  }, [showBindMerchantDropdown, bindMerchantKeyword]);

  const onBindMerchantChange = (merchantId: string) => {
    setBindMerchantId(merchantId);
    setBindDeviceId('');
  };

  const loadTeacherBindings = async (merchantId?: number) => {
    if (!teacherId || teacherId <= 0) {
      setMessage('未获取到老师ID，请重新登录');
      return;
    }
    const bindingsRes = await getTeacherBindings(teacherId, merchantId);
    if (String(bindingsRes.code) === '200' || String(bindingsRes.code) === '0') {
      setBindings(bindingsRes.data);
    } else {
      setMessage(bindingsRes.msg || '获取绑定信息失败');
    }
  };

  useEffect(() => {
    if (!bindMerchantId) {
      setBindDevices([]);
      setBindDeviceId('');
      return;
    }

    void (async () => {
      try {
        const deviceRes = await getDevicesByMerchantId(bindMerchantId);
        if (String(deviceRes.code) === '0' || String(deviceRes.code) === '200') {
          setBindDevices(deviceRes.data);
          setBindDeviceId(deviceRes.data[0]?.id || '');
          if (deviceRes.data.length === 0) {
            setMessage('该商家暂无设备');
          }
        } else {
          setBindDevices([]);
          setBindDeviceId('');
          setMessage(deviceRes.msg || '获取设备列表失败');
        }
      } catch {
        setBindDevices([]);
        setBindDeviceId('');
        setMessage('获取设备列表失败，请检查网络或接口地址');
      }
    })();
  }, [bindMerchantId]);

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
      setMessage('请选择商家');
      return;
    }

    const payload: TeacherOrderPayload = {
      ...orderForm,
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
        : result.msg || '下单成功';
    setMessage(createdMsg);
    setShowOrderDetail(false);
    setSelectedProject('');
    setOrderForm(defaultOrderForm);
  };

  const handleBindDevice = async () => {
    if (!bindMerchantId || !bindDeviceId) {
      setMessage('请选择商家和设备');
      return;
    }

    if (!teacherId || teacherId <= 0) {
      setMessage('未获取到老师ID，请重新登录');
      return;
    }

    const result = await bindTeacherDevice({
      teacherId,
      merchantId: Number(bindMerchantId),
      deviceId: Number(bindDeviceId),
    });
    if (String(result.code) !== '200' && String(result.code) !== '0') {
      setMessage(result.msg || '绑定失败');
      return;
    }
    setMessage(result.data?.alreadyBound ? '该设备已绑定，请勿重复绑定' : '绑定成功');

    await loadTeacherBindings();
  };

  const handleToggleBindingLogs = async (binding: TeacherBinding) => {
    if (activeBindingId === binding.id) {
      setActiveBindingId('');
      return;
    }
    setActiveBindingId(binding.id);

    if (usageLogsByDevice[binding.deviceId]) {
      return;
    }

    setUsageLogsLoadingDeviceId(binding.deviceId);
    const logsRes = await getTeacherDeviceUsageLogs(binding.deviceId);
    if (String(logsRes.code) === '200') {
      setUsageLogsByDevice((prev) => ({
        ...prev,
        [binding.deviceId]: logsRes.data,
      }));
    } else {
      setMessage(logsRes.msg || '获取使用流水失败');
    }
    setUsageLogsLoadingDeviceId('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 py-3">
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-4 text-white shadow-sm">
        <h2 className="text-lg font-semibold mt-1">老师工作台</h2>
        <p className="text-xs text-blue-100 mt-1">下单、设备绑定、绑定信息统一管理</p>
      </div>
      {loading && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          数据加载中...
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4 rounded-2xl bg-white p-2 border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setActiveTab('order');
            setMessage('');
          }}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'order'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          下单
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('bind');
            setMessage('');
          }}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'bind'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          绑定设备
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('bound');
            setMessage('');
          }}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'bound'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          已绑定信息
        </button>
      </div>

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
                      key={project.code}
                      type="button"
                      onClick={() => {
                        setSelectedProject(project.name);
                        setShowOrderDetail(true);
                        setMessage('');
                      }}
                      className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-2 py-2 text-xs text-slate-700 hover:border-blue-200 hover:text-blue-700 hover:from-blue-50 hover:to-blue-50 transition-all"
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-800">下单详情</p>
              </div>

              <label className="block text-xs text-slate-500 mb-1">下单用户手机号</label>
              <input
                value={orderForm.phone}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                placeholder="下单用户手机号"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">性别</label>
                <select
                  value={orderForm.gender}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, gender: e.target.value as '男' | '女' }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">体重(kg)</label>
                <input
                  type="number"
                  value={orderForm.weight}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, weight: Number(e.target.value) || 0 }))}
                  placeholder="体重(kg)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value={0}>经常运动</option>
                <option value={1}>偶尔运动</option>
                <option value={2}>从未运动</option>
              </select>

              <label className="block text-xs text-slate-500 mb-1">项目名称</label>
              <input
                value={selectedProject}
                readOnly
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 font-medium"
              />

              <label className="block text-xs text-slate-500 mb-1">项目时长(分钟)</label>
              <input
                type="number"
                value={orderForm.durationMinutes}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) || 45 }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />

              <label className="block text-xs text-slate-500 mb-1">使用次数</label>
              <input
                type="number"
                min={1}
                value={orderForm.usageCount}
                onChange={(e) =>
                  setOrderForm((prev) => ({
                    ...prev,
                    usageCount: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />

              <label className="block text-xs text-slate-500 mb-1">选择商家</label>
              <div className="relative" ref={orderMerchantDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowOrderMerchantDropdown((prev) => !prev)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {selectedOrderMerchantName}
                </button>
                {showOrderMerchantDropdown && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-2">
                    <input
                      value={orderMerchantKeyword}
                      onChange={(e) => setOrderMerchantKeyword(e.target.value)}
                      placeholder="搜索商家"
                      className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <div className="max-h-40 overflow-auto space-y-1">
                      {filteredOrderMerchants.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-slate-400">未找到匹配商家</div>
                      ) : (
                        filteredOrderMerchants.map((merchant) => (
                          <button
                            key={merchant.id}
                            type="button"
                            onClick={() => {
                              setOrderMerchantId(merchant.id);
                              setShowOrderMerchantDropdown(false);
                            }}
                            className={`w-full rounded-lg px-2 py-2 text-left text-sm transition-all ${
                              merchant.id === orderMerchantId
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {merchant.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                  className="rounded-xl py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                >
                  提交下单
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bind' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
          <div className="relative" ref={bindMerchantDropdownRef}>
            <button
              type="button"
              onClick={() => setShowBindMerchantDropdown((prev) => !prev)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {selectedBindMerchantName}
            </button>
            {showBindMerchantDropdown && (
              <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-2">
                <input
                  value={bindMerchantKeyword}
                  onChange={(e) => setBindMerchantKeyword(e.target.value)}
                  placeholder="搜索商家"
                  className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <div className="max-h-40 overflow-auto space-y-1">
                  {filteredBindMerchants.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-slate-400">未找到匹配商家</div>
                  ) : (
                    filteredBindMerchants.map((merchant) => (
                      <button
                        key={merchant.id}
                        type="button"
                        onClick={() => {
                          onBindMerchantChange(merchant.id);
                          setShowBindMerchantDropdown(false);
                        }}
                        className={`w-full rounded-lg px-2 py-2 text-left text-sm transition-all ${
                          merchant.id === bindMerchantId
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {merchant.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <select
            value={bindDeviceId}
            onChange={(e) => setBindDeviceId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {bindDevices.length === 0 && <option value="">暂无可选设备</option>}
            {bindDevices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleBindDevice}
            className="w-full rounded-xl py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            绑定设备
          </button>
        </div>
      )}

      {activeTab === 'bound' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-slate-500">按商家筛选</label>
              <button
                type="button"
                onClick={async () => {
                  if (!boundMerchantFilterId) {
                    await loadTeacherBindings();
                    return;
                  }
                  await loadTeacherBindings(Number(boundMerchantFilterId));
                }}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                刷新
              </button>
            </div>
            <select
              value={boundMerchantFilterId}
              onChange={async (e) => {
                const merchantId = e.target.value;
                setBoundMerchantFilterId(merchantId);
                if (!merchantId) {
                  await loadTeacherBindings();
                  return;
                }
                await loadTeacherBindings(Number(merchantId));
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">全部商家</option>
              {bindMerchantOptions.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </div>
          {bindings.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-2xl border border-slate-200">
              暂无绑定信息
            </div>
          ) : (
            bindings.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleToggleBindingLogs(item)}
                  className="w-full text-left"
                >
                  <p className="text-sm text-slate-800 font-medium">{item.merchantName}</p>
                  <p className="text-sm text-slate-700 mt-1">{item.deviceName}</p>
                  <p className="mt-2 text-xs text-slate-600">使用次数：{item.usageCount}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>ID: {item.deviceId}</span>
                    <span>{formatDateTime(item.boundAt)}</span>
                  </div>
                </button>

                {activeBindingId === item.id && (
                  <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                      使用流水记录
                    </div>
                    {usageLogsLoadingDeviceId === item.deviceId ? (
                      <div className="px-3 py-4 text-xs text-slate-500">加载中...</div>
                    ) : (usageLogsByDevice[item.deviceId]?.length ?? 0) === 0 ? (
                      <div className="px-3 py-4 text-xs text-slate-500">暂无流水记录</div>
                    ) : (
                      <div className="max-h-52 overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">时间</th>
                              <th className="px-3 py-2 text-left font-medium">用户手机号</th>
                              <th className="px-3 py-2 text-left font-medium">项目</th>
                              <th className="px-3 py-2 text-left font-medium">商家</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(usageLogsByDevice[item.deviceId] || []).map((log) => (
                              <tr key={log.id} className="border-t border-slate-100 text-slate-700">
                                <td className="px-3 py-2 whitespace-nowrap">{log.usedAt}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{log.userPhone}</td>
                                <td className="px-3 py-2">{log.projectName}</td>
                                <td className="px-3 py-2">{log.merchantName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
