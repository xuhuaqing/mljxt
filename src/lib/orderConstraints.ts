export const FIXED_DURATION_CATEGORY_NAMES = ['日常训练', '塑形紧致'];
export const CUSTOM_ORDER_CATEGORY_NAME = '自定义';
export const CUSTOM_PROJECT_NAME = '自定义选择';
export const SPORT_PERFORMANCE_CATEGORY_NAME = '运动表现';

/** 商家端下单页不展示的项目大类 */
export const MERCHANT_HIDDEN_CATEGORY_NAMES = [CUSTOM_ORDER_CATEGORY_NAME, SPORT_PERFORMANCE_CATEGORY_NAME];

export function isFixedDurationCategory(categoryName: string): boolean {
  return FIXED_DURATION_CATEGORY_NAMES.includes(categoryName);
}

export function isCustomOrderCategory(categoryName: string): boolean {
  return categoryName === CUSTOM_ORDER_CATEGORY_NAME;
}

export const parseUsageCountInput = (value: string): number | '' => {
  const digits = value.replace(/\D/g, '');
  return digits === '' ? '' : Number(digits);
};

export const parseDurationMinutesInput = (value: string): number | '' => {
  const digits = value.replace(/\D/g, '');
  return digits === '' ? '' : Number(digits);
};
