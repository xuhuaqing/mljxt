interface TopToastProps {
  message: string;
}

const englishMessageMap: Record<string, string> = {
  success: '操作成功',
  ok: '操作成功',
  failed: '操作失败',
  fail: '操作失败',
  error: '操作失败',
};

/** 将接口返回的英文提示转为中文；已是中文则原样返回 */
export function toChineseToastMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return '';

  if (/[\u4e00-\u9fff]/.test(trimmed)) {
    return trimmed;
  }

  const mapped = englishMessageMap[trimmed.toLowerCase()];
  if (mapped) return mapped;

  if (/success/i.test(trimmed)) return '操作成功';
  if (/fail|error/i.test(trimmed)) return '操作失败';

  return trimmed;
}

function toastVariant(message: string): 'success' | 'error' | 'warning' {
  if (/成功|已绑定|提现成功/.test(message)) return 'success';
  if (/请输入|请选择|请填写|不能为空|有效|用户姓名/.test(message)) return 'warning';
  if (/失败|错误|暂无|请检查|未获取|操作失败/.test(message)) return 'error';
  return 'success';
}

const variantStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-amber-400 text-amber-950',
};

export default function TopToast({ message }: TopToastProps) {
  const displayMessage = toChineseToastMessage(message);
  if (!displayMessage) return null;

  const variant = toastVariant(displayMessage);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={`toast-slide-down w-full max-w-sm rounded-xl px-4 py-2.5 text-center text-sm font-medium leading-snug shadow-lg ${variantStyles[variant]}`}
      >
        {displayMessage}
      </div>
    </div>
  );
}
