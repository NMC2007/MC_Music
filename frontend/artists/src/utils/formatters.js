/**
 * Định dạng số thành chuỗi có dấu phẩy ngăn cách hàng nghìn (VD: 1,234,567)
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
};

/**
 * Định dạng số giây thành chuỗi thời lượng mm:ss (VD: 215 -> "3:35")
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * Định dạng ngày tháng ISO thành dd/mm/yyyy
 */
export const formatDate = (dateString) => {
  if (!dateString) return "Chưa cập nhật";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
};
