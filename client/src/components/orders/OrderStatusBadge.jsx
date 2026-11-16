import { ORDER_STATUS } from '../../utils/orders.js';

function OrderStatusBadge({ status }) {
  const { label, className } = ORDER_STATUS[status] ?? ORDER_STATUS.PENDING_PAYMENT;
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}

export default OrderStatusBadge;
