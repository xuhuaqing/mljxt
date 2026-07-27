import { formatDateTime } from './formatDateTime';
import { UserRole } from './supabase';

export interface ApiResponse<T> {
  code: string | number;
  msg: string;
  data: T;
}

export interface LoginPayload {
  phone: string;
  password: string;
  role: number;
}

export interface MerchantDevice {
  id: string;
  name: string;
  machineNo?: string;
}

interface MerchantDeviceByMerchantRaw {
  id: number;
  machineNo: string;
  deviceName: string;
  status: 0 | 1;
  merchantId: number;
  freeUseDeadline: string | null;
  deviceUsageCount?: number;
  deviceFreeUsageCount?: number;
  deviceNonFreeUsageCount?: number;
}

interface DeveloperBoundDeviceRaw {
  bindId: number;
  developerId: number;
  merchantId: number;
  merchantName: string;
  merchantPhone: string;
  remainingUseCount: number;
  merchantTotalDeviceUsageCount?: number;
  deviceUsageCount?: number;
  deviceFreeUsageCount?: number;
  deviceNonFreeUsageCount?: number;
  deviceId: number;
  machineNo: string;
  deviceName: string;
  deviceStatus: 0 | 1;
  freeUseDeadline: string | null;
  bindTime: string;
}

export interface Merchant {
  id: string;
  name: string;
  devices: MerchantDevice[];
}

export interface MerchantOption {
  id: string;
  name: string;
}

export interface UserOrder {
  id: string;
  merchantId: string;
  merchantName: string;
  projectName: string;
  totalCount: number;
  remainingCount: number;
}

export interface UsageRecord {
  id: string;
  orderId: string;
  userPhone: string;
  merchantName: string;
  projectName: string;
  deviceId: string;
  deviceName: string;
  usedAt: string;
  freeUsage?: boolean;
}

interface UsageRecordQueryRaw {
  orderId: number;
  userId: number;
  userPhone?: string;
  phone?: string;
  merchantId: number;
  deviceId?: number | string;
  machineNo?: string;
  deviceName: string | null;
  projectName: string;
  projectDuration: number;
  usageCount: number;
  sportPerformance: number;
  createdAt: string;
  freeUsage?: boolean;
}

export interface ProjectCategory {
  categoryName: string;
  projects: ProjectItem[];
}

export interface ProjectItem {
  code: number;
  codeHex: string;
  name: string;
}

export interface TeacherOrderPayload {
  phone: string;
  name: string;
  gender: '男' | '女';
  age: number;
  height: number;
  weight: number;
  usageCount: number;
  exercisePerformance: 0 | 1 | 2;
  projectName: string;
  durationMinutes: number;
  merchantId: string;
}

export type CustomTeacherOrderPayload = Omit<TeacherOrderPayload, 'projectName'> & {
  deviceId?: string;
};

export interface CreateOrderResult {
  orderId: number;
  userId: number;
  phone: string;
  merchantId: number;
  projectName: string;
  projectDuration: number;
  usageCount: number;
  newUserCreated: boolean;
  initialPassword: string | null;
}

export interface TeacherBinding {
  id: string;
  merchantId: string;
  merchantName: string;
  deviceId: string;
  deviceName: string;
  usageCount: number;
  boundAt: string;
}

interface TeacherBoundDeviceRaw {
  bindId: number;
  teacherId: number;
  merchantId: number;
  merchantName: string;
  deviceId: number;
  machineNo: string;
  deviceName: string;
  deviceStatus: 0 | 1;
  freeUseDeadline: string | null;
  bindTime: string;
}

interface OrderUsageRecordRaw {
  id?: number | string;
  orderId?: number | string;
  userPhone?: string;
  phone?: string;
  userName?: string;
  username?: string;
  nickName?: string;
  merchantName?: string;
  projectName?: string;
  deviceId?: number | string;
  machineNo?: string;
  deviceName?: string;
  createdAt?: string;
  createTime?: string;
  usedAt?: string;
  freeUsage?: boolean;
}

interface OrderUsageRecordPageData {
  records?: OrderUsageRecordRaw[];
  list?: OrderUsageRecordRaw[];
  items?: OrderUsageRecordRaw[];
  content?: OrderUsageRecordRaw[];
  total?: number;
  totalCount?: number;
  pageNo?: number;
  pageNum?: number;
  pageSize?: number;
  size?: number;
}

export interface MerchantDeviceSummary {
  deviceId: string;
  deviceName: string;
  freeExpireAt: string;
  deviceFreeUsageCount: number;
  deviceNonFreeUsageCount: number;
}

export interface DeveloperDeviceSummary extends MerchantDeviceSummary {
  merchantId: string;
  merchantName: string;
  merchantUsageCount: number;
  deviceUsageCount: number;
}

export interface WithdrawRecord {
  id: string;
  clickedAt: string;
  usageCount: number;
}

