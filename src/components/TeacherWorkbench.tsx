import { useEffect, useMemo, useRef, useState } from 'react';
import {
  bindTeacherDevice,
  createTeacherOrder,
  getMerchantsAndDevices,
  getProjectCategories,
  getTeacherBindings,
  Merchant,
  ProjectCategory,
  TeacherBinding,
  TeacherOrderPayload,
} from '../lib/api';

type TeacherTab = 'order' | 'bind' | 'bound';

const defaultOrderForm: Omit<TeacherOrderPayload, 'merchantId' | 'projectName'> = {
  phone: '',
  gender: '女',
  age: 25,
  height: 165,
  weight: 52,
  durationMinutes: 45,
};

export default function TeacherWorkbench() {
  const orderMerchantDropdownRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<TeacherTab>('order');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
  const [bindings, setBindings] = useState<TeacherBinding[]>([]);

  const [merchantKeyword, setMerchantKeyword] = useState('');
  const [orderMerchantKeyword, setOrderMerchantKeyword] = useState('');
  const [showOrderMerchantDropdown, setShowOrderMerchantDropdown] = useState(false);
  const [orderMerchantId, setOrderMerchantId] = useState('');
  const [bindMerchantId, setBindMerchantId] = useState('');
  const [bindDeviceId, setBindDeviceId] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [orderForm, setOrderForm] = useState(defaultOrderForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const filteredMerchants = useMemo(() => {
    const keyword = merchantKeyword.trim();
    if (!keyword) return merchants;
    return merchants.filter((item) => item.name.includes(keyword));
  }, [merchants, merchantKeyword]);
  const filteredOrderMerchants = useMemo(() => {
    const keyword = orderMerchantKeyword.trim();
    if (!keyword) return merchants;
    return merchants.filter((item) => item.name.includes(keyword));
  }, [merchants, orderMerchantKeyword]);

  const bindSelectedMerchant = useMemo(
    () => merchants.find((item) => item.id === bindMerchantId),
    [merchants, bindMerchantId]
  );
  const selectedOrderMerchantName = useMemo(
    () => merchants.find((item) => item.id === orderMerchantId)?.name || '请选择商家',
    [merchants, orderMerchantId]
  );

  useEffect(() => {
    const loadTeacherData = async () => {
      setLoading(true);
      try {
        const [merchantRes, projectRes, bindingRes] = await Promise.all([
          getMerchantsAndDevices(),
          getProjectCategories(),
          getTeacherBindings(),
        ]);

        if (String(merchantRes.code) === '200') {
          setMerchants(merchantRes.data);
          const firstMerchantId = merchantRes.data[0]?.id || '';
          setOrderMerchantId(firstMerchantId);
          setBindMerchantId(firstMerchantId);
          setBindDeviceId(merchantRes.data[0]?.devices[0]?.id || '');
        } else {
          setMessage(merchantRes.msg || '获取商家失败');
        }

        if (String(projectRes.code) === '200') {
          setProjectCategories(projectRes.data);
        } else {
          setMessage(projectRes.msg || '获取项目失败');
        }

        if (String(bindingRes.code) === '200') {
          setBindings(bindingRes.data);
        } else {
          setMessage(bindingRes.msg || '获取绑定信息失败');
        }
      } catch {
        setMessage('加载老师功能数据失败');
      } finally {
        setLoading(false);
      }
    };

    void loadTeacherData();
  }, []);

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

  const onBindMerchantChange = (merchantId: string) => {
    setBindMerchantId(merchantId);
    const merchant = merchants.find((item) => item.id === merchantId);
    setBindDeviceId(merchant?.devices[0]?.id || '');
  };

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
    if (String(result.code) !== '200') {
      setMessage(result.msg || '下单失败');
      return;
    }

    setMessage(result.msg || '下单成功');
    setShowOrderDetail(false);
    setSelectedProject('');
    setOrderForm(defaultOrderForm);
  };

  const handleBindDevice = async () => {
    if (!bindMerchantId || !bindDeviceId) {
      setMessage('请选择商家和设备');
      return;
    }

    const result = await bindTeacherDevice({
      merchantId: bindMerchantId,
      deviceId: bindDeviceId,
    });
    setMessage(result.msg || '绑定结果未知');
    if (String(result.code) !== '200') return;

    const bindingsRes = await getTeacherBindings();
    if (String(bindingsRes.code) === '200') {
      setBindings(bindingsRes.data);
    }
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
          onClick={() => setActiveTab('order')}
          className={`rounded-xl py-2 text-sm font-medium transition-all ${
            activeTab === 'order'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          下单功能
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bind')}
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
          onClick={() => setActiveTab('bound')}
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
                      key={project}
                      type="button"
                      onClick={() => {
                        setSelectedProject(project);
                        setShowOrderDetail(true);
                        setMessage('');
                      }}
                      className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-2 py-2 text-xs text-slate-700 hover:border-blue-200 hover:text-blue-700 hover:from-blue-50 hover:to-blue-50 transition-all"
                    >
                      {project}
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
          <input
            value={merchantKeyword}
            onChange={(e) => setMerchantKeyword(e.target.value)}
            placeholder="搜索商家"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <select
            value={bindMerchantId}
            onChange={(e) => onBindMerchantChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {filteredMerchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.name}
              </option>
            ))}
          </select>
          <select
            value={bindDeviceId}
            onChange={(e) => setBindDeviceId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {bindSelectedMerchant?.devices.map((device) => (
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
          {bindings.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-2xl border border-slate-200">
              暂无绑定信息
            </div>
          ) : (
            bindings.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <p className="text-sm text-slate-800 font-medium">{item.merchantName}</p>
                <p className="text-sm text-slate-700 mt-1">{item.deviceName}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>ID: {item.deviceId}</span>
                  <span>{item.boundAt}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
