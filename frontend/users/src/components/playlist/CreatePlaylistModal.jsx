import React from "react";
import { PlaylistFormModal } from "./PlaylistFormModal";

/**
 * Modal Tạo danh sách phát (Playlist) mới
 * Tái sử dụng giao diện và logic từ PlaylistFormModal với mode="create"
 * - Nút hành động mang màu primary (#fa2d48)
 * - Tự động tạo tên mặc định "Playlist # số thứ tự" nếu người dùng không nhập gì
 */
export const CreatePlaylistModal = ({ isOpen, onClose, onSuccess }) => {
  return (
    <PlaylistFormModal
      isOpen={isOpen}
      onClose={onClose}
      mode="create"
      onSuccess={onSuccess}
    />
  );
};
