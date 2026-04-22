import { UserRole } from './supabase';

export interface ApiResponse<T> {
  code: string | number;
  msg: string;
  data: T;
}

export interface LoginPayload {
  userName: string;
  password: string;
  role: number;
}

export interface MerchantDevice {
  id: string;
  name: string;
}

export interface Merchant {
  id: string;
  name: string;
  devices: MerchantDevice[];
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
  merchantName: string;
  projectName: string;
  deviceId: string;
  deviceName: string;
  usedAt: string;
}

export interface ProjectCategory {
  categoryName: string;
  projects: string[];
}

export interface TeacherOrderPayload {
  phone: string;
  gender: '男' | '女';
  age: number;
  height: number;
  weight: number;
  projectName: string;
  durationMinutes: number;
  merchantId: string;
}

export interface TeacherBinding {
  id: string;
  merchantId: string;
  merchantName: string;
  deviceId: string;
  deviceName: string;
  boundAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://30.00.00.00:8080';
// 是否使用mock数据
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

const mockUsers = [
  { userName: '17612714215', password: '123456' },
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
    merchantName: '美丽门店A',
    projectName: '补水焕肤',
    deviceId: 'dev-a-01',
    deviceName: '超声美容仪A01',
    usedAt: '2026/04/18 10:30:00',
  },
  {
    id: 'u2',
    orderId: 'o2',
    merchantName: '美丽门店A',
    projectName: '紧致提升',
    deviceId: 'dev-a-02',
    deviceName: '射频美容仪A02',
    usedAt: '2026/04/19 14:10:00',
  },
  {
    id: 'u3',
    orderId: 'o3',
    merchantName: '美丽门店B',
    projectName: '深层清洁',
    deviceId: 'dev-b-01',
    deviceName: '光子美容仪B01',
    usedAt: '2026/04/20 16:45:00',
  },
];

const mockProjectCategories: ProjectCategory[] = [
  {
    categoryName: '日常训练',
    projects: [
      '肩颈深度解压',
      '背脊通衡养护',
      '腰骶温养呵护',
      '胸肋呼吸舒展',
      '腹区温蕴舒压',
      '臀腿活力焕新',
      '小腿轻盈舒缓',
      '足踝稳泰调理',
      '上臂肱桡释能',
      '前臂腕指松解',
    ],
  },
  {
    categoryName: '塑形紧致',
    projects: [
      '直角肩养成',
      '天鹅臂精雕',
      '手臂纤细雕刻',
      '美背塑形',
      '腰际线精雕',
      '马甲线雕刻',
      '蜜桃臀塑造',
      '大腿内侧紧致',
      '小腿线条优化',
      '跟腱显现雕刻',
    ],
  },
];

let mockTeacherBindings: TeacherBinding[] = [
  {
    id: 'tb1',
    merchantId: 'm1',
    merchantName: '美丽门店A',
    deviceId: 'dev-a-01',
    deviceName: '超声美容仪A01',
    boundAt: '2026/04/20 09:20:00',
  },
];

export const roleCodeMap: Record<UserRole, number> = {
  user: 1,
  teacher: 2,
  merchant: 3,
  developer: 4,
};

async function mockLogin(payload: LoginPayload): Promise<ApiResponse<boolean>> {
  const matched = mockUsers.some(
    (user) => user.userName === payload.userName && user.password === payload.password
  );

  if (matched) {
    return {
      code: 200,
      msg: '登录成功',
      data: true,
    };
  }

  return {
    code: 401,
    msg: '用户名或密码错误',
    data: false,
  };
}

export async function login(payload: LoginPayload): Promise<ApiResponse<boolean>> {
  if (USE_MOCK_API) {
    return mockLogin(payload);
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as ApiResponse<boolean>;
}

export async function getMerchantsAndDevices(): Promise<ApiResponse<Merchant[]>> {
  if (USE_MOCK_API) {
    return { code: 200, msg: 'ok', data: mockMerchants };
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/merchants-with-devices`);
  return (await response.json()) as ApiResponse<Merchant[]>;
}

export async function getUserOrders(merchantId: string): Promise<ApiResponse<UserOrder[]>> {
  if (USE_MOCK_API) {
    return {
      code: 200,
      msg: 'ok',
      data: mockOrders.filter((order) => order.merchantId === merchantId),
    };
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/orders?merchantId=${encodeURIComponent(merchantId)}`);
  return (await response.json()) as ApiResponse<UserOrder[]>;
}

export async function getUsageRecords(): Promise<ApiResponse<UsageRecord[]>> {
  if (USE_MOCK_API) {
    return { code: 200, msg: 'ok', data: mockUsageRecords };
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/usage-records`);
  return (await response.json()) as ApiResponse<UsageRecord[]>;
}

export async function useInstrument(payload: {
  orderId: string;
  deviceId: string;
}): Promise<ApiResponse<{ remainingCount: number }>> {
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
    const device = merchant?.devices.find((item) => item.id === payload.deviceId);
    mockUsageRecords = [
      {
        id: `${Date.now()}`,
        orderId: updatedOrder.id,
        merchantName: updatedOrder.merchantName,
        projectName: updatedOrder.projectName,
        deviceId: payload.deviceId,
        deviceName: device?.name || payload.deviceId,
        usedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      },
      ...mockUsageRecords,
    ];

    return {
      code: 200,
      msg: `使用成功，设备ID：${payload.deviceId}`,
      data: { remainingCount: updatedOrder.remainingCount },
    };
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/use-instrument`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return (await response.json()) as ApiResponse<{ remainingCount: number }>;
}

export async function getProjectCategories(): Promise<ApiResponse<ProjectCategory[]>> {
  if (USE_MOCK_API) {
    return { code: 200, msg: 'ok', data: mockProjectCategories };
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/projects`);
  return (await response.json()) as ApiResponse<ProjectCategory[]>;
}

export async function createTeacherOrder(payload: TeacherOrderPayload): Promise<ApiResponse<{ orderId: string }>> {
  if (USE_MOCK_API) {
    const orderId = `t-${Date.now()}`;
    return { code: 200, msg: '下单成功', data: { orderId } };
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/teacher/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return (await response.json()) as ApiResponse<{ orderId: string }>;
}

export async function bindTeacherDevice(payload: {
  merchantId: string;
  deviceId: string;
}): Promise<ApiResponse<boolean>> {
  if (USE_MOCK_API) {
    const merchant = mockMerchants.find((item) => item.id === payload.merchantId);
    const device = merchant?.devices.find((item) => item.id === payload.deviceId);
    if (!merchant || !device) {
      return { code: 400, msg: '商家或设备不存在', data: false };
    }

    const exists = mockTeacherBindings.some(
      (item) => item.merchantId === payload.merchantId && item.deviceId === payload.deviceId
    );
    if (!exists) {
      mockTeacherBindings = [
        {
          id: `tb-${Date.now()}`,
          merchantId: merchant.id,
          merchantName: merchant.name,
          deviceId: device.id,
          deviceName: device.name,
          boundAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        },
        ...mockTeacherBindings,
      ];
    }
    return { code: 200, msg: exists ? '该设备已绑定' : '绑定成功', data: true };
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/teacher/bind-device`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return (await response.json()) as ApiResponse<boolean>;
}

export async function getTeacherBindings(): Promise<ApiResponse<TeacherBinding[]>> {
  if (USE_MOCK_API) {
    return { code: 200, msg: 'ok', data: mockTeacherBindings };
  }

  const response = await fetch(`${API_BASE_URL}/mljxt/teacher/bindings`);
  return (await response.json()) as ApiResponse<TeacherBinding[]>;
}
