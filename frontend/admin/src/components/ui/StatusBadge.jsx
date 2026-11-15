import React from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Lock } from "lucide-react";

/**
 * StatusBadge: Huy hiệu hiển thị trạng thái
 * - PENDING: Chờ kiểm duyệt (Vàng)
 * - APPROVED / ACTIVE: Đã duyệt / Hoạt động (Xanh lá)
 * - REJECTED: Bị từ chối (Đỏ)
 * - TAKEDOWN: Đã gỡ bỏ (Xám đen)
 * - INACTIVE / LOCKED: Đã khóa (Đỏ cam)
 */
export const StatusBadge = ({ status, size = "md", className = "" }) => {
  const normalizedStatus = (status || "").toUpperCase();

  const configMap = {
    PENDING: {
      label: "Chờ kiểm duyệt",
      icon: Clock,
      classes: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    },
    APPROVED: {
      label: "Đã công khai",
      icon: CheckCircle2,
      classes: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    },
    REJECTED: {
      label: "Bị từ chối",
      icon: XCircle,
      classes: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
    },
    TAKEDOWN: {
      label: "Đã gỡ bỏ",
      icon: AlertTriangle,
      classes: "bg-neutral-800 text-neutral-400 border border-neutral-700/60",
    },
    ACTIVE: {
      label: "Hoạt động",
      icon: ShieldCheck,
      classes: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    },
    INACTIVE: {
      label: "Đã khóa",
      icon: Lock,
      classes: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
    },
    LOCKED: {
      label: "Đã khóa",
      icon: Lock,
      classes: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
    },
  };

  const current = configMap[normalizedStatus] || {
    label: normalizedStatus || "Không xác định",
    icon: Clock,
    classes: "bg-neutral-800 text-neutral-400 border border-neutral-700/60",
  };

  const Icon = current.icon;

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5 font-medium",
    lg: "text-sm px-3 py-1.5 gap-2 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full select-none tracking-wide ${current.classes} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <Icon size={size === "sm" ? 12 : 14} className="flex-shrink-0" />
      <span>{current.label}</span>
    </span>
  );
};

export default StatusBadge;

