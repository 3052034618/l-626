import type {
  User,
  Appointment,
  BlacklistItem,
  AccessRecord,
} from '../../shared/types';

const today = new Date('2026-06-15');
const iso = (d: Date) => d.toISOString();

const addHours = (base: Date, hours: number) => {
  const d = new Date(base);
  d.setHours(d.getHours() + hours);
  return d;
};

export const initialUsers: User[] = [
  { id: 'u1', name: '张经理', phone: '13800000001', role: 'employee', department: '技术部' },
  { id: 'u2', name: '李主管', phone: '13800000002', role: 'employee', department: '市场部' },
  { id: 'u5', name: '王工程师', phone: '13800000005', role: 'employee', department: '技术部' },
  { id: 'u6', name: '刘总监', phone: '13800000006', role: 'employee', department: '市场部' },
  { id: 'u7', name: '陈HR', phone: '13800000007', role: 'employee', department: '人力资源部' },
  { id: 'u3', name: '王保安', phone: '13900000001', role: 'security', department: '安保部' },
  { id: 'u4', name: '赵管理员', phone: '13700000001', role: 'admin', department: '行政部' },
];

export const initialBlacklist: BlacklistItem[] = [
  {
    id: 'b1',
    visitorName: '陈某某',
    visitorPhone: '13600000001',
    reason: '上次来访有不当行为，扰乱办公秩序',
    addedAt: '2026-06-01T10:00:00Z',
    addedBy: 'u4',
  },
  {
    id: 'b2',
    visitorName: '王黑名单',
    visitorPhone: '13600000002',
    reason: '未登记强行闯入',
    addedAt: '2026-06-05T14:30:00Z',
    addedBy: 'u3',
  },
];

export const initialAppointments: Appointment[] = [
  {
    id: 'a1',
    visitorName: '刘客户',
    visitorPhone: '13500000001',
    visitedEmployeeId: 'u1',
    visitedEmployeeName: '张经理',
    visitedDepartment: '技术部',
    purpose: '项目对接洽谈',
    appointmentDate: '2026-06-15',
    appointmentTime: '10:00',
    status: 'approved',
    qrCode: 'QR-VISITOR-A1-20260615',
    createdAt: iso(addHours(today, -20)),
    expiresAt: iso(addHours(today, 0.25)),
    approvedAt: iso(addHours(today, -18)),
  },
  {
    id: 'a2',
    visitorName: '孙合作方',
    visitorPhone: '13500000002',
    visitedEmployeeId: 'u2',
    visitedEmployeeName: '李主管',
    visitedDepartment: '市场部',
    purpose: '商务合作洽谈',
    appointmentDate: '2026-06-15',
    appointmentTime: '09:30',
    status: 'checked_in',
    qrCode: 'QR-VISITOR-A2-20260615',
    createdAt: iso(addHours(today, -24)),
    expiresAt: iso(addHours(today, -0.5)),
    approvedAt: iso(addHours(today, -22)),
    checkedInAt: iso(addHours(today, -1)),
  },
  {
    id: 'a3',
    visitorName: '周面试者',
    visitorPhone: '13500000003',
    visitedEmployeeId: 'u7',
    visitedEmployeeName: '陈HR',
    visitedDepartment: '人力资源部',
    purpose: '面试应聘',
    appointmentDate: '2026-06-15',
    appointmentTime: '14:00',
    status: 'pending',
    qrCode: 'QR-VISITOR-A3-20260615',
    createdAt: iso(addHours(today, -2)),
    expiresAt: iso(addHours(today, 4.25)),
  },
  {
    id: 'a4',
    visitorName: '吴供应商',
    visitorPhone: '13500000004',
    visitedEmployeeId: 'u5',
    visitedEmployeeName: '王工程师',
    visitedDepartment: '技术部',
    purpose: '设备维护',
    appointmentDate: '2026-06-15',
    appointmentTime: '11:00',
    status: 'pending',
    qrCode: 'QR-VISITOR-A4-20260615',
    createdAt: iso(addHours(today, -1)),
    expiresAt: iso(addHours(today, 1.25)),
  },
  {
    id: 'a5',
    visitorName: '郑顾问',
    visitorPhone: '13500000005',
    visitedEmployeeId: 'u6',
    visitedEmployeeName: '刘总监',
    visitedDepartment: '市场部',
    purpose: '咨询服务',
    appointmentDate: '2026-06-15',
    appointmentTime: '15:30',
    status: 'approved',
    qrCode: 'QR-VISITOR-A5-20260615',
    createdAt: iso(addHours(today, -10)),
    expiresAt: iso(addHours(today, 5.75)),
    approvedAt: iso(addHours(today, -8)),
  },
  {
    id: 'a6',
    visitorName: '黄客户',
    visitorPhone: '13500000006',
    visitedEmployeeId: 'u1',
    visitedEmployeeName: '张经理',
    visitedDepartment: '技术部',
    purpose: '产品演示',
    appointmentDate: '2026-06-14',
    appointmentTime: '10:00',
    status: 'checked_out',
    qrCode: 'QR-VISITOR-A6-20260614',
    createdAt: '2026-06-13T09:00:00Z',
    expiresAt: '2026-06-14T10:15:00Z',
    approvedAt: '2026-06-13T10:00:00Z',
    checkedInAt: '2026-06-14T09:55:00Z',
    checkedOutAt: '2026-06-14T11:30:00Z',
  },
  {
    id: 'a7',
    visitorName: '林快递',
    visitorPhone: '13500000007',
    visitedEmployeeId: 'u4',
    visitedEmployeeName: '赵管理员',
    visitedDepartment: '行政部',
    purpose: '快递送达',
    appointmentDate: '2026-06-15',
    appointmentTime: '16:00',
    status: 'rejected',
    qrCode: 'QR-VISITOR-A7-20260615',
    createdAt: iso(addHours(today, -3)),
    expiresAt: iso(addHours(today, 6.25)),
    rejectReason: '请将快递放至前台代收点',
  },
];

export const initialAccessRecords: AccessRecord[] = [
  {
    id: 'r1',
    appointmentId: 'a2',
    visitorName: '孙合作方',
    visitorPhone: '13500000002',
    action: 'check_in',
    timestamp: iso(addHours(today, -1)),
    operatorId: 'u3',
  },
  {
    id: 'r2',
    appointmentId: 'a6',
    visitorName: '黄客户',
    visitorPhone: '13500000006',
    action: 'check_in',
    timestamp: '2026-06-14T09:55:00Z',
    operatorId: 'u3',
  },
  {
    id: 'r3',
    appointmentId: 'a6',
    visitorName: '黄客户',
    visitorPhone: '13500000006',
    action: 'check_out',
    timestamp: '2026-06-14T11:30:00Z',
    operatorId: 'u3',
  },
];

class InMemoryStore {
  users: User[] = [...initialUsers];
  appointments: Appointment[] = [...initialAppointments];
  blacklist: BlacklistItem[] = [...initialBlacklist];
  accessRecords: AccessRecord[] = [...initialAccessRecords];
}

export const store = new InMemoryStore();