interface CreateWithdrawRaw {
  withdrawRecordId: number;
  developerId: number;
  usageCountSnapshot: number;
  createdAt: string;
}

interface WithdrawRecordPageRaw {
  total: number;
  pageNo: number;
  pageSize: number;
  records: CreateWithdrawRaw[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mljxt.1mmkj.com';
// 是否使用mock数据
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

const mockUsers = [
  { phone: '17612714215', password: '123456' },
];

const mockMerchants: Merchant[] = [
  {
    id: 'm1',
    name: '美丽门店A',
    devices: [
      { id: 'dev-a-01', name: '超声美容仪A01' },
      { id: 'dev-a-02', name: '射频美容仪A02' },
    ],
  },
  {
    id: 'm2',
    name: '美丽门店B',
    devices: [
      { id: 'dev-b-01', name: '光子美容仪B01' },
      { id: 'dev-b-02', name: '微电流美容仪B02' },
    ],
  },
];

let mockOrders: UserOrder[] = [
  {
    id: 'o1',
    merchantId: 'm1',
    merchantName: '美丽门店A',
    projectName: '补水焕肤',
    totalCount: 10,
    remainingCount: 6,
  },
  {
    id: 'o2',
    merchantId: 'm1',
    merchantName: '美丽门店A',
    projectName: '紧致提升',
    totalCount: 8,
    remainingCount: 3,
  },
  {
    id: 'o3',
    merchantId: 'm2',
    merchantName: '美丽门店B',
    projectName: '深层清洁',
    totalCount: 12,
    remainingCount: 12,
  },
];

let mockUsageRecords: UsageRecord[] = [
  {
    id: 'u1',
    orderId: 'o1',
    userPhone: '17612714215',
    merchantName: '美丽门店A',
    projectName: '补水焕肤',
    deviceId: 'dev-a-01',
    deviceName: '超声美容仪A01',
    usedAt: '2026/04/18 10:30:00',
    freeUsage: true,
  },
  {
    id: 'u2',
    orderId: 'o2',
    userPhone: '17612714215',
    merchantName: '美丽门店A',
    projectName: '紧致提升',
    deviceId: 'dev-a-02',
    deviceName: '射频美容仪A02',
    usedAt: '2026/04/19 14:10:00',
    freeUsage: false,
  },
  {
    id: 'u3',
    orderId: 'o3',
    userPhone: '17612714215',
    merchantName: '美丽门店B',
    projectName: '深层清洁',
    deviceId: 'dev-b-01',
    deviceName: '光子美容仪B01',
    usedAt: '2026/04/20 16:45:00',
    freeUsage: false,
  },
];

const mockProjectCategories: ProjectCategory[] = [
  {
    categoryName: '日常训练',
    projects: [
      { code: 1, codeHex: '0x01', name: '肩颈深度解压' },
      { code: 2, codeHex: '0x02', name: '背脊通衡养护' },
      { code: 3, codeHex: '0x03', name: '腰骶温养呵护' },
      { code: 4, codeHex: '0x04', name: '胸肋呼吸舒展' },
      { code: 5, codeHex: '0x05', name: '腹区温蕴舒压' },
      { code: 6, codeHex: '0x06', name: '臀腿活力焕新' },
      { code: 7, codeHex: '0x07', name: '小腿轻盈舒缓' },
      { code: 8, codeHex: '0x08', name: '足踝稳泰调理' },
      { code: 9, codeHex: '0x09', name: '上臂肱桡释能' },
      { code: 10, codeHex: '0x0A', name: '前臂腕指松解' },
    ],
  },
  {
    categoryName: '塑形紧致',
    projects: [
      { code: 11, codeHex: '0x0B', name: '直角肩养成' },
      { code: 12, codeHex: '0x0C', name: '天鹅臂精雕' },
      { code: 13, codeHex: '0x0D', name: '手臂纤细雕刻' },
      { code: 14, codeHex: '0x0E', name: '美背塑形' },
      { code: 15, codeHex: '0x0F', name: '腰际线精雕' },
      { code: 16, codeHex: '0x10', name: '马甲线雕刻' },
      { code: 17, codeHex: '0x11', name: '蜜桃臀塑造' },
      { code: 18, codeHex: '0x12', name: '大腿内侧紧致' },
      { code: 19, codeHex: '0x13', name: '小腿线条优化' },
      { code: 20, codeHex: '0x14', name: '跟腱显现雕刻' },
    ],
  },
  {
    categoryName: '运动表现',
    projects: [
      { code: 21, codeHex: '0x15', name: '力量重塑训练' },
      { code: 22, codeHex: '0x16', name: '爆发力激活训练' },
      { code: 23, codeHex: '0x17', name: '耐力强化训练' },
      { code: 24, codeHex: '0x18', name: '协调敏捷训练' },
      { code: 25, codeHex: '0x19', name: '稳定柔韧训练' },
    ],
  },
  {
    categoryName: '自定义',
    projects: [{ code: 0, codeHex: '0x00', name: '自定义选择' }],
  },
];

let mockTeacherBindings: TeacherBinding[] = [
  {
    id: 'tb1',
    merchantId: 'm1',
    merchantName: '美丽门店A',
    deviceId: 'dev-a-01',
    deviceName: '超声美容仪A01',
    usageCount: 18,
    boundAt: '2026/04/20 09:20:00',
  },
];

const mockMerchantOwnedDevices: MerchantDeviceSummary[] = [
  {
    deviceId: 'dev-a-01',
    deviceName: '超声美容仪A01',
    freeExpireAt: '2026/12/31',
    deviceFreeUsageCount: 45,
    deviceNonFreeUsageCount: 75,
  },
  {
    deviceId: 'dev-a-02',
    deviceName: '射频美容仪A02',
    freeExpireAt: '2026/10/15',
    deviceFreeUsageCount: 20,
    deviceNonFreeUsageCount: 46,
  },
];

const mockMerchantRemainingCount = 132;

const mockDeveloperDevices: DeveloperDeviceSummary[] = [
  {
    merchantId: 'm1',
    merchantName: '美丽门店A',
    deviceId: 'dev-a-01',
    deviceName: '超声美容仪A01',
    freeExpireAt: '2026/12/31',
    merchantUsageCount: 186,
    deviceUsageCount: 120,
    deviceFreeUsageCount: 45,
    deviceNonFreeUsageCount: 75,
  },
  {
    merchantId: 'm1',
    merchantName: '美丽门店A',
    deviceId: 'dev-a-02',
    deviceName: '射频美容仪A02',
    freeExpireAt: '2026/10/15',
    merchantUsageCount: 186,
    deviceUsageCount: 66,
    deviceFreeUsageCount: 20,
    deviceNonFreeUsageCount: 46,
  },
  {
    merchantId: 'm2',
    merchantName: '美丽门店B',
    deviceId: 'dev-b-01',
    deviceName: '光子美容仪B01',
    freeExpireAt: '2026/11/30',
    merchantUsageCount: 132,
    deviceUsageCount: 80,
    deviceFreeUsageCount: 30,
    deviceNonFreeUsageCount: 50,
  },
  {
    merchantId: 'm2',
    merchantName: '美丽门店B',
    deviceId: 'dev-b-02',
    deviceName: '微电流美容仪B02',
    freeExpireAt: '2026/09/08',
    merchantUsageCount: 132,
    deviceUsageCount: 52,
    deviceFreeUsageCount: 12,
    deviceNonFreeUsageCount: 40,
  },
];

const mockDeveloperRemainingCount = 318;
let mockWithdrawRecords: WithdrawRecord[] = [
  {
    id: 'w1',
    clickedAt: '2026/04/20 11:20:00',
    usageCount: 120,
  },
  {
    id: 'w2',
    clickedAt: '2026/04/21 17:35:00',
    usageCount: 168,
  },
];

export const roleCodeMap: Record<UserRole, number> = {
  user: 1,
  teacher: 2,
  merchant: 3,
  developer: 4,
};

async function mockLogin(payload: LoginPayload): Promise<ApiResponse<{ id: number; phone: string; role: number; roleName: string; remainingUseCount?: number } | null>> {
  const matched = mockUsers.some(
    (user) => user.phone === payload.phone && user.password === payload.password
  );

  if (matched) {
    const roleNameMap: Record<number, string> = {
      1: '用户',
      2: '老师',
      3: '商家',
      4: '合伙人',
    };
    return {
      code: '0',
      msg: 'success',
      data: {
        id: 1001,
        phone: payload.phone,
        role: payload.role,
        roleName: roleNameMap[payload.role] || '未知',
        remainingUseCount: payload.role === 3 ? mockMerchantRemainingCount : undefined,
      },
    };
  }

  return {
    code: '400',
    msg: '手机号或密码错误',
    data: null,
  };
}

export async function login(payload: LoginPayload): Promise<ApiResponse<{ id: number; phone: string; role: number; roleName: string; remainingUseCount?: number } | null>> {
  if (USE_MOCK_API) {
    return mockLogin(payload);
  }

  const requestBody = {
    ...payload,
    account: payload.phone,
  };

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  return (await response.json()) as ApiResponse<boolean>;
}

export async function getMerchantOptions(options: {
  keyword?: string;
  userId?: number;
  phone?: string;
} = {}): Promise<ApiResponse<MerchantOption[]>> {
  const keyword = options.keyword ?? '';
  const userId = options.userId;
  const phone = options.phone?.trim() ?? '';

  if (USE_MOCK_API) {
    const normalizedKeyword = keyword.trim();
    const scopedByUser = (userId && userId > 0) || phone.length > 0;
    const merchantIdsWithOrders = scopedByUser
      ? new Set(mockOrders.map((order) => order.merchantId))
      : null;
    const data = mockMerchants
      .filter((item) => (merchantIdsWithOrders ? merchantIdsWithOrders.has(item.id) : true))
      .filter((item) => (normalizedKeyword ? item.name.includes(normalizedKeyword) : true))
      .slice(0, 100)
      .map((item) => ({ id: item.id, name: item.name }));
    return { code: '0', msg: 'success', data };
  }

  const query = new URLSearchParams();
  if (keyword.trim()) {
    query.set('keyword', keyword.trim());
  }
  if (userId && userId > 0) {
    query.set('userId', String(userId));
  }
  if (phone) {
    query.set('phone', phone);
  }
  const queryString = query.toString();
  const url = `${API_BASE_URL}/api/merchant/options${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url);
  const result = (await response.json()) as ApiResponse<Array<{ id: string | number; name: string }>>;
  return {
    ...result,
    data: Array.isArray(result.data)
      ? result.data.map((item) => ({
          id: String(item.id),
          name: item.name,
        }))
      : [],
  };
}

export async function getUserOrders(params: {
  phone?: string;
  userId?: number;
  merchantId?: string;
  deviceId?: string;
  pageNo?: number;
  pageSize?: number;
}): Promise<ApiResponse<UserOrder[]>> {
  if (USE_MOCK_API) {
    const merchantId = params.merchantId || '';
    return {
      code: 200,
      msg: 'ok',
      data: merchantId ? mockOrders.filter((order) => order.merchantId === merchantId) : mockOrders,
    };
  }

  const query = new URLSearchParams();
  if (params.phone?.trim()) query.set('phone', params.phone.trim());
  if (params.userId && params.userId > 0) query.set('userId', String(params.userId));
  if (params.merchantId && Number(params.merchantId) > 0) query.set('merchantId', String(Number(params.merchantId)));
  if (params.deviceId && Number(params.deviceId) > 0) query.set('deviceId', String(Number(params.deviceId)));
  query.set('pageNo', String(params.pageNo || 1));
  query.set('pageSize', String(params.pageSize || 50));

  const response = await fetch(`${API_BASE_URL}/api/order/order-records?${query.toString()}`);
  const result = (await response.json()) as ApiResponse<{
    records?: Array<{
      orderId: number;
      merchantId: number;
      projectName: string;
      usageCount: number;
      createdAt?: string;
    }>;
  }>;
  return {
    ...result,
    data: Array.isArray(result.data?.records)
      ? result.data.records.map((item) => ({
          id: String(item.orderId),
          merchantId: String(item.merchantId),
          merchantName: '',
          projectName: item.projectName,
          totalCount: item.usageCount,
          remainingCount: item.usageCount,
        }))
      : [],
  };
}

export async function getUsageRecords(params?: {
  phone?: string;
  userId?: number;
  deviceId?: string;
  pageNo?: number;
  pageSize?: number;
}): Promise<ApiResponse<UsageRecord[]>> {
  if (USE_MOCK_API) {
    return { code: 200, msg: 'ok', data: mockUsageRecords };
  }

  const query = new URLSearchParams();
  if (params?.phone?.trim()) {
    query.set('phone', params.phone.trim());
  }
  if (params?.userId && params.userId > 0) {
    query.set('userId', String(params.userId));
  }
  if (params?.deviceId && Number(params.deviceId) > 0) {
    query.set('deviceId', String(Number(params.deviceId)));
  }
  query.set('pageNo', String(params?.pageNo || 1));
  query.set('pageSize', String(params?.pageSize || 50));

  const response = await fetch(`${API_BASE_URL}/api/order/usage-records?${query.toString()}`);
  const result = (await response.json()) as ApiResponse<{
    records?: UsageRecordQueryRaw[];
  }>;
  return {
    ...result,
    data: Array.isArray(result.data?.records)
      ? result.data.records.map((item) => ({
          id: String(item.orderId),
          orderId: String(item.orderId),
          userPhone: item.userPhone || item.phone || '',
          merchantName: '',
          projectName: item.projectName,
          deviceId: item.deviceId != null ? String(item.deviceId) : '',
          deviceName: item.deviceName || '',
          usedAt: formatDateTime(item.createdAt),
          freeUsage: item.freeUsage,
        }))
      : [],
  };
}

export async function useInstrument(payload: {
  orderId: string;
  deviceId?: string;
  machineNo?: string;
}): Promise<ApiResponse<{ remainingCount: number }> | Record<string, unknown>> {
  if (USE_MOCK_API) {
    const orderIndex = mockOrders.findIndex((order) => order.id === payload.orderId);
    if (orderIndex < 0) {
      return { code: 404, msg: '订单不存在', data: { remainingCount: 0 } };
    }
    if (mockOrders[orderIndex].remainingCount <= 0) {
      return { code: 400, msg: '该订单可用次数已用完', data: { remainingCount: 0 } };
    }

    mockOrders = mockOrders.map((order, index) =>
      index === orderIndex ? { ...order, remainingCount: order.remainingCount - 1 } : order
    );

    const updatedOrder = mockOrders[orderIndex];
    const merchant = mockMerchants.find((item) => item.id === updatedOrder.merchantId);
    const device = merchant?.devices[0];
    mockUsageRecords = [
      {
        id: `${Date.now()}`,
        orderId: updatedOrder.id,
        userPhone: '17612714215',
        merchantName: updatedOrder.merchantName,
        projectName: updatedOrder.projectName,
        deviceId: device?.id || '',
        deviceName: device?.name || '',
        usedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        freeUsage: false,
      },
      ...mockUsageRecords,
    ];

    return {
      code: 200,
      msg: `使用成功，订单ID：${payload.orderId}`,
      data: { remainingCount: updatedOrder.remainingCount },
    };
  }

  const machineNo = payload.machineNo?.trim();
  if (!machineNo) {
    return {
      code: '400',
      msg: '请传machineNo，订单未绑定设备',
      data: { remainingCount: 0 },
    };
  }

  const requestBody = {
    orderId: Number(payload.orderId),
    machineNo,
  };
  const requestUrl = `${API_BASE_URL}/api/hardware/send-by-order`;
  console.log('[useInstrument] POST', requestUrl);
  console.log('[useInstrument] requestBody:', JSON.stringify(requestBody));
  console.log('[useInstrument] machineNo 类型:', typeof machineNo, '值:', machineNo);

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  const result = (await response.json()) as ApiResponse<{ remainingCount: number }> | Record<string, unknown>;
  return result;
}

export async function getProjectCategories(): Promise<ApiResponse<ProjectCategory[]>> {
  if (USE_MOCK_API) {
    return { code: 200, msg: 'ok', data: mockProjectCategories };
  }

  const response = await fetch(`${API_BASE_URL}/api/hardware/projects`);
  const result = (await response.json()) as ApiResponse<ProjectCategory[]> | ProjectCategory[];
  if (Array.isArray(result)) {
    return { code: '0', msg: 'success', data: result };
  }
  return result;
}

export async function createTeacherOrder(payload: TeacherOrderPayload): Promise<ApiResponse<CreateOrderResult>> {
  if (USE_MOCK_API) {
    if (!payload.name.trim()) {
      return { code: '400', msg: '用户姓名不能为空', data: null as unknown as CreateOrderResult };
    }
    const orderId = Date.now();
    return {
      code: '0',
      msg: 'success',
      data: {
        orderId,
        userId: 1001,
        phone: payload.phone,
        merchantId: Number(payload.merchantId) || 0,
        projectName: payload.projectName,
        projectDuration: payload.durationMinutes,
        usageCount: payload.usageCount,
        newUserCreated: false,
        initialPassword: null,
      },
    };
  }

  const requestBody = {
    phone: payload.phone,
    name: payload.name.trim(),
    gender: payload.gender === '男' ? 0 : 1,
    age: payload.age,
    height: payload.height,
    weight: payload.weight,
    sportPerformance: payload.exercisePerformance,
    projectName: payload.projectName,
    projectDuration: payload.durationMinutes,
    merchantId: Number(payload.merchantId),
    usageCount: payload.usageCount,
  };

  const response = await fetch(`${API_BASE_URL}/api/order/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  return (await response.json()) as ApiResponse<CreateOrderResult>;
}

export async function createCustomTeacherOrder(
  payload: CustomTeacherOrderPayload
): Promise<ApiResponse<CreateOrderResult>> {
  if (USE_MOCK_API) {
    if (!payload.name.trim()) {
      return { code: '400', msg: '用户姓名不能为空', data: null as unknown as CreateOrderResult };
    }
    const orderId = Date.now();
    return {
      code: '0',
      msg: 'success',
      data: {
        orderId,
        userId: 1001,
        phone: payload.phone,
        merchantId: Number(payload.merchantId) || 0,
        projectName: '自定义选择',
        projectDuration: payload.durationMinutes,
        usageCount: payload.usageCount,
        newUserCreated: false,
        initialPassword: null,
      },
    };
  }

  const requestBody: Record<string, number | string> = {
    phone: payload.phone,
    name: payload.name.trim(),
    gender: payload.gender === '男' ? 0 : 1,
    age: payload.age,
    height: payload.height,
    weight: payload.weight,
    sportPerformance: payload.exercisePerformance,
    projectDuration: payload.durationMinutes,
    merchantId: Number(payload.merchantId),
    usageCount: payload.usageCount,
  };
  if (payload.deviceId && Number(payload.deviceId) > 0) {
    requestBody.deviceId = Number(payload.deviceId);
  }

  const response = await fetch(`${API_BASE_URL}/api/order/create-custom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  return (await response.json()) as ApiResponse<CreateOrderResult>;
}

export async function bindTeacherDevice(payload: {
  teacherId: number;
  merchantId: number;
  deviceId: number;
}): Promise<ApiResponse<{ teacherId: number; merchantId: number; deviceId: number; alreadyBound: boolean }>> {
  if (USE_MOCK_API) {
    const merchant = mockMerchants.find((item) => Number(item.id) === payload.merchantId);
    const device = merchant?.devices.find((item) => Number(item.id) === payload.deviceId);
    if (!merchant || !device) {
      return {
        code: '400',
        msg: '商家或设备不存在',
        data: {
          teacherId: payload.teacherId,
          merchantId: payload.merchantId,
          deviceId: payload.deviceId,
          alreadyBound: false,
        },
      };
    }

    const exists = mockTeacherBindings.some(
      (item) => Number(item.merchantId) === payload.merchantId && Number(item.deviceId) === payload.deviceId
    );
    if (!exists) {
      mockTeacherBindings = [
        {
          id: `tb-${Date.now()}`,
          merchantId: merchant.id,
          merchantName: merchant.name,
          deviceId: device.id,
          deviceName: device.name,
          usageCount: 0,
          boundAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        },
        ...mockTeacherBindings,
      ];
    }
    return {
      code: '0',
      msg: 'success',
      data: {
        teacherId: payload.teacherId,
        merchantId: payload.merchantId,
        deviceId: payload.deviceId,
        alreadyBound: exists,
      },
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/teacher-device/bind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return (await response.json()) as ApiResponse<boolean>;
}

export async function getTeacherBindings(teacherId: number, merchantId?: number): Promise<ApiResponse<TeacherBinding[]>> {
  if (USE_MOCK_API) {
    const filtered = merchantId
      ? mockTeacherBindings.filter((item) => Number(item.merchantId) === merchantId)
      : mockTeacherBindings;
    return { code: '0', msg: 'success', data: filtered };
  }

  if (!teacherId || teacherId <= 0) {
    return { code: '400', msg: 'teacherId不能为空且必须大于0', data: [] };
  }

  const query = new URLSearchParams();
  query.set('teacherId', String(teacherId));
  if (merchantId && merchantId > 0) {
    query.set('merchantId', String(merchantId));
  }

  const response = await fetch(`${API_BASE_URL}/api/teacher-device/bound-list?${query.toString()}`);
  const result = (await response.json()) as ApiResponse<TeacherBoundDeviceRaw[]>;
  return {
    ...result,
    data: Array.isArray(result.data)
      ? result.data.map((item) => ({
          id: String(item.bindId),
          merchantId: String(item.merchantId),
          merchantName: item.merchantName,
          deviceId: String(item.deviceId),
          deviceName: item.deviceName || item.machineNo,
          usageCount: 0,
          boundAt: formatDateTime(item.bindTime),
        }))
      : [],
  };
}

export async function getTeacherDeviceUsageLogs(deviceId: string): Promise<ApiResponse<UsageRecord[]>> {
  if (USE_MOCK_API) {
    const data = mockUsageRecords.filter((record) => record.deviceId === deviceId);
    return { code: 200, msg: 'ok', data };
  }

  const result = await getMerchantOrderConsumeRecords({
    deviceId,
    pageNo: 1,
    pageSize: 100,
  });

  if (String(result.code) !== '0' && String(result.code) !== '200') {
    return { code: result.code, msg: result.msg || '获取使用流水失败', data: [] };
  }

  return {
    code: result.code,
    msg: result.msg || 'success',
    data: result.data.records,
  };
}

export async function getDevicesByMerchantId(merchantId: string): Promise<ApiResponse<MerchantDevice[]>> {
  if (USE_MOCK_API) {
    const merchant = mockMerchants.find((item) => item.id === merchantId);
    return { code: '0', msg: 'success', data: merchant?.devices || [] };
  }

  const merchantIdNum = Number(merchantId);
  if (!merchantIdNum || merchantIdNum <= 0) {
    return { code: '400', msg: 'merchantId不能为空且必须大于0', data: [] };
  }

  const response = await fetch(
    `${API_BASE_URL}/api/device/list-by-merchant?merchantId=${encodeURIComponent(String(merchantIdNum))}`
  );
  const result = (await response.json()) as ApiResponse<MerchantDeviceByMerchantRaw[]>;
  return {
    ...result,
    data: Array.isArray(result.data)
      ? result.data.map((item) => ({
          id: String(item.id),
          name: item.deviceName || String(item.machineNo ?? ''),
          machineNo: item.machineNo != null ? String(item.machineNo) : undefined,
        }))
      : [],
  };
}

export async function getMerchantDevices(merchantId: string): Promise<ApiResponse<MerchantDeviceSummary[]>> {
  if (USE_MOCK_API) {
    return { code: 200, msg: 'ok', data: mockMerchantOwnedDevices };
  }

  const merchantIdNum = Number(merchantId);
  if (!merchantIdNum || merchantIdNum <= 0) {
    return { code: '400', msg: 'merchantId不能为空且必须大于0', data: [] };
  }

  const response = await fetch(
    `${API_BASE_URL}/api/device/list-by-merchant?merchantId=${encodeURIComponent(String(merchantIdNum))}`
  );
  const result = (await response.json()) as ApiResponse<MerchantDeviceByMerchantRaw[]>;
  return {
    ...result,
    data: Array.isArray(result.data)
      ? result.data.map((item) => ({
          deviceId: String(item.id),
          deviceName: item.deviceName || item.machineNo,
          freeExpireAt: formatDateTime(item.freeUseDeadline || '-'),
          deviceFreeUsageCount: item.deviceFreeUsageCount ?? 0,
          deviceNonFreeUsageCount: item.deviceNonFreeUsageCount ?? 0,
        }))
      : [],
  };
}

export async function manualRefreshDevice(deviceId: number): Promise<ApiResponse<null>> {
  if (USE_MOCK_API) {
    return { code: '0', msg: 'success', data: null };
  }

  const response = await fetch(`${API_BASE_URL}/api/device/${deviceId}/manual-refresh`, {
    method: 'PUT',
  });
  return (await response.json()) as ApiResponse<null>;
}

export interface UsageRecordPageResult {
  records: UsageRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export async function getMerchantOrderConsumeRecords(params: {
  deviceId: string;
  phone?: string;
  pageNo?: number;
  pageSize?: number;
}): Promise<ApiResponse<UsageRecordPageResult>> {
  const pageNo = params.pageNo || 1;
  const pageSize = params.pageSize || 10;
  const trimmedPhone = params.phone?.trim();
  const deviceId = params.deviceId;

  if (USE_MOCK_API) {
    const filtered = mockUsageRecords.filter((item) => {
      if (deviceId && item.deviceId !== deviceId) return false;
      if (trimmedPhone && !item.userPhone.includes(trimmedPhone)) return false;
      return true;
    });
    const start = (pageNo - 1) * pageSize;
    const records = filtered.slice(start, start + pageSize);
    return {
      code: '0',
      msg: 'success',
      data: {
        records,
        total: filtered.length,
        pageNo,
        pageSize,
      },
    };
  }
  if (!deviceId) {
    return {
      code: '400',
      msg: 'deviceId不能为空',
      data: { records: [], total: 0, pageNo, pageSize },
    };
  }
  const query = new URLSearchParams();
  query.set('deviceId', String(Number(deviceId)));
  query.set('pageNo', String(pageNo));
  query.set('pageSize', String(pageSize));
  if (trimmedPhone) {
    query.set('phone', trimmedPhone);
  }
  const response = await fetch(`${API_BASE_URL}/api/order/usage-records?${query.toString()}`);
  const result = (await response.json()) as ApiResponse<OrderUsageRecordRaw[] | OrderUsageRecordPageData>;

  if (String(result.code) !== '0' && String(result.code) !== '200') {
    return { code: result.code, msg: result.msg || '获取订单消耗记录失败', data: { records: [], total: 0, pageNo, pageSize } };
  }
  const pageData = !Array.isArray(result.data) && result.data && typeof result.data === 'object'
    ? (result.data as OrderUsageRecordPageData)
    : undefined;
  const rawRecords = Array.isArray(result.data)
    ? result.data
    : pageData?.records || pageData?.list || pageData?.items || pageData?.content || [];
  const records = rawRecords
    .map((item) => ({
      id: String(item.id ?? `${item.orderId ?? ''}-${item.deviceId ?? ''}-${item.createdAt ?? item.usedAt ?? ''}`),
      orderId: String(item.orderId ?? item.id ?? ''),
      userPhone: item.userPhone || item.phone || item.userName || item.username || item.nickName || '',
      merchantName: item.merchantName || '',
      projectName: item.projectName || '',
      deviceId: String(item.deviceId ?? ''),
      deviceName: item.deviceName || item.machineNo || String(item.deviceId ?? ''),
      usedAt: formatDateTime(item.usedAt || item.createdAt || item.createTime || ''),
      freeUsage: item.freeUsage,
    }));
  const total = pageData?.total ?? pageData?.totalCount ?? rawRecords.length;
  const resolvedPageNo = pageData?.pageNo ?? pageData?.pageNum ?? pageNo;
  const resolvedPageSize = pageData?.pageSize ?? pageData?.size ?? pageSize;

  return { code: String(result.code), msg: result.msg || 'success', data: { records, total, pageNo: resolvedPageNo, pageSize: resolvedPageSize } };
}

export async function getMerchantRemainingCount(): Promise<ApiResponse<number>> {
  if (USE_MOCK_API) {
    return { code: 200, msg: 'ok', data: mockMerchantRemainingCount };
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/merchant/remaining-count`);
  return (await response.json()) as ApiResponse<number>;
}

export async function getDeveloperDevices(developerId: string): Promise<ApiResponse<DeveloperDeviceSummary[]>> {
  if (USE_MOCK_API) {
    return { code: 200, msg: 'ok', data: mockDeveloperDevices };
  }
  const developerIdNum = Number(developerId);
  if (!developerIdNum || developerIdNum <= 0) {
    return { code: '400', msg: 'developerId不能为空且必须大于0', data: [] };
  }
  const response = await fetch(
    `${API_BASE_URL}/api/developer-merchant/bound-list?developerId=${encodeURIComponent(String(developerIdNum))}`
  );
  const result = (await response.json()) as ApiResponse<DeveloperBoundDeviceRaw[]>;
  return {
    ...result,
    data: Array.isArray(result.data)
      ? result.data.map((item) => ({
          merchantId: String(item.merchantId),
          merchantName: item.merchantName,
          deviceId: String(item.deviceId),
          deviceName: item.deviceName || item.machineNo,
          freeExpireAt: formatDateTime(item.freeUseDeadline || '-'),
          merchantUsageCount: item.merchantTotalDeviceUsageCount ?? 0,
          deviceUsageCount: item.deviceUsageCount ?? 0,
          deviceFreeUsageCount: item.deviceFreeUsageCount ?? 0,
          deviceNonFreeUsageCount: item.deviceNonFreeUsageCount ?? 0,
        }))
      : [],
  };
}

export async function getDeveloperRemainingCount(): Promise<ApiResponse<number>> {
  if (USE_MOCK_API) {
    return { code: 200, msg: 'ok', data: mockDeveloperRemainingCount };
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/developer/remaining-count`);
  return (await response.json()) as ApiResponse<number>;
}

export interface WithdrawRecordPageResult {
  total: number;
  pageNo: number;
  pageSize: number;
  records: WithdrawRecord[];
}

export async function getWithdrawRecords(params: {
  developerId: string;
  pageNo?: number;
  pageSize?: number;
}): Promise<ApiResponse<WithdrawRecordPageResult>> {
  const pageNo = params.pageNo || 1;
  const pageSize = params.pageSize || 10;
  if (USE_MOCK_API) {
    const start = (pageNo - 1) * pageSize;
    return {
      code: '0',
      msg: 'success',
      data: {
        total: mockWithdrawRecords.length,
        pageNo,
        pageSize,
        records: mockWithdrawRecords.slice(start, start + pageSize),
      },
    };
  }

  const developerIdNum = Number(params.developerId);
  if (!developerIdNum || developerIdNum <= 0) {
    return {
      code: '400',
      msg: 'developerId不能为空且必须大于0',
      data: { total: 0, pageNo, pageSize, records: [] },
    };
  }

  const query = new URLSearchParams({
    developerId: String(developerIdNum),
    pageNo: String(pageNo),
    pageSize: String(pageSize),
  });
  const response = await fetch(`${API_BASE_URL}/api/developer-merchant/withdraw-records?${query.toString()}`);
  const result = (await response.json()) as ApiResponse<WithdrawRecordPageRaw>;
  return {
    ...result,
    data: result.data
      ? {
          total: result.data.total ?? 0,
          pageNo: result.data.pageNo ?? pageNo,
          pageSize: result.data.pageSize ?? pageSize,
          records: (result.data.records || []).map((item) => ({
            id: String(item.withdrawRecordId),
            clickedAt: formatDateTime(item.createdAt),
            usageCount: item.usageCountSnapshot,
          })),
        }
      : { total: 0, pageNo, pageSize, records: [] },
  };
}

export async function createWithdraw(developerId: string): Promise<ApiResponse<WithdrawRecord>> {
  if (USE_MOCK_API) {
    const record: WithdrawRecord = {
      id: `w-${Date.now()}`,
      clickedAt: formatDateTime(new Date().toISOString()),
      usageCount: mockUsageRecords.length,
    };
    mockWithdrawRecords = [record, ...mockWithdrawRecords];
    return { code: 200, msg: '提现成功请等待后台审核', data: record };
  }

  const developerIdNum = Number(developerId);
  if (!developerIdNum || developerIdNum <= 0) {
    return { code: '400', msg: 'developerId不能为空且必须大于0', data: { id: '', clickedAt: '', usageCount: 0 } };
  }

  const response = await fetch(`${API_BASE_URL}/api/developer-merchant/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ developerId: developerIdNum }),
  });
  const result = (await response.json()) as ApiResponse<CreateWithdrawRaw>;
  return {
    ...result,
    data: result.data
      ? {
          id: String(result.data.withdrawRecordId),
          clickedAt: formatDateTime(result.data.createdAt),
          usageCount: result.data.usageCountSnapshot,
        }
      : { id: '', clickedAt: '', usageCount: 0 },
  };
}
