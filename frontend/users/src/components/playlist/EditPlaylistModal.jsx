import React from "react";
import { PlaylistFormModal } from "./PlaylistFormModal";

/**
 * Modal Sửa thông tin chi tiết danh sách phát (Playlist)
 * Tái sử dụng giao diện và logic từ PlaylistFormModal với mode="edit"
 */
export const EditPlaylistModal = ({ isOpen, onClose, playlist, onSuccess }) => {
  return (
    <PlaylistFormModal
      isOpen={isOpen}
      onClose={onClose}
      mode="edit"
      playlist={playlist}
      onSuccess={onSuccess}
    />
  );
};
